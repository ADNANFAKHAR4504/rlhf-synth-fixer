r'''
# `aws_ssmcontacts_plan`

Refer to the Terraform Registry for docs: [`aws_ssmcontacts_plan`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan).
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


class SsmcontactsPlan(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsPlan.SsmcontactsPlan",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan aws_ssmcontacts_plan}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        contact_id: builtins.str,
        stage: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsPlanStage", typing.Dict[builtins.str, typing.Any]]]],
        id: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan aws_ssmcontacts_plan} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param contact_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_id SsmcontactsPlan#contact_id}.
        :param stage: stage block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#stage SsmcontactsPlan#stage}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#id SsmcontactsPlan#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2c5780a9ce8ba50df0658c064291d426c2a70755475911eafa76370f8b52624)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = SsmcontactsPlanConfig(
            contact_id=contact_id,
            stage=stage,
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
        '''Generates CDKTF code for importing a SsmcontactsPlan resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the SsmcontactsPlan to import.
        :param import_from_id: The id of the existing SsmcontactsPlan that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the SsmcontactsPlan to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__29ddeaa0e394ace0ca080944f8a5863e12851520e4a382142ea106ec4a319aa8)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putStage")
    def put_stage(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsPlanStage", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__69f4fbcaa584a0900b0367d6692b8031d7391291c8ca23456064102b25008c47)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putStage", [value]))

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
    @jsii.member(jsii_name="stage")
    def stage(self) -> "SsmcontactsPlanStageList":
        return typing.cast("SsmcontactsPlanStageList", jsii.get(self, "stage"))

    @builtins.property
    @jsii.member(jsii_name="contactIdInput")
    def contact_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contactIdInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="stageInput")
    def stage_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsPlanStage"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsPlanStage"]]], jsii.get(self, "stageInput"))

    @builtins.property
    @jsii.member(jsii_name="contactId")
    def contact_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contactId"))

    @contact_id.setter
    def contact_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d4ae72b9471a1db3520b5a2b8f21ea9e6d2ae7df411fa8b7a85585ba8272fd4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contactId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6def042873dc408bca6c0b82c56e61e2af2a66fc742c7b4b2a136743afb6e961)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmcontactsPlan.SsmcontactsPlanConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "contact_id": "contactId",
        "stage": "stage",
        "id": "id",
    },
)
class SsmcontactsPlanConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        contact_id: builtins.str,
        stage: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsPlanStage", typing.Dict[builtins.str, typing.Any]]]],
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
        :param contact_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_id SsmcontactsPlan#contact_id}.
        :param stage: stage block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#stage SsmcontactsPlan#stage}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#id SsmcontactsPlan#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__051494b032eb6b56d4b5dd11ea72d6dfc3eff44ecc8f91f37f9ff2449872aa03)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument contact_id", value=contact_id, expected_type=type_hints["contact_id"])
            check_type(argname="argument stage", value=stage, expected_type=type_hints["stage"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "contact_id": contact_id,
            "stage": stage,
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
    def contact_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_id SsmcontactsPlan#contact_id}.'''
        result = self._values.get("contact_id")
        assert result is not None, "Required property 'contact_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def stage(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsPlanStage"]]:
        '''stage block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#stage SsmcontactsPlan#stage}
        '''
        result = self._values.get("stage")
        assert result is not None, "Required property 'stage' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsPlanStage"]], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#id SsmcontactsPlan#id}.

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
        return "SsmcontactsPlanConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ssmcontactsPlan.SsmcontactsPlanStage",
    jsii_struct_bases=[],
    name_mapping={"duration_in_minutes": "durationInMinutes", "target": "target"},
)
class SsmcontactsPlanStage:
    def __init__(
        self,
        *,
        duration_in_minutes: jsii.Number,
        target: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsPlanStageTarget", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param duration_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#duration_in_minutes SsmcontactsPlan#duration_in_minutes}.
        :param target: target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#target SsmcontactsPlan#target}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__72eb19090897c8b3fc986b0fa97921e2c6dd860f92dc528e9bb28798a1220c57)
            check_type(argname="argument duration_in_minutes", value=duration_in_minutes, expected_type=type_hints["duration_in_minutes"])
            check_type(argname="argument target", value=target, expected_type=type_hints["target"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "duration_in_minutes": duration_in_minutes,
        }
        if target is not None:
            self._values["target"] = target

    @builtins.property
    def duration_in_minutes(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#duration_in_minutes SsmcontactsPlan#duration_in_minutes}.'''
        result = self._values.get("duration_in_minutes")
        assert result is not None, "Required property 'duration_in_minutes' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def target(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsPlanStageTarget"]]]:
        '''target block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#target SsmcontactsPlan#target}
        '''
        result = self._values.get("target")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsPlanStageTarget"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsPlanStage(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmcontactsPlanStageList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsPlan.SsmcontactsPlanStageList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9096ba2c3db37689ac1b303709ced5593b59df13d9d0e4b3f76c465af681e183)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "SsmcontactsPlanStageOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e57f2e8b7a841e767f94f82c0d6a73b002a298d54bcb51106e400f5242fef44f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmcontactsPlanStageOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f604bea6d1de209aeee9245c740d504eed5c378b4ca8fe9328a5c36b4f1bea7b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4ff7e5867310027c14c8d77692334c13254e88c4a3c22b183fca48afdc091220)
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
            type_hints = typing.get_type_hints(_typecheckingstub__58171f4111f8756e404136e41e96218c07b0c50bf5b00a8a22658ebcca4f3a8e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsPlanStage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsPlanStage]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsPlanStage]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__186cbb63ea59dba1d809edb7f72f520c77408b26e8237ef43c2f8903f08eeb25)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsPlanStageOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsPlan.SsmcontactsPlanStageOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9d7d409bb836d881175c9f86764d692c27943a0f8d97d0d517074f030466c6b1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putTarget")
    def put_target(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsPlanStageTarget", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__890f82db8acf0a2da0ca85c8aee4d7a24b23ef2c781ba24ff4226bc02450d591)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTarget", [value]))

    @jsii.member(jsii_name="resetTarget")
    def reset_target(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTarget", []))

    @builtins.property
    @jsii.member(jsii_name="target")
    def target(self) -> "SsmcontactsPlanStageTargetList":
        return typing.cast("SsmcontactsPlanStageTargetList", jsii.get(self, "target"))

    @builtins.property
    @jsii.member(jsii_name="durationInMinutesInput")
    def duration_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "durationInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="targetInput")
    def target_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsPlanStageTarget"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsPlanStageTarget"]]], jsii.get(self, "targetInput"))

    @builtins.property
    @jsii.member(jsii_name="durationInMinutes")
    def duration_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "durationInMinutes"))

    @duration_in_minutes.setter
    def duration_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__54bd61433388276462b8c40383ee25a11cf1e6e5e670ddbddacf2600ca718850)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "durationInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsPlanStage]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsPlanStage]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsPlanStage]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d66f14328923f0df5c2ca63edf093eb6a82e8994ddeb385afe3149b685e124c0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmcontactsPlan.SsmcontactsPlanStageTarget",
    jsii_struct_bases=[],
    name_mapping={
        "channel_target_info": "channelTargetInfo",
        "contact_target_info": "contactTargetInfo",
    },
)
class SsmcontactsPlanStageTarget:
    def __init__(
        self,
        *,
        channel_target_info: typing.Optional[typing.Union["SsmcontactsPlanStageTargetChannelTargetInfo", typing.Dict[builtins.str, typing.Any]]] = None,
        contact_target_info: typing.Optional[typing.Union["SsmcontactsPlanStageTargetContactTargetInfo", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param channel_target_info: channel_target_info block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#channel_target_info SsmcontactsPlan#channel_target_info}
        :param contact_target_info: contact_target_info block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_target_info SsmcontactsPlan#contact_target_info}
        '''
        if isinstance(channel_target_info, dict):
            channel_target_info = SsmcontactsPlanStageTargetChannelTargetInfo(**channel_target_info)
        if isinstance(contact_target_info, dict):
            contact_target_info = SsmcontactsPlanStageTargetContactTargetInfo(**contact_target_info)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6a2f096e126a49cd700fe21923e28bacd44e31ccaceb8d553f0255f85949876c)
            check_type(argname="argument channel_target_info", value=channel_target_info, expected_type=type_hints["channel_target_info"])
            check_type(argname="argument contact_target_info", value=contact_target_info, expected_type=type_hints["contact_target_info"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if channel_target_info is not None:
            self._values["channel_target_info"] = channel_target_info
        if contact_target_info is not None:
            self._values["contact_target_info"] = contact_target_info

    @builtins.property
    def channel_target_info(
        self,
    ) -> typing.Optional["SsmcontactsPlanStageTargetChannelTargetInfo"]:
        '''channel_target_info block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#channel_target_info SsmcontactsPlan#channel_target_info}
        '''
        result = self._values.get("channel_target_info")
        return typing.cast(typing.Optional["SsmcontactsPlanStageTargetChannelTargetInfo"], result)

    @builtins.property
    def contact_target_info(
        self,
    ) -> typing.Optional["SsmcontactsPlanStageTargetContactTargetInfo"]:
        '''contact_target_info block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_target_info SsmcontactsPlan#contact_target_info}
        '''
        result = self._values.get("contact_target_info")
        return typing.cast(typing.Optional["SsmcontactsPlanStageTargetContactTargetInfo"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsPlanStageTarget(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ssmcontactsPlan.SsmcontactsPlanStageTargetChannelTargetInfo",
    jsii_struct_bases=[],
    name_mapping={
        "contact_channel_id": "contactChannelId",
        "retry_interval_in_minutes": "retryIntervalInMinutes",
    },
)
class SsmcontactsPlanStageTargetChannelTargetInfo:
    def __init__(
        self,
        *,
        contact_channel_id: builtins.str,
        retry_interval_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param contact_channel_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_channel_id SsmcontactsPlan#contact_channel_id}.
        :param retry_interval_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#retry_interval_in_minutes SsmcontactsPlan#retry_interval_in_minutes}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0be27c78f6cfe7993ebd2ee665f6c9e3a3bf73f404d9f478e37e292bf9d277a0)
            check_type(argname="argument contact_channel_id", value=contact_channel_id, expected_type=type_hints["contact_channel_id"])
            check_type(argname="argument retry_interval_in_minutes", value=retry_interval_in_minutes, expected_type=type_hints["retry_interval_in_minutes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "contact_channel_id": contact_channel_id,
        }
        if retry_interval_in_minutes is not None:
            self._values["retry_interval_in_minutes"] = retry_interval_in_minutes

    @builtins.property
    def contact_channel_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_channel_id SsmcontactsPlan#contact_channel_id}.'''
        result = self._values.get("contact_channel_id")
        assert result is not None, "Required property 'contact_channel_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def retry_interval_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#retry_interval_in_minutes SsmcontactsPlan#retry_interval_in_minutes}.'''
        result = self._values.get("retry_interval_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsPlanStageTargetChannelTargetInfo(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmcontactsPlanStageTargetChannelTargetInfoOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsPlan.SsmcontactsPlanStageTargetChannelTargetInfoOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__95650e1e67440c18eb0b13370637e8b7fa915bfce0c6184add9f969ee6e9b3fd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetRetryIntervalInMinutes")
    def reset_retry_interval_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRetryIntervalInMinutes", []))

    @builtins.property
    @jsii.member(jsii_name="contactChannelIdInput")
    def contact_channel_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contactChannelIdInput"))

    @builtins.property
    @jsii.member(jsii_name="retryIntervalInMinutesInput")
    def retry_interval_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "retryIntervalInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="contactChannelId")
    def contact_channel_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contactChannelId"))

    @contact_channel_id.setter
    def contact_channel_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__017b551d4c4d5e110cd6fd5f6f93b382aa3f11a59c059d38cffb907587d0f399)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contactChannelId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="retryIntervalInMinutes")
    def retry_interval_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "retryIntervalInMinutes"))

    @retry_interval_in_minutes.setter
    def retry_interval_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__28fe1d9cc6f43332e22b0fda1db8ae7dae31b29942493bc439c2cad087e7b2e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "retryIntervalInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SsmcontactsPlanStageTargetChannelTargetInfo]:
        return typing.cast(typing.Optional[SsmcontactsPlanStageTargetChannelTargetInfo], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SsmcontactsPlanStageTargetChannelTargetInfo],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1430c27905dd9f5b53192cc1961faf3a5ebbbabecc769da2cfc45f8a8197e2c2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmcontactsPlan.SsmcontactsPlanStageTargetContactTargetInfo",
    jsii_struct_bases=[],
    name_mapping={"is_essential": "isEssential", "contact_id": "contactId"},
)
class SsmcontactsPlanStageTargetContactTargetInfo:
    def __init__(
        self,
        *,
        is_essential: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        contact_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param is_essential: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#is_essential SsmcontactsPlan#is_essential}.
        :param contact_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_id SsmcontactsPlan#contact_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ad4919e97b43e8c3211beafc2481ef42e8cbf9225a1203b418d35966a1209916)
            check_type(argname="argument is_essential", value=is_essential, expected_type=type_hints["is_essential"])
            check_type(argname="argument contact_id", value=contact_id, expected_type=type_hints["contact_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "is_essential": is_essential,
        }
        if contact_id is not None:
            self._values["contact_id"] = contact_id

    @builtins.property
    def is_essential(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#is_essential SsmcontactsPlan#is_essential}.'''
        result = self._values.get("is_essential")
        assert result is not None, "Required property 'is_essential' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    @builtins.property
    def contact_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_id SsmcontactsPlan#contact_id}.'''
        result = self._values.get("contact_id")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsPlanStageTargetContactTargetInfo(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmcontactsPlanStageTargetContactTargetInfoOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsPlan.SsmcontactsPlanStageTargetContactTargetInfoOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ca75afe04b5655f758f8c9568da73dde0869822c975f522ca74919f24eb68928)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetContactId")
    def reset_contact_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContactId", []))

    @builtins.property
    @jsii.member(jsii_name="contactIdInput")
    def contact_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contactIdInput"))

    @builtins.property
    @jsii.member(jsii_name="isEssentialInput")
    def is_essential_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "isEssentialInput"))

    @builtins.property
    @jsii.member(jsii_name="contactId")
    def contact_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contactId"))

    @contact_id.setter
    def contact_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e0928dcecab4e8409bab356e18deac90356a38910694c8b1308389f897cda68)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contactId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="isEssential")
    def is_essential(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "isEssential"))

    @is_essential.setter
    def is_essential(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__97fe8a469f933dd5daaf43867b2ce481b7337e301ce75d97aa31f5aa6819603c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "isEssential", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SsmcontactsPlanStageTargetContactTargetInfo]:
        return typing.cast(typing.Optional[SsmcontactsPlanStageTargetContactTargetInfo], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SsmcontactsPlanStageTargetContactTargetInfo],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__54fbc6ff2d275e3f8e7a8043efbb7816c85e26c53df9e5908a22b1212654e9b9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsPlanStageTargetList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsPlan.SsmcontactsPlanStageTargetList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4b534ac0448851ea29e5f4bdbfc481cd304acf71afd46060ee7d1df8389a8372)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "SsmcontactsPlanStageTargetOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fa153d95171da6257146f7ca03443412b56c17dd74512a59608bb8d55a19e7f0)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmcontactsPlanStageTargetOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__89352887c298591406771835d6fe67502239956c2b3edd44c5686c5d4648abd3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__495f5bd3179eba69212c2f9351f3653a7607b77513fdb7a0a17dbf2dc73316a0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e23977e8498437c08f1e262fac31256807201a15759b7c09a4e2fef1de605024)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsPlanStageTarget]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsPlanStageTarget]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsPlanStageTarget]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e9ed9e32e64a059da2597e0c2e55c3a3821265bb89b44938f24ef5ffb3b0006a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsPlanStageTargetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsPlan.SsmcontactsPlanStageTargetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__721cbe5e05d896a6a68e1876cdb476c6a578df04822efb602f53a42d843f1cb7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putChannelTargetInfo")
    def put_channel_target_info(
        self,
        *,
        contact_channel_id: builtins.str,
        retry_interval_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param contact_channel_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_channel_id SsmcontactsPlan#contact_channel_id}.
        :param retry_interval_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#retry_interval_in_minutes SsmcontactsPlan#retry_interval_in_minutes}.
        '''
        value = SsmcontactsPlanStageTargetChannelTargetInfo(
            contact_channel_id=contact_channel_id,
            retry_interval_in_minutes=retry_interval_in_minutes,
        )

        return typing.cast(None, jsii.invoke(self, "putChannelTargetInfo", [value]))

    @jsii.member(jsii_name="putContactTargetInfo")
    def put_contact_target_info(
        self,
        *,
        is_essential: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        contact_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param is_essential: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#is_essential SsmcontactsPlan#is_essential}.
        :param contact_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#contact_id SsmcontactsPlan#contact_id}.
        '''
        value = SsmcontactsPlanStageTargetContactTargetInfo(
            is_essential=is_essential, contact_id=contact_id
        )

        return typing.cast(None, jsii.invoke(self, "putContactTargetInfo", [value]))

    @jsii.member(jsii_name="resetChannelTargetInfo")
    def reset_channel_target_info(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetChannelTargetInfo", []))

    @jsii.member(jsii_name="resetContactTargetInfo")
    def reset_contact_target_info(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContactTargetInfo", []))

    @builtins.property
    @jsii.member(jsii_name="channelTargetInfo")
    def channel_target_info(
        self,
    ) -> SsmcontactsPlanStageTargetChannelTargetInfoOutputReference:
        return typing.cast(SsmcontactsPlanStageTargetChannelTargetInfoOutputReference, jsii.get(self, "channelTargetInfo"))

    @builtins.property
    @jsii.member(jsii_name="contactTargetInfo")
    def contact_target_info(
        self,
    ) -> SsmcontactsPlanStageTargetContactTargetInfoOutputReference:
        return typing.cast(SsmcontactsPlanStageTargetContactTargetInfoOutputReference, jsii.get(self, "contactTargetInfo"))

    @builtins.property
    @jsii.member(jsii_name="channelTargetInfoInput")
    def channel_target_info_input(
        self,
    ) -> typing.Optional[SsmcontactsPlanStageTargetChannelTargetInfo]:
        return typing.cast(typing.Optional[SsmcontactsPlanStageTargetChannelTargetInfo], jsii.get(self, "channelTargetInfoInput"))

    @builtins.property
    @jsii.member(jsii_name="contactTargetInfoInput")
    def contact_target_info_input(
        self,
    ) -> typing.Optional[SsmcontactsPlanStageTargetContactTargetInfo]:
        return typing.cast(typing.Optional[SsmcontactsPlanStageTargetContactTargetInfo], jsii.get(self, "contactTargetInfoInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsPlanStageTarget]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsPlanStageTarget]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsPlanStageTarget]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__406210a1d743694e46b81ce6af200289cf4d052d9afb23bd3c918b72e38f3612)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "SsmcontactsPlan",
    "SsmcontactsPlanConfig",
    "SsmcontactsPlanStage",
    "SsmcontactsPlanStageList",
    "SsmcontactsPlanStageOutputReference",
    "SsmcontactsPlanStageTarget",
    "SsmcontactsPlanStageTargetChannelTargetInfo",
    "SsmcontactsPlanStageTargetChannelTargetInfoOutputReference",
    "SsmcontactsPlanStageTargetContactTargetInfo",
    "SsmcontactsPlanStageTargetContactTargetInfoOutputReference",
    "SsmcontactsPlanStageTargetList",
    "SsmcontactsPlanStageTargetOutputReference",
]

publication.publish()

def _typecheckingstub__b2c5780a9ce8ba50df0658c064291d426c2a70755475911eafa76370f8b52624(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    contact_id: builtins.str,
    stage: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsPlanStage, typing.Dict[builtins.str, typing.Any]]]],
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

def _typecheckingstub__29ddeaa0e394ace0ca080944f8a5863e12851520e4a382142ea106ec4a319aa8(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__69f4fbcaa584a0900b0367d6692b8031d7391291c8ca23456064102b25008c47(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsPlanStage, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d4ae72b9471a1db3520b5a2b8f21ea9e6d2ae7df411fa8b7a85585ba8272fd4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6def042873dc408bca6c0b82c56e61e2af2a66fc742c7b4b2a136743afb6e961(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__051494b032eb6b56d4b5dd11ea72d6dfc3eff44ecc8f91f37f9ff2449872aa03(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    contact_id: builtins.str,
    stage: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsPlanStage, typing.Dict[builtins.str, typing.Any]]]],
    id: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72eb19090897c8b3fc986b0fa97921e2c6dd860f92dc528e9bb28798a1220c57(
    *,
    duration_in_minutes: jsii.Number,
    target: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsPlanStageTarget, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9096ba2c3db37689ac1b303709ced5593b59df13d9d0e4b3f76c465af681e183(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e57f2e8b7a841e767f94f82c0d6a73b002a298d54bcb51106e400f5242fef44f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f604bea6d1de209aeee9245c740d504eed5c378b4ca8fe9328a5c36b4f1bea7b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ff7e5867310027c14c8d77692334c13254e88c4a3c22b183fca48afdc091220(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__58171f4111f8756e404136e41e96218c07b0c50bf5b00a8a22658ebcca4f3a8e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__186cbb63ea59dba1d809edb7f72f520c77408b26e8237ef43c2f8903f08eeb25(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsPlanStage]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d7d409bb836d881175c9f86764d692c27943a0f8d97d0d517074f030466c6b1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__890f82db8acf0a2da0ca85c8aee4d7a24b23ef2c781ba24ff4226bc02450d591(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsPlanStageTarget, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54bd61433388276462b8c40383ee25a11cf1e6e5e670ddbddacf2600ca718850(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d66f14328923f0df5c2ca63edf093eb6a82e8994ddeb385afe3149b685e124c0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsPlanStage]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6a2f096e126a49cd700fe21923e28bacd44e31ccaceb8d553f0255f85949876c(
    *,
    channel_target_info: typing.Optional[typing.Union[SsmcontactsPlanStageTargetChannelTargetInfo, typing.Dict[builtins.str, typing.Any]]] = None,
    contact_target_info: typing.Optional[typing.Union[SsmcontactsPlanStageTargetContactTargetInfo, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0be27c78f6cfe7993ebd2ee665f6c9e3a3bf73f404d9f478e37e292bf9d277a0(
    *,
    contact_channel_id: builtins.str,
    retry_interval_in_minutes: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__95650e1e67440c18eb0b13370637e8b7fa915bfce0c6184add9f969ee6e9b3fd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__017b551d4c4d5e110cd6fd5f6f93b382aa3f11a59c059d38cffb907587d0f399(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28fe1d9cc6f43332e22b0fda1db8ae7dae31b29942493bc439c2cad087e7b2e7(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1430c27905dd9f5b53192cc1961faf3a5ebbbabecc769da2cfc45f8a8197e2c2(
    value: typing.Optional[SsmcontactsPlanStageTargetChannelTargetInfo],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ad4919e97b43e8c3211beafc2481ef42e8cbf9225a1203b418d35966a1209916(
    *,
    is_essential: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    contact_id: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca75afe04b5655f758f8c9568da73dde0869822c975f522ca74919f24eb68928(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e0928dcecab4e8409bab356e18deac90356a38910694c8b1308389f897cda68(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__97fe8a469f933dd5daaf43867b2ce481b7337e301ce75d97aa31f5aa6819603c(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54fbc6ff2d275e3f8e7a8043efbb7816c85e26c53df9e5908a22b1212654e9b9(
    value: typing.Optional[SsmcontactsPlanStageTargetContactTargetInfo],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b534ac0448851ea29e5f4bdbfc481cd304acf71afd46060ee7d1df8389a8372(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fa153d95171da6257146f7ca03443412b56c17dd74512a59608bb8d55a19e7f0(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__89352887c298591406771835d6fe67502239956c2b3edd44c5686c5d4648abd3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__495f5bd3179eba69212c2f9351f3653a7607b77513fdb7a0a17dbf2dc73316a0(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e23977e8498437c08f1e262fac31256807201a15759b7c09a4e2fef1de605024(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e9ed9e32e64a059da2597e0c2e55c3a3821265bb89b44938f24ef5ffb3b0006a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsPlanStageTarget]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__721cbe5e05d896a6a68e1876cdb476c6a578df04822efb602f53a42d843f1cb7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__406210a1d743694e46b81ce6af200289cf4d052d9afb23bd3c918b72e38f3612(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsPlanStageTarget]],
) -> None:
    """Type checking stubs"""
    pass
