r'''
# `aws_resiliencehub_resiliency_policy`

Refer to the Terraform Registry for docs: [`aws_resiliencehub_resiliency_policy`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy).
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


class ResiliencehubResiliencyPolicy(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicy",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy aws_resiliencehub_resiliency_policy}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        name: builtins.str,
        tier: builtins.str,
        data_location_constraint: typing.Optional[builtins.str] = None,
        description: typing.Optional[builtins.str] = None,
        policy: typing.Optional[typing.Union["ResiliencehubResiliencyPolicyPolicy", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["ResiliencehubResiliencyPolicyTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy aws_resiliencehub_resiliency_policy} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param name: The name of the policy. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#name ResiliencehubResiliencyPolicy#name}
        :param tier: The tier for the resiliency policy, ranging from the highest severity (MissionCritical) to lowest (NonCritical). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#tier ResiliencehubResiliencyPolicy#tier}
        :param data_location_constraint: Specifies a high-level geographical location constraint for where resilience policy data can be stored. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#data_location_constraint ResiliencehubResiliencyPolicy#data_location_constraint}
        :param description: The description for the policy. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#description ResiliencehubResiliencyPolicy#description}
        :param policy: policy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#policy ResiliencehubResiliencyPolicy#policy}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#tags ResiliencehubResiliencyPolicy#tags}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#timeouts ResiliencehubResiliencyPolicy#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a7475792e6e4a1fb1eb697db5fe41f01eb171e5c8d3ccafa11480ee7beff661a)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = ResiliencehubResiliencyPolicyConfig(
            name=name,
            tier=tier,
            data_location_constraint=data_location_constraint,
            description=description,
            policy=policy,
            tags=tags,
            timeouts=timeouts,
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
        '''Generates CDKTF code for importing a ResiliencehubResiliencyPolicy resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the ResiliencehubResiliencyPolicy to import.
        :param import_from_id: The id of the existing ResiliencehubResiliencyPolicy that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the ResiliencehubResiliencyPolicy to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dfaad131f54d077bbfde60cc137ef23232087e41fcfa4be38187371de308975e)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putPolicy")
    def put_policy(
        self,
        *,
        az: typing.Union["ResiliencehubResiliencyPolicyPolicyAz", typing.Dict[builtins.str, typing.Any]],
        hardware: typing.Union["ResiliencehubResiliencyPolicyPolicyHardware", typing.Dict[builtins.str, typing.Any]],
        software_attribute: typing.Union["ResiliencehubResiliencyPolicyPolicySoftware", typing.Dict[builtins.str, typing.Any]],
        region: typing.Optional[typing.Union["ResiliencehubResiliencyPolicyPolicyRegion", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param az: az block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#az ResiliencehubResiliencyPolicy#az}
        :param hardware: hardware block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#hardware ResiliencehubResiliencyPolicy#hardware}
        :param software_attribute: software block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#software ResiliencehubResiliencyPolicy#software}
        :param region: region block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#region ResiliencehubResiliencyPolicy#region}
        '''
        value = ResiliencehubResiliencyPolicyPolicy(
            az=az,
            hardware=hardware,
            software_attribute=software_attribute,
            region=region,
        )

        return typing.cast(None, jsii.invoke(self, "putPolicy", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#create ResiliencehubResiliencyPolicy#create}
        :param delete: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#delete ResiliencehubResiliencyPolicy#delete}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#update ResiliencehubResiliencyPolicy#update}
        '''
        value = ResiliencehubResiliencyPolicyTimeouts(
            create=create, delete=delete, update=update
        )

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetDataLocationConstraint")
    def reset_data_location_constraint(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataLocationConstraint", []))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetPolicy")
    def reset_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPolicy", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

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
    @jsii.member(jsii_name="estimatedCostTier")
    def estimated_cost_tier(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "estimatedCostTier"))

    @builtins.property
    @jsii.member(jsii_name="policy")
    def policy(self) -> "ResiliencehubResiliencyPolicyPolicyOutputReference":
        return typing.cast("ResiliencehubResiliencyPolicyPolicyOutputReference", jsii.get(self, "policy"))

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> _cdktf_9a9027ec.StringMap:
        return typing.cast(_cdktf_9a9027ec.StringMap, jsii.get(self, "tagsAll"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "ResiliencehubResiliencyPolicyTimeoutsOutputReference":
        return typing.cast("ResiliencehubResiliencyPolicyTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="dataLocationConstraintInput")
    def data_location_constraint_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataLocationConstraintInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="policyInput")
    def policy_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "ResiliencehubResiliencyPolicyPolicy"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "ResiliencehubResiliencyPolicyPolicy"]], jsii.get(self, "policyInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="tierInput")
    def tier_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "tierInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "ResiliencehubResiliencyPolicyTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "ResiliencehubResiliencyPolicyTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="dataLocationConstraint")
    def data_location_constraint(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataLocationConstraint"))

    @data_location_constraint.setter
    def data_location_constraint(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3f67a2ba89c9d9da561c3ba7dc5a34c47dfd2994e3622dde8904a6310f4278ee)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataLocationConstraint", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40925e15a153b4a88d4813c9052a20c3206ff29876bdcd059990c688b6081b4c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37fc41d7bef7a1d42020ae6a929aa499982d046c61164525792e00670ed35673)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2abe831547c8886c3dff8dd51d733efabc179bdc79aa3e808632be69688e0d2b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tier")
    def tier(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tier"))

    @tier.setter
    def tier(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a50fad9c0e3495e0dbc8d750d8431d8be6b8afe7b8dfe43edac5492edb075cd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tier", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "name": "name",
        "tier": "tier",
        "data_location_constraint": "dataLocationConstraint",
        "description": "description",
        "policy": "policy",
        "tags": "tags",
        "timeouts": "timeouts",
    },
)
class ResiliencehubResiliencyPolicyConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        name: builtins.str,
        tier: builtins.str,
        data_location_constraint: typing.Optional[builtins.str] = None,
        description: typing.Optional[builtins.str] = None,
        policy: typing.Optional[typing.Union["ResiliencehubResiliencyPolicyPolicy", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["ResiliencehubResiliencyPolicyTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param name: The name of the policy. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#name ResiliencehubResiliencyPolicy#name}
        :param tier: The tier for the resiliency policy, ranging from the highest severity (MissionCritical) to lowest (NonCritical). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#tier ResiliencehubResiliencyPolicy#tier}
        :param data_location_constraint: Specifies a high-level geographical location constraint for where resilience policy data can be stored. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#data_location_constraint ResiliencehubResiliencyPolicy#data_location_constraint}
        :param description: The description for the policy. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#description ResiliencehubResiliencyPolicy#description}
        :param policy: policy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#policy ResiliencehubResiliencyPolicy#policy}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#tags ResiliencehubResiliencyPolicy#tags}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#timeouts ResiliencehubResiliencyPolicy#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(policy, dict):
            policy = ResiliencehubResiliencyPolicyPolicy(**policy)
        if isinstance(timeouts, dict):
            timeouts = ResiliencehubResiliencyPolicyTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc9f8c881cf9e6e185956ad08e1732ab9879d3b656619d15ffde508b72bf30ec)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument tier", value=tier, expected_type=type_hints["tier"])
            check_type(argname="argument data_location_constraint", value=data_location_constraint, expected_type=type_hints["data_location_constraint"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument policy", value=policy, expected_type=type_hints["policy"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "tier": tier,
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
        if data_location_constraint is not None:
            self._values["data_location_constraint"] = data_location_constraint
        if description is not None:
            self._values["description"] = description
        if policy is not None:
            self._values["policy"] = policy
        if tags is not None:
            self._values["tags"] = tags
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
    def name(self) -> builtins.str:
        '''The name of the policy.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#name ResiliencehubResiliencyPolicy#name}
        '''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def tier(self) -> builtins.str:
        '''The tier for the resiliency policy, ranging from the highest severity (MissionCritical) to lowest (NonCritical).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#tier ResiliencehubResiliencyPolicy#tier}
        '''
        result = self._values.get("tier")
        assert result is not None, "Required property 'tier' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def data_location_constraint(self) -> typing.Optional[builtins.str]:
        '''Specifies a high-level geographical location constraint for where resilience policy data can be stored.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#data_location_constraint ResiliencehubResiliencyPolicy#data_location_constraint}
        '''
        result = self._values.get("data_location_constraint")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''The description for the policy.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#description ResiliencehubResiliencyPolicy#description}
        '''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def policy(self) -> typing.Optional["ResiliencehubResiliencyPolicyPolicy"]:
        '''policy block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#policy ResiliencehubResiliencyPolicy#policy}
        '''
        result = self._values.get("policy")
        return typing.cast(typing.Optional["ResiliencehubResiliencyPolicyPolicy"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#tags ResiliencehubResiliencyPolicy#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["ResiliencehubResiliencyPolicyTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#timeouts ResiliencehubResiliencyPolicy#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["ResiliencehubResiliencyPolicyTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ResiliencehubResiliencyPolicyConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicy",
    jsii_struct_bases=[],
    name_mapping={
        "az": "az",
        "hardware": "hardware",
        "software_attribute": "softwareAttribute",
        "region": "region",
    },
)
class ResiliencehubResiliencyPolicyPolicy:
    def __init__(
        self,
        *,
        az: typing.Union["ResiliencehubResiliencyPolicyPolicyAz", typing.Dict[builtins.str, typing.Any]],
        hardware: typing.Union["ResiliencehubResiliencyPolicyPolicyHardware", typing.Dict[builtins.str, typing.Any]],
        software_attribute: typing.Union["ResiliencehubResiliencyPolicyPolicySoftware", typing.Dict[builtins.str, typing.Any]],
        region: typing.Optional[typing.Union["ResiliencehubResiliencyPolicyPolicyRegion", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param az: az block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#az ResiliencehubResiliencyPolicy#az}
        :param hardware: hardware block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#hardware ResiliencehubResiliencyPolicy#hardware}
        :param software_attribute: software block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#software ResiliencehubResiliencyPolicy#software}
        :param region: region block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#region ResiliencehubResiliencyPolicy#region}
        '''
        if isinstance(az, dict):
            az = ResiliencehubResiliencyPolicyPolicyAz(**az)
        if isinstance(hardware, dict):
            hardware = ResiliencehubResiliencyPolicyPolicyHardware(**hardware)
        if isinstance(software_attribute, dict):
            software_attribute = ResiliencehubResiliencyPolicyPolicySoftware(**software_attribute)
        if isinstance(region, dict):
            region = ResiliencehubResiliencyPolicyPolicyRegion(**region)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33b1975a7574f27d0d4063b2cf661b1e18129d6efb7a97ce5a613cda236b1265)
            check_type(argname="argument az", value=az, expected_type=type_hints["az"])
            check_type(argname="argument hardware", value=hardware, expected_type=type_hints["hardware"])
            check_type(argname="argument software_attribute", value=software_attribute, expected_type=type_hints["software_attribute"])
            check_type(argname="argument region", value=region, expected_type=type_hints["region"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "az": az,
            "hardware": hardware,
            "software_attribute": software_attribute,
        }
        if region is not None:
            self._values["region"] = region

    @builtins.property
    def az(self) -> "ResiliencehubResiliencyPolicyPolicyAz":
        '''az block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#az ResiliencehubResiliencyPolicy#az}
        '''
        result = self._values.get("az")
        assert result is not None, "Required property 'az' is missing"
        return typing.cast("ResiliencehubResiliencyPolicyPolicyAz", result)

    @builtins.property
    def hardware(self) -> "ResiliencehubResiliencyPolicyPolicyHardware":
        '''hardware block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#hardware ResiliencehubResiliencyPolicy#hardware}
        '''
        result = self._values.get("hardware")
        assert result is not None, "Required property 'hardware' is missing"
        return typing.cast("ResiliencehubResiliencyPolicyPolicyHardware", result)

    @builtins.property
    def software_attribute(self) -> "ResiliencehubResiliencyPolicyPolicySoftware":
        '''software block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#software ResiliencehubResiliencyPolicy#software}
        '''
        result = self._values.get("software_attribute")
        assert result is not None, "Required property 'software_attribute' is missing"
        return typing.cast("ResiliencehubResiliencyPolicyPolicySoftware", result)

    @builtins.property
    def region(self) -> typing.Optional["ResiliencehubResiliencyPolicyPolicyRegion"]:
        '''region block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#region ResiliencehubResiliencyPolicy#region}
        '''
        result = self._values.get("region")
        return typing.cast(typing.Optional["ResiliencehubResiliencyPolicyPolicyRegion"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ResiliencehubResiliencyPolicyPolicy(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicyAz",
    jsii_struct_bases=[],
    name_mapping={"rpo": "rpo", "rto": "rto"},
)
class ResiliencehubResiliencyPolicyPolicyAz:
    def __init__(self, *, rpo: builtins.str, rto: builtins.str) -> None:
        '''
        :param rpo: Recovery Point Objective (RPO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
        :param rto: Recovery Time Objective (RTO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ccdf1d1228f8dbf12fd2f5abae7587d76a59495d7bed7e21bff7e0e878d9b7f4)
            check_type(argname="argument rpo", value=rpo, expected_type=type_hints["rpo"])
            check_type(argname="argument rto", value=rto, expected_type=type_hints["rto"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "rpo": rpo,
            "rto": rto,
        }

    @builtins.property
    def rpo(self) -> builtins.str:
        '''Recovery Point Objective (RPO) as a Go duration.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
        '''
        result = self._values.get("rpo")
        assert result is not None, "Required property 'rpo' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def rto(self) -> builtins.str:
        '''Recovery Time Objective (RTO) as a Go duration.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
        '''
        result = self._values.get("rto")
        assert result is not None, "Required property 'rto' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ResiliencehubResiliencyPolicyPolicyAz(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ResiliencehubResiliencyPolicyPolicyAzOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicyAzOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0473734a211e869c386a5c44482bf8c84ef6daf094f51b2ad79593a3d3154acc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="rpoInput")
    def rpo_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "rpoInput"))

    @builtins.property
    @jsii.member(jsii_name="rtoInput")
    def rto_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "rtoInput"))

    @builtins.property
    @jsii.member(jsii_name="rpo")
    def rpo(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "rpo"))

    @rpo.setter
    def rpo(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6773b1fa02c4101a7e5a98130709aa02ccf4556f5179a6b6037ef5ce2c44cb26)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rpo", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="rto")
    def rto(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "rto"))

    @rto.setter
    def rto(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf716b53233769598825419456e3747a25ecebc9aa2d2d5159d12edbb0a73a64)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rto", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyAz]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyAz]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyAz]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c5cd18b899d66e1edab77192aba532f329eaaeac116494e6a7f3b1c74bf40fb9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicyHardware",
    jsii_struct_bases=[],
    name_mapping={"rpo": "rpo", "rto": "rto"},
)
class ResiliencehubResiliencyPolicyPolicyHardware:
    def __init__(self, *, rpo: builtins.str, rto: builtins.str) -> None:
        '''
        :param rpo: Recovery Point Objective (RPO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
        :param rto: Recovery Time Objective (RTO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__11c5a9997cd2b479d581c3ffcd5734017589cca99e026b156a93b893d1c66292)
            check_type(argname="argument rpo", value=rpo, expected_type=type_hints["rpo"])
            check_type(argname="argument rto", value=rto, expected_type=type_hints["rto"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "rpo": rpo,
            "rto": rto,
        }

    @builtins.property
    def rpo(self) -> builtins.str:
        '''Recovery Point Objective (RPO) as a Go duration.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
        '''
        result = self._values.get("rpo")
        assert result is not None, "Required property 'rpo' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def rto(self) -> builtins.str:
        '''Recovery Time Objective (RTO) as a Go duration.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
        '''
        result = self._values.get("rto")
        assert result is not None, "Required property 'rto' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ResiliencehubResiliencyPolicyPolicyHardware(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ResiliencehubResiliencyPolicyPolicyHardwareOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicyHardwareOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__05d88a6a4cf1fc34315028450e1c735ca68b7d5d0c1c1ed905fbb71000d1a9aa)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="rpoInput")
    def rpo_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "rpoInput"))

    @builtins.property
    @jsii.member(jsii_name="rtoInput")
    def rto_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "rtoInput"))

    @builtins.property
    @jsii.member(jsii_name="rpo")
    def rpo(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "rpo"))

    @rpo.setter
    def rpo(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3f17b676971369d6143ba03f640e38c2e24e956be24da18024fb947eef3d07a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rpo", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="rto")
    def rto(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "rto"))

    @rto.setter
    def rto(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59432a4f2f322740c12aa87e33ef7f15081b258597256b80f5917953c6da0f80)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rto", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyHardware]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyHardware]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyHardware]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1de6f2f9c5c97e23b2d3be8cde72d62fc31bb337314f9d308f623c4a0fe36247)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class ResiliencehubResiliencyPolicyPolicyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c6adbd5fbdc5628f9ef8181092c485289127f6d8a4331bcf955b1b30cb9ef175)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAz")
    def put_az(self, *, rpo: builtins.str, rto: builtins.str) -> None:
        '''
        :param rpo: Recovery Point Objective (RPO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
        :param rto: Recovery Time Objective (RTO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
        '''
        value = ResiliencehubResiliencyPolicyPolicyAz(rpo=rpo, rto=rto)

        return typing.cast(None, jsii.invoke(self, "putAz", [value]))

    @jsii.member(jsii_name="putHardware")
    def put_hardware(self, *, rpo: builtins.str, rto: builtins.str) -> None:
        '''
        :param rpo: Recovery Point Objective (RPO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
        :param rto: Recovery Time Objective (RTO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
        '''
        value = ResiliencehubResiliencyPolicyPolicyHardware(rpo=rpo, rto=rto)

        return typing.cast(None, jsii.invoke(self, "putHardware", [value]))

    @jsii.member(jsii_name="putRegion")
    def put_region(
        self,
        *,
        rpo: typing.Optional[builtins.str] = None,
        rto: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param rpo: Recovery Point Objective (RPO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
        :param rto: Recovery Time Objective (RTO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
        '''
        value = ResiliencehubResiliencyPolicyPolicyRegion(rpo=rpo, rto=rto)

        return typing.cast(None, jsii.invoke(self, "putRegion", [value]))

    @jsii.member(jsii_name="putSoftwareAttribute")
    def put_software_attribute(self, *, rpo: builtins.str, rto: builtins.str) -> None:
        '''
        :param rpo: Recovery Point Objective (RPO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
        :param rto: Recovery Time Objective (RTO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
        '''
        value = ResiliencehubResiliencyPolicyPolicySoftware(rpo=rpo, rto=rto)

        return typing.cast(None, jsii.invoke(self, "putSoftwareAttribute", [value]))

    @jsii.member(jsii_name="resetRegion")
    def reset_region(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegion", []))

    @builtins.property
    @jsii.member(jsii_name="az")
    def az(self) -> ResiliencehubResiliencyPolicyPolicyAzOutputReference:
        return typing.cast(ResiliencehubResiliencyPolicyPolicyAzOutputReference, jsii.get(self, "az"))

    @builtins.property
    @jsii.member(jsii_name="hardware")
    def hardware(self) -> ResiliencehubResiliencyPolicyPolicyHardwareOutputReference:
        return typing.cast(ResiliencehubResiliencyPolicyPolicyHardwareOutputReference, jsii.get(self, "hardware"))

    @builtins.property
    @jsii.member(jsii_name="region")
    def region(self) -> "ResiliencehubResiliencyPolicyPolicyRegionOutputReference":
        return typing.cast("ResiliencehubResiliencyPolicyPolicyRegionOutputReference", jsii.get(self, "region"))

    @builtins.property
    @jsii.member(jsii_name="softwareAttribute")
    def software_attribute(
        self,
    ) -> "ResiliencehubResiliencyPolicyPolicySoftwareOutputReference":
        return typing.cast("ResiliencehubResiliencyPolicyPolicySoftwareOutputReference", jsii.get(self, "softwareAttribute"))

    @builtins.property
    @jsii.member(jsii_name="azInput")
    def az_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyAz]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyAz]], jsii.get(self, "azInput"))

    @builtins.property
    @jsii.member(jsii_name="hardwareInput")
    def hardware_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyHardware]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyHardware]], jsii.get(self, "hardwareInput"))

    @builtins.property
    @jsii.member(jsii_name="regionInput")
    def region_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "ResiliencehubResiliencyPolicyPolicyRegion"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "ResiliencehubResiliencyPolicyPolicyRegion"]], jsii.get(self, "regionInput"))

    @builtins.property
    @jsii.member(jsii_name="softwareAttributeInput")
    def software_attribute_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "ResiliencehubResiliencyPolicyPolicySoftware"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "ResiliencehubResiliencyPolicyPolicySoftware"]], jsii.get(self, "softwareAttributeInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicy]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicy]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicy]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f2a54e287dee9d2d01b172a4fa422ba4e35a10bec0ce644094eaf91c81adfb34)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicyRegion",
    jsii_struct_bases=[],
    name_mapping={"rpo": "rpo", "rto": "rto"},
)
class ResiliencehubResiliencyPolicyPolicyRegion:
    def __init__(
        self,
        *,
        rpo: typing.Optional[builtins.str] = None,
        rto: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param rpo: Recovery Point Objective (RPO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
        :param rto: Recovery Time Objective (RTO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__313f2ffe5ee9c9924225f1decef4147d89c267bbd49da890f11351db8477dba8)
            check_type(argname="argument rpo", value=rpo, expected_type=type_hints["rpo"])
            check_type(argname="argument rto", value=rto, expected_type=type_hints["rto"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if rpo is not None:
            self._values["rpo"] = rpo
        if rto is not None:
            self._values["rto"] = rto

    @builtins.property
    def rpo(self) -> typing.Optional[builtins.str]:
        '''Recovery Point Objective (RPO) as a Go duration.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
        '''
        result = self._values.get("rpo")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def rto(self) -> typing.Optional[builtins.str]:
        '''Recovery Time Objective (RTO) as a Go duration.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
        '''
        result = self._values.get("rto")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ResiliencehubResiliencyPolicyPolicyRegion(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ResiliencehubResiliencyPolicyPolicyRegionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicyRegionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5e2f3762e8e03034d01071cf1a7139e44961986279261df279cb2072e3576365)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetRpo")
    def reset_rpo(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRpo", []))

    @jsii.member(jsii_name="resetRto")
    def reset_rto(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRto", []))

    @builtins.property
    @jsii.member(jsii_name="rpoInput")
    def rpo_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "rpoInput"))

    @builtins.property
    @jsii.member(jsii_name="rtoInput")
    def rto_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "rtoInput"))

    @builtins.property
    @jsii.member(jsii_name="rpo")
    def rpo(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "rpo"))

    @rpo.setter
    def rpo(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__80cfa1a3185d6224b96e79df70d7dc6b805dbe7a62094a5091a73604bd05839c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rpo", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="rto")
    def rto(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "rto"))

    @rto.setter
    def rto(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8040868f356d110f0874b4421f98253ee922f62f9532c5deeb7672a2af5ba7b7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rto", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyRegion]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyRegion]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyRegion]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c2882c08fbf5cc19643e01647e8a955b2e1a243a81dfa5c2b8a9ad78a66cd0e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicySoftware",
    jsii_struct_bases=[],
    name_mapping={"rpo": "rpo", "rto": "rto"},
)
class ResiliencehubResiliencyPolicyPolicySoftware:
    def __init__(self, *, rpo: builtins.str, rto: builtins.str) -> None:
        '''
        :param rpo: Recovery Point Objective (RPO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
        :param rto: Recovery Time Objective (RTO) as a Go duration. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca6061bb2814367033b45b314151e8d2c48548e58aeee941d908c0d2204512ff)
            check_type(argname="argument rpo", value=rpo, expected_type=type_hints["rpo"])
            check_type(argname="argument rto", value=rto, expected_type=type_hints["rto"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "rpo": rpo,
            "rto": rto,
        }

    @builtins.property
    def rpo(self) -> builtins.str:
        '''Recovery Point Objective (RPO) as a Go duration.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rpo ResiliencehubResiliencyPolicy#rpo}
        '''
        result = self._values.get("rpo")
        assert result is not None, "Required property 'rpo' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def rto(self) -> builtins.str:
        '''Recovery Time Objective (RTO) as a Go duration.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#rto ResiliencehubResiliencyPolicy#rto}
        '''
        result = self._values.get("rto")
        assert result is not None, "Required property 'rto' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ResiliencehubResiliencyPolicyPolicySoftware(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ResiliencehubResiliencyPolicyPolicySoftwareOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicySoftwareOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1e8ed61275854c9d53d87eaaedcad0653e85dd02df1dc4d07ead9ed85558776a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="rpoInput")
    def rpo_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "rpoInput"))

    @builtins.property
    @jsii.member(jsii_name="rtoInput")
    def rto_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "rtoInput"))

    @builtins.property
    @jsii.member(jsii_name="rpo")
    def rpo(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "rpo"))

    @rpo.setter
    def rpo(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__917d41578534677e7a7fc2defb2557f824c637a48c660809a819836a9dcdc125)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rpo", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="rto")
    def rto(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "rto"))

    @rto.setter
    def rto(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f09359267e6e4e87a6b130f6c558f0002585f3051a5e87f1787c98380a1bb88c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rto", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicySoftware]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicySoftware]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicySoftware]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__071c3624108bbafb742967bc7deece6fff0b988a0d218554289912d0e2c1bd3b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class ResiliencehubResiliencyPolicyTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#create ResiliencehubResiliencyPolicy#create}
        :param delete: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#delete ResiliencehubResiliencyPolicy#delete}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#update ResiliencehubResiliencyPolicy#update}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eaacc3ec14ced52b77f8aba2655df32a19313c9862e49c73735858bbb2971e39)
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

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#create ResiliencehubResiliencyPolicy#create}
        '''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#delete ResiliencehubResiliencyPolicy#delete}
        '''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#update ResiliencehubResiliencyPolicy#update}
        '''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ResiliencehubResiliencyPolicyTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ResiliencehubResiliencyPolicyTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6de25a9f9a384dca0103468e08c23433947a9cb7c0e172f0570efb18ea9bb93b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__41204d3afe5f97ff970b56e4e832604ba6b8c43d8d1bb06e4b241db16aefadf6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__603652f74d2f2ed4baef55ccf114da041b932ca0a33793c4c8ccad0a02f0f107)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2c508cdd7d70970b596f203d894f74794b2b14c80d6a2ece9c34ec42a465d08)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__021d3b39178d7a54acd023462d01cbeb422e8f1ec6d7a6c3400b218705998610)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "ResiliencehubResiliencyPolicy",
    "ResiliencehubResiliencyPolicyConfig",
    "ResiliencehubResiliencyPolicyPolicy",
    "ResiliencehubResiliencyPolicyPolicyAz",
    "ResiliencehubResiliencyPolicyPolicyAzOutputReference",
    "ResiliencehubResiliencyPolicyPolicyHardware",
    "ResiliencehubResiliencyPolicyPolicyHardwareOutputReference",
    "ResiliencehubResiliencyPolicyPolicyOutputReference",
    "ResiliencehubResiliencyPolicyPolicyRegion",
    "ResiliencehubResiliencyPolicyPolicyRegionOutputReference",
    "ResiliencehubResiliencyPolicyPolicySoftware",
    "ResiliencehubResiliencyPolicyPolicySoftwareOutputReference",
    "ResiliencehubResiliencyPolicyTimeouts",
    "ResiliencehubResiliencyPolicyTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__a7475792e6e4a1fb1eb697db5fe41f01eb171e5c8d3ccafa11480ee7beff661a(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    name: builtins.str,
    tier: builtins.str,
    data_location_constraint: typing.Optional[builtins.str] = None,
    description: typing.Optional[builtins.str] = None,
    policy: typing.Optional[typing.Union[ResiliencehubResiliencyPolicyPolicy, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[ResiliencehubResiliencyPolicyTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__dfaad131f54d077bbfde60cc137ef23232087e41fcfa4be38187371de308975e(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f67a2ba89c9d9da561c3ba7dc5a34c47dfd2994e3622dde8904a6310f4278ee(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40925e15a153b4a88d4813c9052a20c3206ff29876bdcd059990c688b6081b4c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37fc41d7bef7a1d42020ae6a929aa499982d046c61164525792e00670ed35673(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2abe831547c8886c3dff8dd51d733efabc179bdc79aa3e808632be69688e0d2b(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a50fad9c0e3495e0dbc8d750d8431d8be6b8afe7b8dfe43edac5492edb075cd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc9f8c881cf9e6e185956ad08e1732ab9879d3b656619d15ffde508b72bf30ec(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    name: builtins.str,
    tier: builtins.str,
    data_location_constraint: typing.Optional[builtins.str] = None,
    description: typing.Optional[builtins.str] = None,
    policy: typing.Optional[typing.Union[ResiliencehubResiliencyPolicyPolicy, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[ResiliencehubResiliencyPolicyTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33b1975a7574f27d0d4063b2cf661b1e18129d6efb7a97ce5a613cda236b1265(
    *,
    az: typing.Union[ResiliencehubResiliencyPolicyPolicyAz, typing.Dict[builtins.str, typing.Any]],
    hardware: typing.Union[ResiliencehubResiliencyPolicyPolicyHardware, typing.Dict[builtins.str, typing.Any]],
    software_attribute: typing.Union[ResiliencehubResiliencyPolicyPolicySoftware, typing.Dict[builtins.str, typing.Any]],
    region: typing.Optional[typing.Union[ResiliencehubResiliencyPolicyPolicyRegion, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ccdf1d1228f8dbf12fd2f5abae7587d76a59495d7bed7e21bff7e0e878d9b7f4(
    *,
    rpo: builtins.str,
    rto: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0473734a211e869c386a5c44482bf8c84ef6daf094f51b2ad79593a3d3154acc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6773b1fa02c4101a7e5a98130709aa02ccf4556f5179a6b6037ef5ce2c44cb26(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf716b53233769598825419456e3747a25ecebc9aa2d2d5159d12edbb0a73a64(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c5cd18b899d66e1edab77192aba532f329eaaeac116494e6a7f3b1c74bf40fb9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyAz]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__11c5a9997cd2b479d581c3ffcd5734017589cca99e026b156a93b893d1c66292(
    *,
    rpo: builtins.str,
    rto: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05d88a6a4cf1fc34315028450e1c735ca68b7d5d0c1c1ed905fbb71000d1a9aa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3f17b676971369d6143ba03f640e38c2e24e956be24da18024fb947eef3d07a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59432a4f2f322740c12aa87e33ef7f15081b258597256b80f5917953c6da0f80(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1de6f2f9c5c97e23b2d3be8cde72d62fc31bb337314f9d308f623c4a0fe36247(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyHardware]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6adbd5fbdc5628f9ef8181092c485289127f6d8a4331bcf955b1b30cb9ef175(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f2a54e287dee9d2d01b172a4fa422ba4e35a10bec0ce644094eaf91c81adfb34(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicy]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__313f2ffe5ee9c9924225f1decef4147d89c267bbd49da890f11351db8477dba8(
    *,
    rpo: typing.Optional[builtins.str] = None,
    rto: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e2f3762e8e03034d01071cf1a7139e44961986279261df279cb2072e3576365(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__80cfa1a3185d6224b96e79df70d7dc6b805dbe7a62094a5091a73604bd05839c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8040868f356d110f0874b4421f98253ee922f62f9532c5deeb7672a2af5ba7b7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c2882c08fbf5cc19643e01647e8a955b2e1a243a81dfa5c2b8a9ad78a66cd0e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicyRegion]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca6061bb2814367033b45b314151e8d2c48548e58aeee941d908c0d2204512ff(
    *,
    rpo: builtins.str,
    rto: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e8ed61275854c9d53d87eaaedcad0653e85dd02df1dc4d07ead9ed85558776a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__917d41578534677e7a7fc2defb2557f824c637a48c660809a819836a9dcdc125(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f09359267e6e4e87a6b130f6c558f0002585f3051a5e87f1787c98380a1bb88c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__071c3624108bbafb742967bc7deece6fff0b988a0d218554289912d0e2c1bd3b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyPolicySoftware]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eaacc3ec14ced52b77f8aba2655df32a19313c9862e49c73735858bbb2971e39(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6de25a9f9a384dca0103468e08c23433947a9cb7c0e172f0570efb18ea9bb93b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41204d3afe5f97ff970b56e4e832604ba6b8c43d8d1bb06e4b241db16aefadf6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__603652f74d2f2ed4baef55ccf114da041b932ca0a33793c4c8ccad0a02f0f107(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2c508cdd7d70970b596f203d894f74794b2b14c80d6a2ece9c34ec42a465d08(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__021d3b39178d7a54acd023462d01cbeb422e8f1ec6d7a6c3400b218705998610(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ResiliencehubResiliencyPolicyTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
