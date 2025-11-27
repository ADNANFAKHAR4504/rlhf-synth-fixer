r'''
# `aws_lexv2models_slot_type`

Refer to the Terraform Registry for docs: [`aws_lexv2models_slot_type`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type).
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


class Lexv2ModelsSlotType(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotType",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type aws_lexv2models_slot_type}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        bot_id: builtins.str,
        bot_version: builtins.str,
        locale_id: builtins.str,
        name: builtins.str,
        composite_slot_type_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeCompositeSlotTypeSetting", typing.Dict[builtins.str, typing.Any]]]]] = None,
        description: typing.Optional[builtins.str] = None,
        external_source_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeExternalSourceSetting", typing.Dict[builtins.str, typing.Any]]]]] = None,
        parent_slot_type_signature: typing.Optional[builtins.str] = None,
        slot_type_values: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeSlotTypeValues", typing.Dict[builtins.str, typing.Any]]]]] = None,
        timeouts: typing.Optional[typing.Union["Lexv2ModelsSlotTypeTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        value_selection_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeValueSelectionSetting", typing.Dict[builtins.str, typing.Any]]]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type aws_lexv2models_slot_type} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param bot_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_id Lexv2ModelsSlotType#bot_id}.
        :param bot_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_version Lexv2ModelsSlotType#bot_version}.
        :param locale_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#locale_id Lexv2ModelsSlotType#locale_id}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#name Lexv2ModelsSlotType#name}.
        :param composite_slot_type_setting: composite_slot_type_setting block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#composite_slot_type_setting Lexv2ModelsSlotType#composite_slot_type_setting}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#description Lexv2ModelsSlotType#description}.
        :param external_source_setting: external_source_setting block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#external_source_setting Lexv2ModelsSlotType#external_source_setting}
        :param parent_slot_type_signature: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#parent_slot_type_signature Lexv2ModelsSlotType#parent_slot_type_signature}.
        :param slot_type_values: slot_type_values block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#slot_type_values Lexv2ModelsSlotType#slot_type_values}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#timeouts Lexv2ModelsSlotType#timeouts}
        :param value_selection_setting: value_selection_setting block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#value_selection_setting Lexv2ModelsSlotType#value_selection_setting}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e3f8d364b39fa5839458b79ab4d0bc88b607155917f1f06e1d563f01db8a45a)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = Lexv2ModelsSlotTypeConfig(
            bot_id=bot_id,
            bot_version=bot_version,
            locale_id=locale_id,
            name=name,
            composite_slot_type_setting=composite_slot_type_setting,
            description=description,
            external_source_setting=external_source_setting,
            parent_slot_type_signature=parent_slot_type_signature,
            slot_type_values=slot_type_values,
            timeouts=timeouts,
            value_selection_setting=value_selection_setting,
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
        '''Generates CDKTF code for importing a Lexv2ModelsSlotType resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Lexv2ModelsSlotType to import.
        :param import_from_id: The id of the existing Lexv2ModelsSlotType that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Lexv2ModelsSlotType to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__60de4863ad730f152b73a04e1d46522cef153fe67d12a9b10a9b4ea2400b2691)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putCompositeSlotTypeSetting")
    def put_composite_slot_type_setting(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeCompositeSlotTypeSetting", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b6ee0a75a3848579a53d6e6182d97b802561cbbf40862b5e0fb77fda9369943)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCompositeSlotTypeSetting", [value]))

    @jsii.member(jsii_name="putExternalSourceSetting")
    def put_external_source_setting(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeExternalSourceSetting", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c55ac1bb55a4ff753cc350bc53ddf5ac1d3e63494852eb1991f0a82a3be790a9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putExternalSourceSetting", [value]))

    @jsii.member(jsii_name="putSlotTypeValues")
    def put_slot_type_values(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeSlotTypeValues", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__639ab56d7f1c094ae2e57aac38a0a3c3cbcbbc4fccab6859204980447470f07f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSlotTypeValues", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#create Lexv2ModelsSlotType#create}
        :param delete: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#delete Lexv2ModelsSlotType#delete}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#update Lexv2ModelsSlotType#update}
        '''
        value = Lexv2ModelsSlotTypeTimeouts(
            create=create, delete=delete, update=update
        )

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="putValueSelectionSetting")
    def put_value_selection_setting(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeValueSelectionSetting", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9f90dd57bb9bf90241bfa0d7878123fe5eeec77c904d242e95c192e08776455)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putValueSelectionSetting", [value]))

    @jsii.member(jsii_name="resetCompositeSlotTypeSetting")
    def reset_composite_slot_type_setting(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCompositeSlotTypeSetting", []))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetExternalSourceSetting")
    def reset_external_source_setting(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExternalSourceSetting", []))

    @jsii.member(jsii_name="resetParentSlotTypeSignature")
    def reset_parent_slot_type_signature(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetParentSlotTypeSignature", []))

    @jsii.member(jsii_name="resetSlotTypeValues")
    def reset_slot_type_values(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSlotTypeValues", []))

    @jsii.member(jsii_name="resetTimeouts")
    def reset_timeouts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeouts", []))

    @jsii.member(jsii_name="resetValueSelectionSetting")
    def reset_value_selection_setting(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValueSelectionSetting", []))

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
    @jsii.member(jsii_name="compositeSlotTypeSetting")
    def composite_slot_type_setting(
        self,
    ) -> "Lexv2ModelsSlotTypeCompositeSlotTypeSettingList":
        return typing.cast("Lexv2ModelsSlotTypeCompositeSlotTypeSettingList", jsii.get(self, "compositeSlotTypeSetting"))

    @builtins.property
    @jsii.member(jsii_name="externalSourceSetting")
    def external_source_setting(self) -> "Lexv2ModelsSlotTypeExternalSourceSettingList":
        return typing.cast("Lexv2ModelsSlotTypeExternalSourceSettingList", jsii.get(self, "externalSourceSetting"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @builtins.property
    @jsii.member(jsii_name="slotTypeId")
    def slot_type_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "slotTypeId"))

    @builtins.property
    @jsii.member(jsii_name="slotTypeValues")
    def slot_type_values(self) -> "Lexv2ModelsSlotTypeSlotTypeValuesList":
        return typing.cast("Lexv2ModelsSlotTypeSlotTypeValuesList", jsii.get(self, "slotTypeValues"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "Lexv2ModelsSlotTypeTimeoutsOutputReference":
        return typing.cast("Lexv2ModelsSlotTypeTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="valueSelectionSetting")
    def value_selection_setting(self) -> "Lexv2ModelsSlotTypeValueSelectionSettingList":
        return typing.cast("Lexv2ModelsSlotTypeValueSelectionSettingList", jsii.get(self, "valueSelectionSetting"))

    @builtins.property
    @jsii.member(jsii_name="botIdInput")
    def bot_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "botIdInput"))

    @builtins.property
    @jsii.member(jsii_name="botVersionInput")
    def bot_version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "botVersionInput"))

    @builtins.property
    @jsii.member(jsii_name="compositeSlotTypeSettingInput")
    def composite_slot_type_setting_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeCompositeSlotTypeSetting"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeCompositeSlotTypeSetting"]]], jsii.get(self, "compositeSlotTypeSettingInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="externalSourceSettingInput")
    def external_source_setting_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeExternalSourceSetting"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeExternalSourceSetting"]]], jsii.get(self, "externalSourceSettingInput"))

    @builtins.property
    @jsii.member(jsii_name="localeIdInput")
    def locale_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "localeIdInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="parentSlotTypeSignatureInput")
    def parent_slot_type_signature_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "parentSlotTypeSignatureInput"))

    @builtins.property
    @jsii.member(jsii_name="slotTypeValuesInput")
    def slot_type_values_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeSlotTypeValues"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeSlotTypeValues"]]], jsii.get(self, "slotTypeValuesInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "Lexv2ModelsSlotTypeTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "Lexv2ModelsSlotTypeTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="valueSelectionSettingInput")
    def value_selection_setting_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeValueSelectionSetting"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeValueSelectionSetting"]]], jsii.get(self, "valueSelectionSettingInput"))

    @builtins.property
    @jsii.member(jsii_name="botId")
    def bot_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "botId"))

    @bot_id.setter
    def bot_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__724de64e51d383bf9dc53fde29fd3bbbeee9020e92d468710474eb7824314e76)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "botId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="botVersion")
    def bot_version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "botVersion"))

    @bot_version.setter
    def bot_version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a91061cfdf583c43b0afb7d337486d7a7bb159319e9049537c492208adef03b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "botVersion", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a54ab2b96fb4a16aaf9976f0ab0314e762e22d916c74b776ec02272fbc28dc5e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="localeId")
    def locale_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "localeId"))

    @locale_id.setter
    def locale_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78a40a77f8719ba5a29691c39727d2a25bcb11a0395290c156d8878c4e11cd67)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "localeId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15e6183032d69372c611faf33cce0d58c47a3302dd2b34e3a2828519ec7a05fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="parentSlotTypeSignature")
    def parent_slot_type_signature(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "parentSlotTypeSignature"))

    @parent_slot_type_signature.setter
    def parent_slot_type_signature(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d686e6ef9214f4e518e424ed44220b09a752fc625044348955e4b972f5067ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "parentSlotTypeSignature", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeCompositeSlotTypeSetting",
    jsii_struct_bases=[],
    name_mapping={"sub_slots": "subSlots"},
)
class Lexv2ModelsSlotTypeCompositeSlotTypeSetting:
    def __init__(
        self,
        *,
        sub_slots: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param sub_slots: sub_slots block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#sub_slots Lexv2ModelsSlotType#sub_slots}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e63168f7eb4c959c4dc56b7d3ba5044944ce46728e80e070395fbcd7b4041df0)
            check_type(argname="argument sub_slots", value=sub_slots, expected_type=type_hints["sub_slots"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if sub_slots is not None:
            self._values["sub_slots"] = sub_slots

    @builtins.property
    def sub_slots(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots"]]]:
        '''sub_slots block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#sub_slots Lexv2ModelsSlotType#sub_slots}
        '''
        result = self._values.get("sub_slots")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeCompositeSlotTypeSetting(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Lexv2ModelsSlotTypeCompositeSlotTypeSettingList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeCompositeSlotTypeSettingList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__eed10badff57b1fe1a08e2505b52a4f98121fc4584d772c580c0b89e40ab2c41)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Lexv2ModelsSlotTypeCompositeSlotTypeSettingOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__51737cbf7f78c107252bf040eb3ee5325be52ff399d0a6c3fe9ce0a0d7cc1fc7)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Lexv2ModelsSlotTypeCompositeSlotTypeSettingOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33ba6e0cb333432fa660f01d0a7960bfe86142e474085cfacd2e4f10a5e277d0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d8897eb5d06be49fd8c36057571df4d9dd50da6b75d3fd679ff2d9e8f72e468a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bd231d0f2e74cca75b0dec1d01a687ee19298ba6d4968103dfa2485e9756081b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeCompositeSlotTypeSetting]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeCompositeSlotTypeSetting]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeCompositeSlotTypeSetting]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cfd123c5495b477791706336d4e81cb23c37affae09e2d5008ed5152ae67db25)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeCompositeSlotTypeSettingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeCompositeSlotTypeSettingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3e6da44a296410851414911c3e36a6f03d3e4bf5a954009ed0232699fba7f71a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putSubSlots")
    def put_sub_slots(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e32a9c4b51825dcd49f2d0d2ee6d7aeabb7337ed1491657afb177cd828ce52a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSubSlots", [value]))

    @jsii.member(jsii_name="resetSubSlots")
    def reset_sub_slots(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSubSlots", []))

    @builtins.property
    @jsii.member(jsii_name="subSlots")
    def sub_slots(self) -> "Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlotsList":
        return typing.cast("Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlotsList", jsii.get(self, "subSlots"))

    @builtins.property
    @jsii.member(jsii_name="subSlotsInput")
    def sub_slots_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots"]]], jsii.get(self, "subSlotsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeCompositeSlotTypeSetting]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeCompositeSlotTypeSetting]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeCompositeSlotTypeSetting]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__716c47eca915de849c8b92beff169e4970c59c41edd64f4e4caac535793d2214)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "slot_type_id": "slotTypeId"},
)
class Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots:
    def __init__(self, *, name: builtins.str, slot_type_id: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#name Lexv2ModelsSlotType#name}.
        :param slot_type_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#slot_type_id Lexv2ModelsSlotType#slot_type_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1efa94c1d7430a10a97cfbdd950dc34d2742b0d0fb9ea8ddd0bbf15033da265b)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument slot_type_id", value=slot_type_id, expected_type=type_hints["slot_type_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "slot_type_id": slot_type_id,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#name Lexv2ModelsSlotType#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def slot_type_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#slot_type_id Lexv2ModelsSlotType#slot_type_id}.'''
        result = self._values.get("slot_type_id")
        assert result is not None, "Required property 'slot_type_id' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlotsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlotsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__22faab1c5e006ff39d947961e2a3664ea71d549f5abac6dd8d2b31ab6080cf57)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlotsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6754b8a1efd62edcde55f1a8c3cd7c0d91fe3d91821af9053e9caf1db7167de0)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlotsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5154540054eb41145d7d8c62b1a68dc5b9ff484ca1a14c90ad18fbf37f6813ec)
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
            type_hints = typing.get_type_hints(_typecheckingstub__502b6fb03ae741f2dc23295dd46d5289a3b3020279948aee7d68107a0e5a0dad)
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
            type_hints = typing.get_type_hints(_typecheckingstub__49a3761b956491a3beb58a02d69024c56539cf67699fa8d4c4d5b4dbff8c5535)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c62fab2fedf9c0a0c0cc9ce061c0f240f58d32b98f361d128751ef65bfc48967)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlotsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlotsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4a43fb729781a375ad4cc6f16d4e489f351195447eba504274359fd6fa166f88)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="slotTypeIdInput")
    def slot_type_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "slotTypeIdInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__38d102517b4f79fed27b847913c3a245215d4fc4a27fa3e787fceea473c44774)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="slotTypeId")
    def slot_type_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "slotTypeId"))

    @slot_type_id.setter
    def slot_type_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78f76f676b030d5308af088bddeba0479cf219e8b4e69ad00337cbaf1037c613)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "slotTypeId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d0ca5c062bccb929b009906b062cd74d56e2626106bc62c0fa3b8f9b76555f77)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "bot_id": "botId",
        "bot_version": "botVersion",
        "locale_id": "localeId",
        "name": "name",
        "composite_slot_type_setting": "compositeSlotTypeSetting",
        "description": "description",
        "external_source_setting": "externalSourceSetting",
        "parent_slot_type_signature": "parentSlotTypeSignature",
        "slot_type_values": "slotTypeValues",
        "timeouts": "timeouts",
        "value_selection_setting": "valueSelectionSetting",
    },
)
class Lexv2ModelsSlotTypeConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        bot_id: builtins.str,
        bot_version: builtins.str,
        locale_id: builtins.str,
        name: builtins.str,
        composite_slot_type_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeCompositeSlotTypeSetting, typing.Dict[builtins.str, typing.Any]]]]] = None,
        description: typing.Optional[builtins.str] = None,
        external_source_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeExternalSourceSetting", typing.Dict[builtins.str, typing.Any]]]]] = None,
        parent_slot_type_signature: typing.Optional[builtins.str] = None,
        slot_type_values: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeSlotTypeValues", typing.Dict[builtins.str, typing.Any]]]]] = None,
        timeouts: typing.Optional[typing.Union["Lexv2ModelsSlotTypeTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        value_selection_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeValueSelectionSetting", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param bot_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_id Lexv2ModelsSlotType#bot_id}.
        :param bot_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_version Lexv2ModelsSlotType#bot_version}.
        :param locale_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#locale_id Lexv2ModelsSlotType#locale_id}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#name Lexv2ModelsSlotType#name}.
        :param composite_slot_type_setting: composite_slot_type_setting block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#composite_slot_type_setting Lexv2ModelsSlotType#composite_slot_type_setting}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#description Lexv2ModelsSlotType#description}.
        :param external_source_setting: external_source_setting block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#external_source_setting Lexv2ModelsSlotType#external_source_setting}
        :param parent_slot_type_signature: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#parent_slot_type_signature Lexv2ModelsSlotType#parent_slot_type_signature}.
        :param slot_type_values: slot_type_values block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#slot_type_values Lexv2ModelsSlotType#slot_type_values}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#timeouts Lexv2ModelsSlotType#timeouts}
        :param value_selection_setting: value_selection_setting block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#value_selection_setting Lexv2ModelsSlotType#value_selection_setting}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(timeouts, dict):
            timeouts = Lexv2ModelsSlotTypeTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40b9c618cf546d12e4f837766a41d50c80c0ac0238e8ed339494b5e84052c9d5)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument bot_id", value=bot_id, expected_type=type_hints["bot_id"])
            check_type(argname="argument bot_version", value=bot_version, expected_type=type_hints["bot_version"])
            check_type(argname="argument locale_id", value=locale_id, expected_type=type_hints["locale_id"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument composite_slot_type_setting", value=composite_slot_type_setting, expected_type=type_hints["composite_slot_type_setting"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument external_source_setting", value=external_source_setting, expected_type=type_hints["external_source_setting"])
            check_type(argname="argument parent_slot_type_signature", value=parent_slot_type_signature, expected_type=type_hints["parent_slot_type_signature"])
            check_type(argname="argument slot_type_values", value=slot_type_values, expected_type=type_hints["slot_type_values"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
            check_type(argname="argument value_selection_setting", value=value_selection_setting, expected_type=type_hints["value_selection_setting"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "bot_id": bot_id,
            "bot_version": bot_version,
            "locale_id": locale_id,
            "name": name,
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
        if composite_slot_type_setting is not None:
            self._values["composite_slot_type_setting"] = composite_slot_type_setting
        if description is not None:
            self._values["description"] = description
        if external_source_setting is not None:
            self._values["external_source_setting"] = external_source_setting
        if parent_slot_type_signature is not None:
            self._values["parent_slot_type_signature"] = parent_slot_type_signature
        if slot_type_values is not None:
            self._values["slot_type_values"] = slot_type_values
        if timeouts is not None:
            self._values["timeouts"] = timeouts
        if value_selection_setting is not None:
            self._values["value_selection_setting"] = value_selection_setting

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
    def bot_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_id Lexv2ModelsSlotType#bot_id}.'''
        result = self._values.get("bot_id")
        assert result is not None, "Required property 'bot_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def bot_version(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_version Lexv2ModelsSlotType#bot_version}.'''
        result = self._values.get("bot_version")
        assert result is not None, "Required property 'bot_version' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def locale_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#locale_id Lexv2ModelsSlotType#locale_id}.'''
        result = self._values.get("locale_id")
        assert result is not None, "Required property 'locale_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#name Lexv2ModelsSlotType#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def composite_slot_type_setting(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeCompositeSlotTypeSetting]]]:
        '''composite_slot_type_setting block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#composite_slot_type_setting Lexv2ModelsSlotType#composite_slot_type_setting}
        '''
        result = self._values.get("composite_slot_type_setting")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeCompositeSlotTypeSetting]]], result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#description Lexv2ModelsSlotType#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def external_source_setting(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeExternalSourceSetting"]]]:
        '''external_source_setting block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#external_source_setting Lexv2ModelsSlotType#external_source_setting}
        '''
        result = self._values.get("external_source_setting")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeExternalSourceSetting"]]], result)

    @builtins.property
    def parent_slot_type_signature(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#parent_slot_type_signature Lexv2ModelsSlotType#parent_slot_type_signature}.'''
        result = self._values.get("parent_slot_type_signature")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def slot_type_values(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeSlotTypeValues"]]]:
        '''slot_type_values block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#slot_type_values Lexv2ModelsSlotType#slot_type_values}
        '''
        result = self._values.get("slot_type_values")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeSlotTypeValues"]]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["Lexv2ModelsSlotTypeTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#timeouts Lexv2ModelsSlotType#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["Lexv2ModelsSlotTypeTimeouts"], result)

    @builtins.property
    def value_selection_setting(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeValueSelectionSetting"]]]:
        '''value_selection_setting block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#value_selection_setting Lexv2ModelsSlotType#value_selection_setting}
        '''
        result = self._values.get("value_selection_setting")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeValueSelectionSetting"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSetting",
    jsii_struct_bases=[],
    name_mapping={"grammar_slot_type_setting": "grammarSlotTypeSetting"},
)
class Lexv2ModelsSlotTypeExternalSourceSetting:
    def __init__(
        self,
        *,
        grammar_slot_type_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param grammar_slot_type_setting: grammar_slot_type_setting block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#grammar_slot_type_setting Lexv2ModelsSlotType#grammar_slot_type_setting}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3642fef2ebeb658c31b71113aae8b8a1f88979b6d88b2f4e1a6bb9eb24b5f1c5)
            check_type(argname="argument grammar_slot_type_setting", value=grammar_slot_type_setting, expected_type=type_hints["grammar_slot_type_setting"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if grammar_slot_type_setting is not None:
            self._values["grammar_slot_type_setting"] = grammar_slot_type_setting

    @builtins.property
    def grammar_slot_type_setting(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting"]]]:
        '''grammar_slot_type_setting block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#grammar_slot_type_setting Lexv2ModelsSlotType#grammar_slot_type_setting}
        '''
        result = self._values.get("grammar_slot_type_setting")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeExternalSourceSetting(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting",
    jsii_struct_bases=[],
    name_mapping={"source": "source"},
)
class Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting:
    def __init__(
        self,
        *,
        source: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param source: source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#source Lexv2ModelsSlotType#source}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__223b9917f4e64eb8ef1a3ff935cb4ffdd55975e4c1ad2b9f480cce0f2927c56b)
            check_type(argname="argument source", value=source, expected_type=type_hints["source"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if source is not None:
            self._values["source"] = source

    @builtins.property
    def source(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource"]]]:
        '''source block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#source Lexv2ModelsSlotType#source}
        '''
        result = self._values.get("source")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9e4b074caf7fe7b09ccf48fbac24b8a8b84674f070c185de312730be72e4d9e4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c6e2e9ac8b0c55305b44e3b1b9056fcb5227226b671ac2cc1b1e8187e2a3226)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a91884e52089796ede147300a676e4548c6fde5a78bb5d4ab1b52de37cb7038)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b8b28aea1f7822f88850b7b7d40bf5b34ea373de32431db88b00d5401e109655)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b45adbd718cc0d390704213ac29ba317be1c069717db530950b90edce43fb47d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a9b349d384183c96f475da04d3695e599926a9ea798229da8e582bf13ced9b7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c43a2a3a94cce6f4c17d0638ac88040fb479e873b36508773af43159cfe13f2b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putSource")
    def put_source(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__92b02f00a4ef8a493c0320fa7c9d5d8205d6eaaf90ce75b5719bed5db1c0a0ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSource", [value]))

    @jsii.member(jsii_name="resetSource")
    def reset_source(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSource", []))

    @builtins.property
    @jsii.member(jsii_name="source")
    def source(
        self,
    ) -> "Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSourceList":
        return typing.cast("Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSourceList", jsii.get(self, "source"))

    @builtins.property
    @jsii.member(jsii_name="sourceInput")
    def source_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource"]]], jsii.get(self, "sourceInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8c960ecce01c524c4769634bde49e9522fe42c00973aef0130429565ab68f0b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource",
    jsii_struct_bases=[],
    name_mapping={
        "kms_key_arn": "kmsKeyArn",
        "s3_bucket_name": "s3BucketName",
        "s3_object_key": "s3ObjectKey",
    },
)
class Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource:
    def __init__(
        self,
        *,
        kms_key_arn: builtins.str,
        s3_bucket_name: builtins.str,
        s3_object_key: builtins.str,
    ) -> None:
        '''
        :param kms_key_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#kms_key_arn Lexv2ModelsSlotType#kms_key_arn}.
        :param s3_bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#s3_bucket_name Lexv2ModelsSlotType#s3_bucket_name}.
        :param s3_object_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#s3_object_key Lexv2ModelsSlotType#s3_object_key}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__44fab59b9b4058f2db95c5eb91601fd5ae498c938813258bcc56a82b1cc967ac)
            check_type(argname="argument kms_key_arn", value=kms_key_arn, expected_type=type_hints["kms_key_arn"])
            check_type(argname="argument s3_bucket_name", value=s3_bucket_name, expected_type=type_hints["s3_bucket_name"])
            check_type(argname="argument s3_object_key", value=s3_object_key, expected_type=type_hints["s3_object_key"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "kms_key_arn": kms_key_arn,
            "s3_bucket_name": s3_bucket_name,
            "s3_object_key": s3_object_key,
        }

    @builtins.property
    def kms_key_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#kms_key_arn Lexv2ModelsSlotType#kms_key_arn}.'''
        result = self._values.get("kms_key_arn")
        assert result is not None, "Required property 'kms_key_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def s3_bucket_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#s3_bucket_name Lexv2ModelsSlotType#s3_bucket_name}.'''
        result = self._values.get("s3_bucket_name")
        assert result is not None, "Required property 's3_bucket_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def s3_object_key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#s3_object_key Lexv2ModelsSlotType#s3_object_key}.'''
        result = self._values.get("s3_object_key")
        assert result is not None, "Required property 's3_object_key' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSourceList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSourceList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__742eba1b8a9cd3248867120471fcac2880f1095da76aa030ae398f369ad656c9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSourceOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07bd052feb8a79d2c1ee7a7ebb6696509eb222d2462922e387fce3a5b6aeb4d4)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSourceOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83ed2fc14533c16a6fbef5230bbfc4f5db42aeb948e12ac77dd160891be08800)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6134a75b90c99f08efb38c62266d1ce0df623f1a876270cde7b3af125298a11a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__db68428cf8bec2f9f65eeaaceacecc93c89377e993278a0b395e15d39418c844)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c85b28efcb09e73f2f1e72d5c58257eed0b4d0a1fd5f503b964c0f5e683cb4f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSourceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSourceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d2a3ecfea0db2d988d016fc27cc5f4b26a1a0f45bf29ea4a47a785ba86b98c95)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="kmsKeyArnInput")
    def kms_key_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "kmsKeyArnInput"))

    @builtins.property
    @jsii.member(jsii_name="s3BucketNameInput")
    def s3_bucket_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3BucketNameInput"))

    @builtins.property
    @jsii.member(jsii_name="s3ObjectKeyInput")
    def s3_object_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3ObjectKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="kmsKeyArn")
    def kms_key_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "kmsKeyArn"))

    @kms_key_arn.setter
    def kms_key_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bcaed7976afaaf6cecb119131b701c929f13a8fd450eb8866d52168965a82f14)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "kmsKeyArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3BucketName")
    def s3_bucket_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3BucketName"))

    @s3_bucket_name.setter
    def s3_bucket_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b91c302dc92d7e6637a011bd38b4daf834f62fc84183a8f8f9af7703eb63d172)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3BucketName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3ObjectKey")
    def s3_object_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3ObjectKey"))

    @s3_object_key.setter
    def s3_object_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d636bed32a235daa5efa24f9ccd057cbecac2d6125d7740a5a9d43cd21b6b207)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3ObjectKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6f7f0d45ef0314fc4a928ac813b17d4af98c265b7520bf9e456ea82d66a942af)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeExternalSourceSettingList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSettingList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__277b86074de40fdc7f09d8c20b36601aa2c716bdeb8274a240cea3b3bcfdc00f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Lexv2ModelsSlotTypeExternalSourceSettingOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a353090d86c587916efe49cf2b2b26c124dfdfd292b1fb83f5c4f3a183c8b5a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Lexv2ModelsSlotTypeExternalSourceSettingOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__54a5de5506bd7ec42229925dc6790e67ed898750df5edd697b0b78d39b4c6b2b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__37ffc8ad8b08e8c924b047f3e1e6c57331b7edd8b95f5dd1ac1ae95e1b0296d2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__63fad8fd872763be33530fe2f322ff6f94f5187a37beeac0d2a27c999186bae3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSetting]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSetting]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSetting]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f550df28dfdcf56ba02d14d1540c5098d8a7b2c25fb867bf8050e015bcce4bd1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeExternalSourceSettingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSettingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__98bb1a1153f4fe58dac8d83a4ca02b4c7522843430c87b483013c7721f2c5b4f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putGrammarSlotTypeSetting")
    def put_grammar_slot_type_setting(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e2ca15154297cb4d17d7a4a3f9549eea434a3cbb712f8d5e7626ace61813b804)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putGrammarSlotTypeSetting", [value]))

    @jsii.member(jsii_name="resetGrammarSlotTypeSetting")
    def reset_grammar_slot_type_setting(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGrammarSlotTypeSetting", []))

    @builtins.property
    @jsii.member(jsii_name="grammarSlotTypeSetting")
    def grammar_slot_type_setting(
        self,
    ) -> Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingList:
        return typing.cast(Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingList, jsii.get(self, "grammarSlotTypeSetting"))

    @builtins.property
    @jsii.member(jsii_name="grammarSlotTypeSettingInput")
    def grammar_slot_type_setting_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting]]], jsii.get(self, "grammarSlotTypeSettingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeExternalSourceSetting]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeExternalSourceSetting]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeExternalSourceSetting]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8fedd7b5f32d2d6ffe0862001fadc53d25b28d984f55302363a76d7a50b91d1f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeSlotTypeValues",
    jsii_struct_bases=[],
    name_mapping={"sample_value": "sampleValue", "synonyms": "synonyms"},
)
class Lexv2ModelsSlotTypeSlotTypeValues:
    def __init__(
        self,
        *,
        sample_value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeSlotTypeValuesSampleValue", typing.Dict[builtins.str, typing.Any]]]]] = None,
        synonyms: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeSlotTypeValuesSynonyms", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param sample_value: sample_value block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#sample_value Lexv2ModelsSlotType#sample_value}
        :param synonyms: synonyms block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#synonyms Lexv2ModelsSlotType#synonyms}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d84b5a3313c02b420807e62702071b44cda708bad613d1dd73029219e61f601c)
            check_type(argname="argument sample_value", value=sample_value, expected_type=type_hints["sample_value"])
            check_type(argname="argument synonyms", value=synonyms, expected_type=type_hints["synonyms"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if sample_value is not None:
            self._values["sample_value"] = sample_value
        if synonyms is not None:
            self._values["synonyms"] = synonyms

    @builtins.property
    def sample_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeSlotTypeValuesSampleValue"]]]:
        '''sample_value block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#sample_value Lexv2ModelsSlotType#sample_value}
        '''
        result = self._values.get("sample_value")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeSlotTypeValuesSampleValue"]]], result)

    @builtins.property
    def synonyms(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeSlotTypeValuesSynonyms"]]]:
        '''synonyms block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#synonyms Lexv2ModelsSlotType#synonyms}
        '''
        result = self._values.get("synonyms")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeSlotTypeValuesSynonyms"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeSlotTypeValues(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Lexv2ModelsSlotTypeSlotTypeValuesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeSlotTypeValuesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e4b37cace91d623e4ae2e3da9bd665099f71518e5ab4f6b4b54a494668507a9a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Lexv2ModelsSlotTypeSlotTypeValuesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__671ee15cb8e930415fbcf09c581914573524e33174143c78410ac99932751105)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Lexv2ModelsSlotTypeSlotTypeValuesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04a3031891e8453c3bbd950f11f317e735727da797a1a739424244064188f2fe)
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
            type_hints = typing.get_type_hints(_typecheckingstub__88ff4ea61fa0a985084c97fc9bf5643384ac98f7cfaf9129b34c955bcecc4a17)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b09dd2bbd2c4a7b36018ef3d20f69e4c2f7a76855a914f74187ea9f3b8670a27)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeSlotTypeValues]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeSlotTypeValues]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeSlotTypeValues]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b5b63e676c8eae75d94e8ae4f26902945664d21af9362544ce49434c599b3e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeSlotTypeValuesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeSlotTypeValuesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fb1e89f8fb6ce0343a82425d3b170d70fccbd486ba9aada80dd82d6b6a57e3b9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putSampleValue")
    def put_sample_value(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeSlotTypeValuesSampleValue", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__be964d99fc91b6195a728b0947387431316acd73810348187cbb271b3a17d438)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSampleValue", [value]))

    @jsii.member(jsii_name="putSynonyms")
    def put_synonyms(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeSlotTypeValuesSynonyms", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__457b375923046de2e75cc80d32bd192399ad79c3d28933af9df9ee08bcdaa4d4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSynonyms", [value]))

    @jsii.member(jsii_name="resetSampleValue")
    def reset_sample_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSampleValue", []))

    @jsii.member(jsii_name="resetSynonyms")
    def reset_synonyms(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSynonyms", []))

    @builtins.property
    @jsii.member(jsii_name="sampleValue")
    def sample_value(self) -> "Lexv2ModelsSlotTypeSlotTypeValuesSampleValueList":
        return typing.cast("Lexv2ModelsSlotTypeSlotTypeValuesSampleValueList", jsii.get(self, "sampleValue"))

    @builtins.property
    @jsii.member(jsii_name="synonyms")
    def synonyms(self) -> "Lexv2ModelsSlotTypeSlotTypeValuesSynonymsList":
        return typing.cast("Lexv2ModelsSlotTypeSlotTypeValuesSynonymsList", jsii.get(self, "synonyms"))

    @builtins.property
    @jsii.member(jsii_name="sampleValueInput")
    def sample_value_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeSlotTypeValuesSampleValue"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeSlotTypeValuesSampleValue"]]], jsii.get(self, "sampleValueInput"))

    @builtins.property
    @jsii.member(jsii_name="synonymsInput")
    def synonyms_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeSlotTypeValuesSynonyms"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeSlotTypeValuesSynonyms"]]], jsii.get(self, "synonymsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeSlotTypeValues]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeSlotTypeValues]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeSlotTypeValues]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__570bb7d32a8d53897568b589186ab685aac8626950cef361533f463e464104fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeSlotTypeValuesSampleValue",
    jsii_struct_bases=[],
    name_mapping={"value": "value"},
)
class Lexv2ModelsSlotTypeSlotTypeValuesSampleValue:
    def __init__(self, *, value: builtins.str) -> None:
        '''
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#value Lexv2ModelsSlotType#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fce5e8f2fc4c140dd114350d33dd28fd1e481f960d83982d7a11da89042f0ae4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "value": value,
        }

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#value Lexv2ModelsSlotType#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeSlotTypeValuesSampleValue(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Lexv2ModelsSlotTypeSlotTypeValuesSampleValueList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeSlotTypeValuesSampleValueList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__763c1222e76c0d43792c1579740b90aba2822f9f7f4ec055d2fdb45372b9d71b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Lexv2ModelsSlotTypeSlotTypeValuesSampleValueOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21994c2e4ddf7682745391f3f4659cb22490b9829cbb886d1d12a3e4af3055cf)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Lexv2ModelsSlotTypeSlotTypeValuesSampleValueOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b488b9b5f5cc41d1f950062e28c7027f0bf33688a94752b5960b4980abcbe19)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d4d15d029080229e9ba24b5b5c33f859b4466ed241f564b072445596f5729938)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d7642c22c09f1e42e510c5385b93f43ff7ae1ac7745fc000518e6a496828e135)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeSlotTypeValuesSampleValue]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeSlotTypeValuesSampleValue]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeSlotTypeValuesSampleValue]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02d5e58baab7fb342500a0bff910ebc2fb92d1efe0ca81564287e1350e77d828)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeSlotTypeValuesSampleValueOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeSlotTypeValuesSampleValueOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a78d483c150334f1f4ab5b2d6c94b28df571fd75cd4200870021d576fc621281)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ffb1522538729d904fc95407677562689f2abf4a80733cd1e7285e290290bbf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeSlotTypeValuesSampleValue]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeSlotTypeValuesSampleValue]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeSlotTypeValuesSampleValue]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__68bdbdeee6f7ff6b4635cc53c7bdb9566c5eacaf29958ce67b4859fe0607fc90)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeSlotTypeValuesSynonyms",
    jsii_struct_bases=[],
    name_mapping={"value": "value"},
)
class Lexv2ModelsSlotTypeSlotTypeValuesSynonyms:
    def __init__(self, *, value: builtins.str) -> None:
        '''
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#value Lexv2ModelsSlotType#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15d2db950cc038e1a484236afadfd36317dcba3d33af4efd94235c16a0647945)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "value": value,
        }

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#value Lexv2ModelsSlotType#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeSlotTypeValuesSynonyms(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Lexv2ModelsSlotTypeSlotTypeValuesSynonymsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeSlotTypeValuesSynonymsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__22cfe5dca9e2c1237d498ffd12887b1e23e13eaf0ffb9c248c5b93230291da2a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Lexv2ModelsSlotTypeSlotTypeValuesSynonymsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ddde7f096534c889a7619d1c52fbb874650ca6ff8fb7cf5b4c4f1154af5c946)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Lexv2ModelsSlotTypeSlotTypeValuesSynonymsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b7077c1759853e77b01863b0764cf88267b09c8d1856c8a8e053f7ec5559aac)
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
            type_hints = typing.get_type_hints(_typecheckingstub__94c6d2e70b1f29a510f40ad8c4e6dd87b6e2c13c8920d35ae5a68901247d9d2b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__73507f2adacf914fcd4a8885c512d8dd39d7767c5fa1675f6a36b79d04e1809e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeSlotTypeValuesSynonyms]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeSlotTypeValuesSynonyms]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeSlotTypeValuesSynonyms]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a80aecd7ce7856305e923bc059691430911bd9fa02e51ca913fb9afd1226af2a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeSlotTypeValuesSynonymsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeSlotTypeValuesSynonymsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__aad9d19d2fb725e1993f5cbf6f1bc15285ca4d7fdde12c6b62a2e3716e98850f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7ad00e38536e29bc9f3629bf837fb0430bd0a877878e66e948f07e0248edbf19)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeSlotTypeValuesSynonyms]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeSlotTypeValuesSynonyms]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeSlotTypeValuesSynonyms]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b96ff11c7f2ab12e34220f1cfdd7d8fa3a601a3ecb7396538826f05e1e14dc97)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class Lexv2ModelsSlotTypeTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#create Lexv2ModelsSlotType#create}
        :param delete: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#delete Lexv2ModelsSlotType#delete}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#update Lexv2ModelsSlotType#update}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a04ff591443995850aaf800543df82778e5c9d3a57abd459a1642f52118e9d10)
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
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#create Lexv2ModelsSlotType#create}
        '''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#delete Lexv2ModelsSlotType#delete}
        '''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#update Lexv2ModelsSlotType#update}
        '''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Lexv2ModelsSlotTypeTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d907669fa3921855256b234f92d5abdf7c413c7d6f1d245a2fc950867ec6f820)
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
            type_hints = typing.get_type_hints(_typecheckingstub__57a335baa105538b6076a7bc45e8fe5a04304b433d59ab41e717d91bdb694c24)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ff11821d75c80b26d6294c09912b3d83745325553f7017e2d926e9b289db073)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__13c18421642175d31c992b433c11ce8c055b7c7733dcc7c52460b7ee490f846e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3bba0802c1a023be182ade6a0c3056f943925e15547f13fa3f47508b25e2159)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSetting",
    jsii_struct_bases=[],
    name_mapping={
        "resolution_strategy": "resolutionStrategy",
        "advanced_recognition_setting": "advancedRecognitionSetting",
        "regex_filter": "regexFilter",
    },
)
class Lexv2ModelsSlotTypeValueSelectionSetting:
    def __init__(
        self,
        *,
        resolution_strategy: builtins.str,
        advanced_recognition_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting", typing.Dict[builtins.str, typing.Any]]]]] = None,
        regex_filter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param resolution_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#resolution_strategy Lexv2ModelsSlotType#resolution_strategy}.
        :param advanced_recognition_setting: advanced_recognition_setting block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#advanced_recognition_setting Lexv2ModelsSlotType#advanced_recognition_setting}
        :param regex_filter: regex_filter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#regex_filter Lexv2ModelsSlotType#regex_filter}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24351eaf13aec28c17d5030f83c342a5758e12ffd585e4cc32d77dd73dd4161c)
            check_type(argname="argument resolution_strategy", value=resolution_strategy, expected_type=type_hints["resolution_strategy"])
            check_type(argname="argument advanced_recognition_setting", value=advanced_recognition_setting, expected_type=type_hints["advanced_recognition_setting"])
            check_type(argname="argument regex_filter", value=regex_filter, expected_type=type_hints["regex_filter"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "resolution_strategy": resolution_strategy,
        }
        if advanced_recognition_setting is not None:
            self._values["advanced_recognition_setting"] = advanced_recognition_setting
        if regex_filter is not None:
            self._values["regex_filter"] = regex_filter

    @builtins.property
    def resolution_strategy(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#resolution_strategy Lexv2ModelsSlotType#resolution_strategy}.'''
        result = self._values.get("resolution_strategy")
        assert result is not None, "Required property 'resolution_strategy' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def advanced_recognition_setting(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting"]]]:
        '''advanced_recognition_setting block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#advanced_recognition_setting Lexv2ModelsSlotType#advanced_recognition_setting}
        '''
        result = self._values.get("advanced_recognition_setting")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting"]]], result)

    @builtins.property
    def regex_filter(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter"]]]:
        '''regex_filter block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#regex_filter Lexv2ModelsSlotType#regex_filter}
        '''
        result = self._values.get("regex_filter")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeValueSelectionSetting(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting",
    jsii_struct_bases=[],
    name_mapping={"audio_recognition_strategy": "audioRecognitionStrategy"},
)
class Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting:
    def __init__(
        self,
        *,
        audio_recognition_strategy: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param audio_recognition_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#audio_recognition_strategy Lexv2ModelsSlotType#audio_recognition_strategy}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__158d38bbdb2fb40339819b2a36da67ad28d9610ad8eb9c57a2ece5e18e6b6074)
            check_type(argname="argument audio_recognition_strategy", value=audio_recognition_strategy, expected_type=type_hints["audio_recognition_strategy"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if audio_recognition_strategy is not None:
            self._values["audio_recognition_strategy"] = audio_recognition_strategy

    @builtins.property
    def audio_recognition_strategy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#audio_recognition_strategy Lexv2ModelsSlotType#audio_recognition_strategy}.'''
        result = self._values.get("audio_recognition_strategy")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSettingList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSettingList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__76e45676d54859138afcfdb9fbf417dbf7b6cf7f59aea1e41cefee917f5c09b6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSettingOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb167e0e228691db584e977f31c9c4e9342aec35d480afff2c24de7ee0d9c917)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSettingOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dea7cfa313daf9420a00e2472ad7cbe9c52b5d0372453f55962a9f88b6fc7ce6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__340c93ebf41dabd1bdd0fa047fb2a1bb4628eecc674adb8e3b2e7cb000a8c3fd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8c2cb19bf7528ae61eadeb8d75a925e7a5b8eaa5ecaf0da155ea1007b83c3d3d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8769bfd3d4071e061ba63be059fcc21ffceaf8ad33d254cc59161483ba5d73f3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSettingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSettingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b736ba57d093ea0f7f0b0117d3e3ccbd9f5e85b40a99b5b7b29485ab2c96c29f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetAudioRecognitionStrategy")
    def reset_audio_recognition_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAudioRecognitionStrategy", []))

    @builtins.property
    @jsii.member(jsii_name="audioRecognitionStrategyInput")
    def audio_recognition_strategy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "audioRecognitionStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="audioRecognitionStrategy")
    def audio_recognition_strategy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "audioRecognitionStrategy"))

    @audio_recognition_strategy.setter
    def audio_recognition_strategy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b8b7a86b1d43bb84802af11feab5123080be40e5bfee751b64498583f23c7e0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "audioRecognitionStrategy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__440b75f52eef203268a953dccfd9c5f0804e004cf6a26f6c009a2200c666912b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeValueSelectionSettingList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSettingList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7ebdaefc4d8ba732a340d9055f2e78541621f079fa396b93c187705ff784cb8e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Lexv2ModelsSlotTypeValueSelectionSettingOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1f2916f76af47a53d88dd49886af91c4b56a29d417b2f518fdbd79079118e0c0)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Lexv2ModelsSlotTypeValueSelectionSettingOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f40205898db9cbfdc58d73702393bc99ec99325b36758ab3fbe0c2dc888e9cbf)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a05ec8a42d7002d69ebaee45c62c524c88caccba2aad32d34886a7a7f430004d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bdf1aca23083ecb203441b9aa4eea9bae7c4a187290be74206ef2125efd57cb2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSetting]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSetting]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSetting]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__25772ea0f69446b950ac0227f76d351f53942548724cc6a0d4978978ea588e7d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeValueSelectionSettingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSettingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__737628b102c72005e2f33fd48c4709677a64cb2bfd13f10dd0819a9ea33d04ec)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putAdvancedRecognitionSetting")
    def put_advanced_recognition_setting(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a5f11daf56cb42d5f23eea53ba5b9194a69b84bfc9c256241ee03c14f819ebee)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putAdvancedRecognitionSetting", [value]))

    @jsii.member(jsii_name="putRegexFilter")
    def put_regex_filter(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9a93b9845a7b4000fd0d35c1e776879ac4524c070760c37b585e422368143dd5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRegexFilter", [value]))

    @jsii.member(jsii_name="resetAdvancedRecognitionSetting")
    def reset_advanced_recognition_setting(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAdvancedRecognitionSetting", []))

    @jsii.member(jsii_name="resetRegexFilter")
    def reset_regex_filter(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegexFilter", []))

    @builtins.property
    @jsii.member(jsii_name="advancedRecognitionSetting")
    def advanced_recognition_setting(
        self,
    ) -> Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSettingList:
        return typing.cast(Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSettingList, jsii.get(self, "advancedRecognitionSetting"))

    @builtins.property
    @jsii.member(jsii_name="regexFilter")
    def regex_filter(self) -> "Lexv2ModelsSlotTypeValueSelectionSettingRegexFilterList":
        return typing.cast("Lexv2ModelsSlotTypeValueSelectionSettingRegexFilterList", jsii.get(self, "regexFilter"))

    @builtins.property
    @jsii.member(jsii_name="advancedRecognitionSettingInput")
    def advanced_recognition_setting_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting]]], jsii.get(self, "advancedRecognitionSettingInput"))

    @builtins.property
    @jsii.member(jsii_name="regexFilterInput")
    def regex_filter_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter"]]], jsii.get(self, "regexFilterInput"))

    @builtins.property
    @jsii.member(jsii_name="resolutionStrategyInput")
    def resolution_strategy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resolutionStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="resolutionStrategy")
    def resolution_strategy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resolutionStrategy"))

    @resolution_strategy.setter
    def resolution_strategy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e1b25756f9776db6b0c626aba8e63d7f05bba47670239b49d68b6ceef0c64a1a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resolutionStrategy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeValueSelectionSetting]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeValueSelectionSetting]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeValueSelectionSetting]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9181ec745a812adcd00c3fd7f37f08c9cde6e355e96881bbebad3f76ce4895f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter",
    jsii_struct_bases=[],
    name_mapping={"pattern": "pattern"},
)
class Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter:
    def __init__(self, *, pattern: builtins.str) -> None:
        '''
        :param pattern: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#pattern Lexv2ModelsSlotType#pattern}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1f6c68e6637283d9020477a6e12d87d7721c22d0aef8b2c74e880a0cfe430b03)
            check_type(argname="argument pattern", value=pattern, expected_type=type_hints["pattern"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "pattern": pattern,
        }

    @builtins.property
    def pattern(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#pattern Lexv2ModelsSlotType#pattern}.'''
        result = self._values.get("pattern")
        assert result is not None, "Required property 'pattern' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Lexv2ModelsSlotTypeValueSelectionSettingRegexFilterList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSettingRegexFilterList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__742a2b9eaf4fa83cf23c70dead83aaeb3bba96c4e15bd94a92646a9e7d746ceb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Lexv2ModelsSlotTypeValueSelectionSettingRegexFilterOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42c71386b9192e62b130c85f10e84fc65db63bb0831bf18e311761dd2d654f88)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Lexv2ModelsSlotTypeValueSelectionSettingRegexFilterOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__754ea6699b2c9e1974f2138376d68f589c3494a600578a77ade50c57ab998373)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2d4df574512d57fc292f73234e4e901d11ec9f23544d25ea2aecd93987aba1e7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6d936428a6780c927048f4b5da5c5be1fc4cdd99b4f4e660e9a4cc169d072a9d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0c65c96f79efcb4cac1918e05ae7c9219e830dd331a4d04afbd5b99e92e05e2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Lexv2ModelsSlotTypeValueSelectionSettingRegexFilterOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSettingRegexFilterOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6ea8b50656382219c9de6cb5267f4f2011573759a319d443089e7a7f98d55de3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="patternInput")
    def pattern_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "patternInput"))

    @builtins.property
    @jsii.member(jsii_name="pattern")
    def pattern(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "pattern"))

    @pattern.setter
    def pattern(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__57d2ebcfb7d461edc172fd91f35636575c0ac050c719d6e255bd67c9dd1c8102)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "pattern", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b9a4c52556aec043c0f7c21696139b6dcf7667a5f4be9b8a336718e17ca488e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Lexv2ModelsSlotType",
    "Lexv2ModelsSlotTypeCompositeSlotTypeSetting",
    "Lexv2ModelsSlotTypeCompositeSlotTypeSettingList",
    "Lexv2ModelsSlotTypeCompositeSlotTypeSettingOutputReference",
    "Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots",
    "Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlotsList",
    "Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlotsOutputReference",
    "Lexv2ModelsSlotTypeConfig",
    "Lexv2ModelsSlotTypeExternalSourceSetting",
    "Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting",
    "Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingList",
    "Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingOutputReference",
    "Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource",
    "Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSourceList",
    "Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSourceOutputReference",
    "Lexv2ModelsSlotTypeExternalSourceSettingList",
    "Lexv2ModelsSlotTypeExternalSourceSettingOutputReference",
    "Lexv2ModelsSlotTypeSlotTypeValues",
    "Lexv2ModelsSlotTypeSlotTypeValuesList",
    "Lexv2ModelsSlotTypeSlotTypeValuesOutputReference",
    "Lexv2ModelsSlotTypeSlotTypeValuesSampleValue",
    "Lexv2ModelsSlotTypeSlotTypeValuesSampleValueList",
    "Lexv2ModelsSlotTypeSlotTypeValuesSampleValueOutputReference",
    "Lexv2ModelsSlotTypeSlotTypeValuesSynonyms",
    "Lexv2ModelsSlotTypeSlotTypeValuesSynonymsList",
    "Lexv2ModelsSlotTypeSlotTypeValuesSynonymsOutputReference",
    "Lexv2ModelsSlotTypeTimeouts",
    "Lexv2ModelsSlotTypeTimeoutsOutputReference",
    "Lexv2ModelsSlotTypeValueSelectionSetting",
    "Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting",
    "Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSettingList",
    "Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSettingOutputReference",
    "Lexv2ModelsSlotTypeValueSelectionSettingList",
    "Lexv2ModelsSlotTypeValueSelectionSettingOutputReference",
    "Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter",
    "Lexv2ModelsSlotTypeValueSelectionSettingRegexFilterList",
    "Lexv2ModelsSlotTypeValueSelectionSettingRegexFilterOutputReference",
]

publication.publish()

def _typecheckingstub__8e3f8d364b39fa5839458b79ab4d0bc88b607155917f1f06e1d563f01db8a45a(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    bot_id: builtins.str,
    bot_version: builtins.str,
    locale_id: builtins.str,
    name: builtins.str,
    composite_slot_type_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeCompositeSlotTypeSetting, typing.Dict[builtins.str, typing.Any]]]]] = None,
    description: typing.Optional[builtins.str] = None,
    external_source_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeExternalSourceSetting, typing.Dict[builtins.str, typing.Any]]]]] = None,
    parent_slot_type_signature: typing.Optional[builtins.str] = None,
    slot_type_values: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeSlotTypeValues, typing.Dict[builtins.str, typing.Any]]]]] = None,
    timeouts: typing.Optional[typing.Union[Lexv2ModelsSlotTypeTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    value_selection_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeValueSelectionSetting, typing.Dict[builtins.str, typing.Any]]]]] = None,
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

def _typecheckingstub__60de4863ad730f152b73a04e1d46522cef153fe67d12a9b10a9b4ea2400b2691(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b6ee0a75a3848579a53d6e6182d97b802561cbbf40862b5e0fb77fda9369943(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeCompositeSlotTypeSetting, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c55ac1bb55a4ff753cc350bc53ddf5ac1d3e63494852eb1991f0a82a3be790a9(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeExternalSourceSetting, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__639ab56d7f1c094ae2e57aac38a0a3c3cbcbbc4fccab6859204980447470f07f(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeSlotTypeValues, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9f90dd57bb9bf90241bfa0d7878123fe5eeec77c904d242e95c192e08776455(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeValueSelectionSetting, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__724de64e51d383bf9dc53fde29fd3bbbeee9020e92d468710474eb7824314e76(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a91061cfdf583c43b0afb7d337486d7a7bb159319e9049537c492208adef03b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a54ab2b96fb4a16aaf9976f0ab0314e762e22d916c74b776ec02272fbc28dc5e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78a40a77f8719ba5a29691c39727d2a25bcb11a0395290c156d8878c4e11cd67(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15e6183032d69372c611faf33cce0d58c47a3302dd2b34e3a2828519ec7a05fd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d686e6ef9214f4e518e424ed44220b09a752fc625044348955e4b972f5067ef(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e63168f7eb4c959c4dc56b7d3ba5044944ce46728e80e070395fbcd7b4041df0(
    *,
    sub_slots: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eed10badff57b1fe1a08e2505b52a4f98121fc4584d772c580c0b89e40ab2c41(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__51737cbf7f78c107252bf040eb3ee5325be52ff399d0a6c3fe9ce0a0d7cc1fc7(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33ba6e0cb333432fa660f01d0a7960bfe86142e474085cfacd2e4f10a5e277d0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8897eb5d06be49fd8c36057571df4d9dd50da6b75d3fd679ff2d9e8f72e468a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd231d0f2e74cca75b0dec1d01a687ee19298ba6d4968103dfa2485e9756081b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cfd123c5495b477791706336d4e81cb23c37affae09e2d5008ed5152ae67db25(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeCompositeSlotTypeSetting]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e6da44a296410851414911c3e36a6f03d3e4bf5a954009ed0232699fba7f71a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e32a9c4b51825dcd49f2d0d2ee6d7aeabb7337ed1491657afb177cd828ce52a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__716c47eca915de849c8b92beff169e4970c59c41edd64f4e4caac535793d2214(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeCompositeSlotTypeSetting]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1efa94c1d7430a10a97cfbdd950dc34d2742b0d0fb9ea8ddd0bbf15033da265b(
    *,
    name: builtins.str,
    slot_type_id: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22faab1c5e006ff39d947961e2a3664ea71d549f5abac6dd8d2b31ab6080cf57(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6754b8a1efd62edcde55f1a8c3cd7c0d91fe3d91821af9053e9caf1db7167de0(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5154540054eb41145d7d8c62b1a68dc5b9ff484ca1a14c90ad18fbf37f6813ec(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__502b6fb03ae741f2dc23295dd46d5289a3b3020279948aee7d68107a0e5a0dad(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49a3761b956491a3beb58a02d69024c56539cf67699fa8d4c4d5b4dbff8c5535(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c62fab2fedf9c0a0c0cc9ce061c0f240f58d32b98f361d128751ef65bfc48967(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a43fb729781a375ad4cc6f16d4e489f351195447eba504274359fd6fa166f88(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__38d102517b4f79fed27b847913c3a245215d4fc4a27fa3e787fceea473c44774(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78f76f676b030d5308af088bddeba0479cf219e8b4e69ad00337cbaf1037c613(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0ca5c062bccb929b009906b062cd74d56e2626106bc62c0fa3b8f9b76555f77(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40b9c618cf546d12e4f837766a41d50c80c0ac0238e8ed339494b5e84052c9d5(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    bot_id: builtins.str,
    bot_version: builtins.str,
    locale_id: builtins.str,
    name: builtins.str,
    composite_slot_type_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeCompositeSlotTypeSetting, typing.Dict[builtins.str, typing.Any]]]]] = None,
    description: typing.Optional[builtins.str] = None,
    external_source_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeExternalSourceSetting, typing.Dict[builtins.str, typing.Any]]]]] = None,
    parent_slot_type_signature: typing.Optional[builtins.str] = None,
    slot_type_values: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeSlotTypeValues, typing.Dict[builtins.str, typing.Any]]]]] = None,
    timeouts: typing.Optional[typing.Union[Lexv2ModelsSlotTypeTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    value_selection_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeValueSelectionSetting, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3642fef2ebeb658c31b71113aae8b8a1f88979b6d88b2f4e1a6bb9eb24b5f1c5(
    *,
    grammar_slot_type_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__223b9917f4e64eb8ef1a3ff935cb4ffdd55975e4c1ad2b9f480cce0f2927c56b(
    *,
    source: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e4b074caf7fe7b09ccf48fbac24b8a8b84674f070c185de312730be72e4d9e4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c6e2e9ac8b0c55305b44e3b1b9056fcb5227226b671ac2cc1b1e8187e2a3226(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a91884e52089796ede147300a676e4548c6fde5a78bb5d4ab1b52de37cb7038(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8b28aea1f7822f88850b7b7d40bf5b34ea373de32431db88b00d5401e109655(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b45adbd718cc0d390704213ac29ba317be1c069717db530950b90edce43fb47d(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a9b349d384183c96f475da04d3695e599926a9ea798229da8e582bf13ced9b7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c43a2a3a94cce6f4c17d0638ac88040fb479e873b36508773af43159cfe13f2b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__92b02f00a4ef8a493c0320fa7c9d5d8205d6eaaf90ce75b5719bed5db1c0a0ff(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8c960ecce01c524c4769634bde49e9522fe42c00973aef0130429565ab68f0b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44fab59b9b4058f2db95c5eb91601fd5ae498c938813258bcc56a82b1cc967ac(
    *,
    kms_key_arn: builtins.str,
    s3_bucket_name: builtins.str,
    s3_object_key: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__742eba1b8a9cd3248867120471fcac2880f1095da76aa030ae398f369ad656c9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07bd052feb8a79d2c1ee7a7ebb6696509eb222d2462922e387fce3a5b6aeb4d4(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83ed2fc14533c16a6fbef5230bbfc4f5db42aeb948e12ac77dd160891be08800(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6134a75b90c99f08efb38c62266d1ce0df623f1a876270cde7b3af125298a11a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db68428cf8bec2f9f65eeaaceacecc93c89377e993278a0b395e15d39418c844(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c85b28efcb09e73f2f1e72d5c58257eed0b4d0a1fd5f503b964c0f5e683cb4f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2a3ecfea0db2d988d016fc27cc5f4b26a1a0f45bf29ea4a47a785ba86b98c95(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bcaed7976afaaf6cecb119131b701c929f13a8fd450eb8866d52168965a82f14(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b91c302dc92d7e6637a011bd38b4daf834f62fc84183a8f8f9af7703eb63d172(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d636bed32a235daa5efa24f9ccd057cbecac2d6125d7740a5a9d43cd21b6b207(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f7f0d45ef0314fc4a928ac813b17d4af98c265b7520bf9e456ea82d66a942af(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__277b86074de40fdc7f09d8c20b36601aa2c716bdeb8274a240cea3b3bcfdc00f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a353090d86c587916efe49cf2b2b26c124dfdfd292b1fb83f5c4f3a183c8b5a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54a5de5506bd7ec42229925dc6790e67ed898750df5edd697b0b78d39b4c6b2b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37ffc8ad8b08e8c924b047f3e1e6c57331b7edd8b95f5dd1ac1ae95e1b0296d2(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__63fad8fd872763be33530fe2f322ff6f94f5187a37beeac0d2a27c999186bae3(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f550df28dfdcf56ba02d14d1540c5098d8a7b2c25fb867bf8050e015bcce4bd1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeExternalSourceSetting]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98bb1a1153f4fe58dac8d83a4ca02b4c7522843430c87b483013c7721f2c5b4f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2ca15154297cb4d17d7a4a3f9549eea434a3cbb712f8d5e7626ace61813b804(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8fedd7b5f32d2d6ffe0862001fadc53d25b28d984f55302363a76d7a50b91d1f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeExternalSourceSetting]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d84b5a3313c02b420807e62702071b44cda708bad613d1dd73029219e61f601c(
    *,
    sample_value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeSlotTypeValuesSampleValue, typing.Dict[builtins.str, typing.Any]]]]] = None,
    synonyms: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeSlotTypeValuesSynonyms, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e4b37cace91d623e4ae2e3da9bd665099f71518e5ab4f6b4b54a494668507a9a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__671ee15cb8e930415fbcf09c581914573524e33174143c78410ac99932751105(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04a3031891e8453c3bbd950f11f317e735727da797a1a739424244064188f2fe(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88ff4ea61fa0a985084c97fc9bf5643384ac98f7cfaf9129b34c955bcecc4a17(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b09dd2bbd2c4a7b36018ef3d20f69e4c2f7a76855a914f74187ea9f3b8670a27(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b5b63e676c8eae75d94e8ae4f26902945664d21af9362544ce49434c599b3e8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeSlotTypeValues]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb1e89f8fb6ce0343a82425d3b170d70fccbd486ba9aada80dd82d6b6a57e3b9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be964d99fc91b6195a728b0947387431316acd73810348187cbb271b3a17d438(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeSlotTypeValuesSampleValue, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__457b375923046de2e75cc80d32bd192399ad79c3d28933af9df9ee08bcdaa4d4(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeSlotTypeValuesSynonyms, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__570bb7d32a8d53897568b589186ab685aac8626950cef361533f463e464104fb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeSlotTypeValues]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fce5e8f2fc4c140dd114350d33dd28fd1e481f960d83982d7a11da89042f0ae4(
    *,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__763c1222e76c0d43792c1579740b90aba2822f9f7f4ec055d2fdb45372b9d71b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21994c2e4ddf7682745391f3f4659cb22490b9829cbb886d1d12a3e4af3055cf(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b488b9b5f5cc41d1f950062e28c7027f0bf33688a94752b5960b4980abcbe19(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4d15d029080229e9ba24b5b5c33f859b4466ed241f564b072445596f5729938(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7642c22c09f1e42e510c5385b93f43ff7ae1ac7745fc000518e6a496828e135(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02d5e58baab7fb342500a0bff910ebc2fb92d1efe0ca81564287e1350e77d828(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeSlotTypeValuesSampleValue]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a78d483c150334f1f4ab5b2d6c94b28df571fd75cd4200870021d576fc621281(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ffb1522538729d904fc95407677562689f2abf4a80733cd1e7285e290290bbf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68bdbdeee6f7ff6b4635cc53c7bdb9566c5eacaf29958ce67b4859fe0607fc90(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeSlotTypeValuesSampleValue]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15d2db950cc038e1a484236afadfd36317dcba3d33af4efd94235c16a0647945(
    *,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22cfe5dca9e2c1237d498ffd12887b1e23e13eaf0ffb9c248c5b93230291da2a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ddde7f096534c889a7619d1c52fbb874650ca6ff8fb7cf5b4c4f1154af5c946(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b7077c1759853e77b01863b0764cf88267b09c8d1856c8a8e053f7ec5559aac(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94c6d2e70b1f29a510f40ad8c4e6dd87b6e2c13c8920d35ae5a68901247d9d2b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73507f2adacf914fcd4a8885c512d8dd39d7767c5fa1675f6a36b79d04e1809e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a80aecd7ce7856305e923bc059691430911bd9fa02e51ca913fb9afd1226af2a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeSlotTypeValuesSynonyms]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aad9d19d2fb725e1993f5cbf6f1bc15285ca4d7fdde12c6b62a2e3716e98850f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ad00e38536e29bc9f3629bf837fb0430bd0a877878e66e948f07e0248edbf19(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b96ff11c7f2ab12e34220f1cfdd7d8fa3a601a3ecb7396538826f05e1e14dc97(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeSlotTypeValuesSynonyms]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a04ff591443995850aaf800543df82778e5c9d3a57abd459a1642f52118e9d10(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d907669fa3921855256b234f92d5abdf7c413c7d6f1d245a2fc950867ec6f820(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__57a335baa105538b6076a7bc45e8fe5a04304b433d59ab41e717d91bdb694c24(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ff11821d75c80b26d6294c09912b3d83745325553f7017e2d926e9b289db073(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__13c18421642175d31c992b433c11ce8c055b7c7733dcc7c52460b7ee490f846e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3bba0802c1a023be182ade6a0c3056f943925e15547f13fa3f47508b25e2159(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeTimeouts]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24351eaf13aec28c17d5030f83c342a5758e12ffd585e4cc32d77dd73dd4161c(
    *,
    resolution_strategy: builtins.str,
    advanced_recognition_setting: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting, typing.Dict[builtins.str, typing.Any]]]]] = None,
    regex_filter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__158d38bbdb2fb40339819b2a36da67ad28d9610ad8eb9c57a2ece5e18e6b6074(
    *,
    audio_recognition_strategy: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76e45676d54859138afcfdb9fbf417dbf7b6cf7f59aea1e41cefee917f5c09b6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb167e0e228691db584e977f31c9c4e9342aec35d480afff2c24de7ee0d9c917(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dea7cfa313daf9420a00e2472ad7cbe9c52b5d0372453f55962a9f88b6fc7ce6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__340c93ebf41dabd1bdd0fa047fb2a1bb4628eecc674adb8e3b2e7cb000a8c3fd(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c2cb19bf7528ae61eadeb8d75a925e7a5b8eaa5ecaf0da155ea1007b83c3d3d(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8769bfd3d4071e061ba63be059fcc21ffceaf8ad33d254cc59161483ba5d73f3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b736ba57d093ea0f7f0b0117d3e3ccbd9f5e85b40a99b5b7b29485ab2c96c29f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b8b7a86b1d43bb84802af11feab5123080be40e5bfee751b64498583f23c7e0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__440b75f52eef203268a953dccfd9c5f0804e004cf6a26f6c009a2200c666912b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ebdaefc4d8ba732a340d9055f2e78541621f079fa396b93c187705ff784cb8e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f2916f76af47a53d88dd49886af91c4b56a29d417b2f518fdbd79079118e0c0(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f40205898db9cbfdc58d73702393bc99ec99325b36758ab3fbe0c2dc888e9cbf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a05ec8a42d7002d69ebaee45c62c524c88caccba2aad32d34886a7a7f430004d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdf1aca23083ecb203441b9aa4eea9bae7c4a187290be74206ef2125efd57cb2(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__25772ea0f69446b950ac0227f76d351f53942548724cc6a0d4978978ea588e7d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSetting]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__737628b102c72005e2f33fd48c4709677a64cb2bfd13f10dd0819a9ea33d04ec(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5f11daf56cb42d5f23eea53ba5b9194a69b84bfc9c256241ee03c14f819ebee(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a93b9845a7b4000fd0d35c1e776879ac4524c070760c37b585e422368143dd5(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1b25756f9776db6b0c626aba8e63d7f05bba47670239b49d68b6ceef0c64a1a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9181ec745a812adcd00c3fd7f37f08c9cde6e355e96881bbebad3f76ce4895f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeValueSelectionSetting]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f6c68e6637283d9020477a6e12d87d7721c22d0aef8b2c74e880a0cfe430b03(
    *,
    pattern: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__742a2b9eaf4fa83cf23c70dead83aaeb3bba96c4e15bd94a92646a9e7d746ceb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42c71386b9192e62b130c85f10e84fc65db63bb0831bf18e311761dd2d654f88(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__754ea6699b2c9e1974f2138376d68f589c3494a600578a77ade50c57ab998373(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d4df574512d57fc292f73234e4e901d11ec9f23544d25ea2aecd93987aba1e7(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d936428a6780c927048f4b5da5c5be1fc4cdd99b4f4e660e9a4cc169d072a9d(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0c65c96f79efcb4cac1918e05ae7c9219e830dd331a4d04afbd5b99e92e05e2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ea8b50656382219c9de6cb5267f4f2011573759a319d443089e7a7f98d55de3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__57d2ebcfb7d461edc172fd91f35636575c0ac050c719d6e255bd67c9dd1c8102(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9a4c52556aec043c0f7c21696139b6dcf7667a5f4be9b8a336718e17ca488e7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter]],
) -> None:
    """Type checking stubs"""
    pass
