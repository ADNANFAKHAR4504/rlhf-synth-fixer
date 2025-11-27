r'''
# `aws_ec2_fleet`

Refer to the Terraform Registry for docs: [`aws_ec2_fleet`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet).
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


class Ec2Fleet(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2Fleet",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet aws_ec2_fleet}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        launch_template_config: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Ec2FleetLaunchTemplateConfig", typing.Dict[builtins.str, typing.Any]]]],
        target_capacity_specification: typing.Union["Ec2FleetTargetCapacitySpecification", typing.Dict[builtins.str, typing.Any]],
        context: typing.Optional[builtins.str] = None,
        excess_capacity_termination_policy: typing.Optional[builtins.str] = None,
        fleet_instance_set: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Ec2FleetFleetInstanceSet", typing.Dict[builtins.str, typing.Any]]]]] = None,
        fleet_state: typing.Optional[builtins.str] = None,
        fulfilled_capacity: typing.Optional[jsii.Number] = None,
        fulfilled_on_demand_capacity: typing.Optional[jsii.Number] = None,
        id: typing.Optional[builtins.str] = None,
        on_demand_options: typing.Optional[typing.Union["Ec2FleetOnDemandOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        replace_unhealthy_instances: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        spot_options: typing.Optional[typing.Union["Ec2FleetSpotOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        terminate_instances: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        terminate_instances_with_expiration: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        timeouts: typing.Optional[typing.Union["Ec2FleetTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        type: typing.Optional[builtins.str] = None,
        valid_from: typing.Optional[builtins.str] = None,
        valid_until: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet aws_ec2_fleet} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param launch_template_config: launch_template_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_config Ec2Fleet#launch_template_config}
        :param target_capacity_specification: target_capacity_specification block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#target_capacity_specification Ec2Fleet#target_capacity_specification}
        :param context: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#context Ec2Fleet#context}.
        :param excess_capacity_termination_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#excess_capacity_termination_policy Ec2Fleet#excess_capacity_termination_policy}.
        :param fleet_instance_set: fleet_instance_set block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_instance_set Ec2Fleet#fleet_instance_set}
        :param fleet_state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_state Ec2Fleet#fleet_state}.
        :param fulfilled_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_capacity Ec2Fleet#fulfilled_capacity}.
        :param fulfilled_on_demand_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_on_demand_capacity Ec2Fleet#fulfilled_on_demand_capacity}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#id Ec2Fleet#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param on_demand_options: on_demand_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_options Ec2Fleet#on_demand_options}
        :param replace_unhealthy_instances: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replace_unhealthy_instances Ec2Fleet#replace_unhealthy_instances}.
        :param spot_options: spot_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_options Ec2Fleet#spot_options}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags Ec2Fleet#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags_all Ec2Fleet#tags_all}.
        :param terminate_instances: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances Ec2Fleet#terminate_instances}.
        :param terminate_instances_with_expiration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances_with_expiration Ec2Fleet#terminate_instances_with_expiration}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#timeouts Ec2Fleet#timeouts}
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#type Ec2Fleet#type}.
        :param valid_from: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_from Ec2Fleet#valid_from}.
        :param valid_until: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_until Ec2Fleet#valid_until}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2db791429c86a7a865023f626557171e60f47a281fdbb6f2307052a15251f6a3)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = Ec2FleetConfig(
            launch_template_config=launch_template_config,
            target_capacity_specification=target_capacity_specification,
            context=context,
            excess_capacity_termination_policy=excess_capacity_termination_policy,
            fleet_instance_set=fleet_instance_set,
            fleet_state=fleet_state,
            fulfilled_capacity=fulfilled_capacity,
            fulfilled_on_demand_capacity=fulfilled_on_demand_capacity,
            id=id,
            on_demand_options=on_demand_options,
            replace_unhealthy_instances=replace_unhealthy_instances,
            spot_options=spot_options,
            tags=tags,
            tags_all=tags_all,
            terminate_instances=terminate_instances,
            terminate_instances_with_expiration=terminate_instances_with_expiration,
            timeouts=timeouts,
            type=type,
            valid_from=valid_from,
            valid_until=valid_until,
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
        '''Generates CDKTF code for importing a Ec2Fleet resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Ec2Fleet to import.
        :param import_from_id: The id of the existing Ec2Fleet that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Ec2Fleet to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81dacc73f8ef57d12d0a75fc4beecb568fe60b7486282aecb722ddd6b59ce2dc)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putFleetInstanceSet")
    def put_fleet_instance_set(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Ec2FleetFleetInstanceSet", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6c6ac616d860afe051a0d084ca422e5e6a5079925329f172b8afd6aa858e2b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFleetInstanceSet", [value]))

    @jsii.member(jsii_name="putLaunchTemplateConfig")
    def put_launch_template_config(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Ec2FleetLaunchTemplateConfig", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3333e7f55bb95d2ef1efbaa8eed0a60ead0feecbdaad57e0f15775dbc662f71a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putLaunchTemplateConfig", [value]))

    @jsii.member(jsii_name="putOnDemandOptions")
    def put_on_demand_options(
        self,
        *,
        allocation_strategy: typing.Optional[builtins.str] = None,
        capacity_reservation_options: typing.Optional[typing.Union["Ec2FleetOnDemandOptionsCapacityReservationOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        max_total_price: typing.Optional[builtins.str] = None,
        min_target_capacity: typing.Optional[jsii.Number] = None,
        single_availability_zone: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        single_instance_type: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param allocation_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allocation_strategy Ec2Fleet#allocation_strategy}.
        :param capacity_reservation_options: capacity_reservation_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#capacity_reservation_options Ec2Fleet#capacity_reservation_options}
        :param max_total_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_total_price Ec2Fleet#max_total_price}.
        :param min_target_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min_target_capacity Ec2Fleet#min_target_capacity}.
        :param single_availability_zone: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_availability_zone Ec2Fleet#single_availability_zone}.
        :param single_instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_instance_type Ec2Fleet#single_instance_type}.
        '''
        value = Ec2FleetOnDemandOptions(
            allocation_strategy=allocation_strategy,
            capacity_reservation_options=capacity_reservation_options,
            max_total_price=max_total_price,
            min_target_capacity=min_target_capacity,
            single_availability_zone=single_availability_zone,
            single_instance_type=single_instance_type,
        )

        return typing.cast(None, jsii.invoke(self, "putOnDemandOptions", [value]))

    @jsii.member(jsii_name="putSpotOptions")
    def put_spot_options(
        self,
        *,
        allocation_strategy: typing.Optional[builtins.str] = None,
        instance_interruption_behavior: typing.Optional[builtins.str] = None,
        instance_pools_to_use_count: typing.Optional[jsii.Number] = None,
        maintenance_strategies: typing.Optional[typing.Union["Ec2FleetSpotOptionsMaintenanceStrategies", typing.Dict[builtins.str, typing.Any]]] = None,
        max_total_price: typing.Optional[builtins.str] = None,
        min_target_capacity: typing.Optional[jsii.Number] = None,
        single_availability_zone: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        single_instance_type: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param allocation_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allocation_strategy Ec2Fleet#allocation_strategy}.
        :param instance_interruption_behavior: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_interruption_behavior Ec2Fleet#instance_interruption_behavior}.
        :param instance_pools_to_use_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_pools_to_use_count Ec2Fleet#instance_pools_to_use_count}.
        :param maintenance_strategies: maintenance_strategies block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#maintenance_strategies Ec2Fleet#maintenance_strategies}
        :param max_total_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_total_price Ec2Fleet#max_total_price}.
        :param min_target_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min_target_capacity Ec2Fleet#min_target_capacity}.
        :param single_availability_zone: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_availability_zone Ec2Fleet#single_availability_zone}.
        :param single_instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_instance_type Ec2Fleet#single_instance_type}.
        '''
        value = Ec2FleetSpotOptions(
            allocation_strategy=allocation_strategy,
            instance_interruption_behavior=instance_interruption_behavior,
            instance_pools_to_use_count=instance_pools_to_use_count,
            maintenance_strategies=maintenance_strategies,
            max_total_price=max_total_price,
            min_target_capacity=min_target_capacity,
            single_availability_zone=single_availability_zone,
            single_instance_type=single_instance_type,
        )

        return typing.cast(None, jsii.invoke(self, "putSpotOptions", [value]))

    @jsii.member(jsii_name="putTargetCapacitySpecification")
    def put_target_capacity_specification(
        self,
        *,
        default_target_capacity_type: builtins.str,
        total_target_capacity: jsii.Number,
        on_demand_target_capacity: typing.Optional[jsii.Number] = None,
        spot_target_capacity: typing.Optional[jsii.Number] = None,
        target_capacity_unit_type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param default_target_capacity_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#default_target_capacity_type Ec2Fleet#default_target_capacity_type}.
        :param total_target_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#total_target_capacity Ec2Fleet#total_target_capacity}.
        :param on_demand_target_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_target_capacity Ec2Fleet#on_demand_target_capacity}.
        :param spot_target_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_target_capacity Ec2Fleet#spot_target_capacity}.
        :param target_capacity_unit_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#target_capacity_unit_type Ec2Fleet#target_capacity_unit_type}.
        '''
        value = Ec2FleetTargetCapacitySpecification(
            default_target_capacity_type=default_target_capacity_type,
            total_target_capacity=total_target_capacity,
            on_demand_target_capacity=on_demand_target_capacity,
            spot_target_capacity=spot_target_capacity,
            target_capacity_unit_type=target_capacity_unit_type,
        )

        return typing.cast(None, jsii.invoke(self, "putTargetCapacitySpecification", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#create Ec2Fleet#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#delete Ec2Fleet#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#update Ec2Fleet#update}.
        '''
        value = Ec2FleetTimeouts(create=create, delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetContext")
    def reset_context(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContext", []))

    @jsii.member(jsii_name="resetExcessCapacityTerminationPolicy")
    def reset_excess_capacity_termination_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExcessCapacityTerminationPolicy", []))

    @jsii.member(jsii_name="resetFleetInstanceSet")
    def reset_fleet_instance_set(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFleetInstanceSet", []))

    @jsii.member(jsii_name="resetFleetState")
    def reset_fleet_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFleetState", []))

    @jsii.member(jsii_name="resetFulfilledCapacity")
    def reset_fulfilled_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFulfilledCapacity", []))

    @jsii.member(jsii_name="resetFulfilledOnDemandCapacity")
    def reset_fulfilled_on_demand_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFulfilledOnDemandCapacity", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetOnDemandOptions")
    def reset_on_demand_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnDemandOptions", []))

    @jsii.member(jsii_name="resetReplaceUnhealthyInstances")
    def reset_replace_unhealthy_instances(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReplaceUnhealthyInstances", []))

    @jsii.member(jsii_name="resetSpotOptions")
    def reset_spot_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSpotOptions", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTerminateInstances")
    def reset_terminate_instances(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTerminateInstances", []))

    @jsii.member(jsii_name="resetTerminateInstancesWithExpiration")
    def reset_terminate_instances_with_expiration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTerminateInstancesWithExpiration", []))

    @jsii.member(jsii_name="resetTimeouts")
    def reset_timeouts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeouts", []))

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @jsii.member(jsii_name="resetValidFrom")
    def reset_valid_from(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValidFrom", []))

    @jsii.member(jsii_name="resetValidUntil")
    def reset_valid_until(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValidUntil", []))

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
    @jsii.member(jsii_name="fleetInstanceSet")
    def fleet_instance_set(self) -> "Ec2FleetFleetInstanceSetList":
        return typing.cast("Ec2FleetFleetInstanceSetList", jsii.get(self, "fleetInstanceSet"))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateConfig")
    def launch_template_config(self) -> "Ec2FleetLaunchTemplateConfigList":
        return typing.cast("Ec2FleetLaunchTemplateConfigList", jsii.get(self, "launchTemplateConfig"))

    @builtins.property
    @jsii.member(jsii_name="onDemandOptions")
    def on_demand_options(self) -> "Ec2FleetOnDemandOptionsOutputReference":
        return typing.cast("Ec2FleetOnDemandOptionsOutputReference", jsii.get(self, "onDemandOptions"))

    @builtins.property
    @jsii.member(jsii_name="spotOptions")
    def spot_options(self) -> "Ec2FleetSpotOptionsOutputReference":
        return typing.cast("Ec2FleetSpotOptionsOutputReference", jsii.get(self, "spotOptions"))

    @builtins.property
    @jsii.member(jsii_name="targetCapacitySpecification")
    def target_capacity_specification(
        self,
    ) -> "Ec2FleetTargetCapacitySpecificationOutputReference":
        return typing.cast("Ec2FleetTargetCapacitySpecificationOutputReference", jsii.get(self, "targetCapacitySpecification"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "Ec2FleetTimeoutsOutputReference":
        return typing.cast("Ec2FleetTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="contextInput")
    def context_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contextInput"))

    @builtins.property
    @jsii.member(jsii_name="excessCapacityTerminationPolicyInput")
    def excess_capacity_termination_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "excessCapacityTerminationPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="fleetInstanceSetInput")
    def fleet_instance_set_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Ec2FleetFleetInstanceSet"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Ec2FleetFleetInstanceSet"]]], jsii.get(self, "fleetInstanceSetInput"))

    @builtins.property
    @jsii.member(jsii_name="fleetStateInput")
    def fleet_state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "fleetStateInput"))

    @builtins.property
    @jsii.member(jsii_name="fulfilledCapacityInput")
    def fulfilled_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "fulfilledCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="fulfilledOnDemandCapacityInput")
    def fulfilled_on_demand_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "fulfilledOnDemandCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateConfigInput")
    def launch_template_config_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Ec2FleetLaunchTemplateConfig"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Ec2FleetLaunchTemplateConfig"]]], jsii.get(self, "launchTemplateConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="onDemandOptionsInput")
    def on_demand_options_input(self) -> typing.Optional["Ec2FleetOnDemandOptions"]:
        return typing.cast(typing.Optional["Ec2FleetOnDemandOptions"], jsii.get(self, "onDemandOptionsInput"))

    @builtins.property
    @jsii.member(jsii_name="replaceUnhealthyInstancesInput")
    def replace_unhealthy_instances_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "replaceUnhealthyInstancesInput"))

    @builtins.property
    @jsii.member(jsii_name="spotOptionsInput")
    def spot_options_input(self) -> typing.Optional["Ec2FleetSpotOptions"]:
        return typing.cast(typing.Optional["Ec2FleetSpotOptions"], jsii.get(self, "spotOptionsInput"))

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
    @jsii.member(jsii_name="targetCapacitySpecificationInput")
    def target_capacity_specification_input(
        self,
    ) -> typing.Optional["Ec2FleetTargetCapacitySpecification"]:
        return typing.cast(typing.Optional["Ec2FleetTargetCapacitySpecification"], jsii.get(self, "targetCapacitySpecificationInput"))

    @builtins.property
    @jsii.member(jsii_name="terminateInstancesInput")
    def terminate_instances_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "terminateInstancesInput"))

    @builtins.property
    @jsii.member(jsii_name="terminateInstancesWithExpirationInput")
    def terminate_instances_with_expiration_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "terminateInstancesWithExpirationInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "Ec2FleetTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "Ec2FleetTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="validFromInput")
    def valid_from_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "validFromInput"))

    @builtins.property
    @jsii.member(jsii_name="validUntilInput")
    def valid_until_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "validUntilInput"))

    @builtins.property
    @jsii.member(jsii_name="context")
    def context(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "context"))

    @context.setter
    def context(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d71df3ac9a0921a498d577fd12046c76b04900a500a29fa9538ea615e721764e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "context", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="excessCapacityTerminationPolicy")
    def excess_capacity_termination_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "excessCapacityTerminationPolicy"))

    @excess_capacity_termination_policy.setter
    def excess_capacity_termination_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8086d51d7f50cb92986ec23b1765c8756f6244bcee73050de6b3ea6811c6a9bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "excessCapacityTerminationPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="fleetState")
    def fleet_state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fleetState"))

    @fleet_state.setter
    def fleet_state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b3377d101ac8d80d8b5420323624f6dbb42dcc2b5f24667cac8fdbff009b413)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fleetState", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="fulfilledCapacity")
    def fulfilled_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "fulfilledCapacity"))

    @fulfilled_capacity.setter
    def fulfilled_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c98c26159d54395f3f32201810bc77115caa6d4897aa8dbf4ec84f7b816c9802)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fulfilledCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="fulfilledOnDemandCapacity")
    def fulfilled_on_demand_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "fulfilledOnDemandCapacity"))

    @fulfilled_on_demand_capacity.setter
    def fulfilled_on_demand_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__acb45ab0e0182bab9eefea35aa770e33929b133fdc110a6811a68d2bed137177)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fulfilledOnDemandCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a64cb2bd89416794cefedb9ac1c6f447582dddd099202c8c68244a6481f0985e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="replaceUnhealthyInstances")
    def replace_unhealthy_instances(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "replaceUnhealthyInstances"))

    @replace_unhealthy_instances.setter
    def replace_unhealthy_instances(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18988ddae3d4b292d0368c10b7f63a7aa7a33eeb2730f364710e06f53e074a1a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "replaceUnhealthyInstances", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5b2139240b76ab6c4a2128a2434701a474810c865ebbcdb161192464b5e209c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6dc313e1fc7c2fddd904e6dfe074f9bb39e78dbdf1ca5e3d48ad9edf61b732d7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="terminateInstances")
    def terminate_instances(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "terminateInstances"))

    @terminate_instances.setter
    def terminate_instances(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d51318d5042c7b52bc95e3b039cd368b38045510353201c18a6a4e833b875a0a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terminateInstances", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="terminateInstancesWithExpiration")
    def terminate_instances_with_expiration(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "terminateInstancesWithExpiration"))

    @terminate_instances_with_expiration.setter
    def terminate_instances_with_expiration(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__953b12f7a615293fb130e0136d921713b93c7b039a0b084ef6673a2859950333)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terminateInstancesWithExpiration", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8986311b04c5473211e67d7a353d50c26d5204bbfd6247fd2fa7532ac18ed78e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="validFrom")
    def valid_from(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "validFrom"))

    @valid_from.setter
    def valid_from(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75232ed3195a672ddd6e28424ee5dead25b6890578f8d04a8062d674ea0e09b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "validFrom", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="validUntil")
    def valid_until(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "validUntil"))

    @valid_until.setter
    def valid_until(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__648a3091676c8260921d6e78b81343f2e1999419b25a41a50c27319b77eec96e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "validUntil", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "launch_template_config": "launchTemplateConfig",
        "target_capacity_specification": "targetCapacitySpecification",
        "context": "context",
        "excess_capacity_termination_policy": "excessCapacityTerminationPolicy",
        "fleet_instance_set": "fleetInstanceSet",
        "fleet_state": "fleetState",
        "fulfilled_capacity": "fulfilledCapacity",
        "fulfilled_on_demand_capacity": "fulfilledOnDemandCapacity",
        "id": "id",
        "on_demand_options": "onDemandOptions",
        "replace_unhealthy_instances": "replaceUnhealthyInstances",
        "spot_options": "spotOptions",
        "tags": "tags",
        "tags_all": "tagsAll",
        "terminate_instances": "terminateInstances",
        "terminate_instances_with_expiration": "terminateInstancesWithExpiration",
        "timeouts": "timeouts",
        "type": "type",
        "valid_from": "validFrom",
        "valid_until": "validUntil",
    },
)
class Ec2FleetConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        launch_template_config: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Ec2FleetLaunchTemplateConfig", typing.Dict[builtins.str, typing.Any]]]],
        target_capacity_specification: typing.Union["Ec2FleetTargetCapacitySpecification", typing.Dict[builtins.str, typing.Any]],
        context: typing.Optional[builtins.str] = None,
        excess_capacity_termination_policy: typing.Optional[builtins.str] = None,
        fleet_instance_set: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Ec2FleetFleetInstanceSet", typing.Dict[builtins.str, typing.Any]]]]] = None,
        fleet_state: typing.Optional[builtins.str] = None,
        fulfilled_capacity: typing.Optional[jsii.Number] = None,
        fulfilled_on_demand_capacity: typing.Optional[jsii.Number] = None,
        id: typing.Optional[builtins.str] = None,
        on_demand_options: typing.Optional[typing.Union["Ec2FleetOnDemandOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        replace_unhealthy_instances: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        spot_options: typing.Optional[typing.Union["Ec2FleetSpotOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        terminate_instances: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        terminate_instances_with_expiration: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        timeouts: typing.Optional[typing.Union["Ec2FleetTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        type: typing.Optional[builtins.str] = None,
        valid_from: typing.Optional[builtins.str] = None,
        valid_until: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param launch_template_config: launch_template_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_config Ec2Fleet#launch_template_config}
        :param target_capacity_specification: target_capacity_specification block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#target_capacity_specification Ec2Fleet#target_capacity_specification}
        :param context: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#context Ec2Fleet#context}.
        :param excess_capacity_termination_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#excess_capacity_termination_policy Ec2Fleet#excess_capacity_termination_policy}.
        :param fleet_instance_set: fleet_instance_set block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_instance_set Ec2Fleet#fleet_instance_set}
        :param fleet_state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_state Ec2Fleet#fleet_state}.
        :param fulfilled_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_capacity Ec2Fleet#fulfilled_capacity}.
        :param fulfilled_on_demand_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_on_demand_capacity Ec2Fleet#fulfilled_on_demand_capacity}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#id Ec2Fleet#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param on_demand_options: on_demand_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_options Ec2Fleet#on_demand_options}
        :param replace_unhealthy_instances: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replace_unhealthy_instances Ec2Fleet#replace_unhealthy_instances}.
        :param spot_options: spot_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_options Ec2Fleet#spot_options}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags Ec2Fleet#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags_all Ec2Fleet#tags_all}.
        :param terminate_instances: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances Ec2Fleet#terminate_instances}.
        :param terminate_instances_with_expiration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances_with_expiration Ec2Fleet#terminate_instances_with_expiration}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#timeouts Ec2Fleet#timeouts}
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#type Ec2Fleet#type}.
        :param valid_from: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_from Ec2Fleet#valid_from}.
        :param valid_until: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_until Ec2Fleet#valid_until}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(target_capacity_specification, dict):
            target_capacity_specification = Ec2FleetTargetCapacitySpecification(**target_capacity_specification)
        if isinstance(on_demand_options, dict):
            on_demand_options = Ec2FleetOnDemandOptions(**on_demand_options)
        if isinstance(spot_options, dict):
            spot_options = Ec2FleetSpotOptions(**spot_options)
        if isinstance(timeouts, dict):
            timeouts = Ec2FleetTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1aa1ab1f090a40ed05cb1470093f013eeebad88b1d5c6f33d709b28952a7f41b)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument launch_template_config", value=launch_template_config, expected_type=type_hints["launch_template_config"])
            check_type(argname="argument target_capacity_specification", value=target_capacity_specification, expected_type=type_hints["target_capacity_specification"])
            check_type(argname="argument context", value=context, expected_type=type_hints["context"])
            check_type(argname="argument excess_capacity_termination_policy", value=excess_capacity_termination_policy, expected_type=type_hints["excess_capacity_termination_policy"])
            check_type(argname="argument fleet_instance_set", value=fleet_instance_set, expected_type=type_hints["fleet_instance_set"])
            check_type(argname="argument fleet_state", value=fleet_state, expected_type=type_hints["fleet_state"])
            check_type(argname="argument fulfilled_capacity", value=fulfilled_capacity, expected_type=type_hints["fulfilled_capacity"])
            check_type(argname="argument fulfilled_on_demand_capacity", value=fulfilled_on_demand_capacity, expected_type=type_hints["fulfilled_on_demand_capacity"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument on_demand_options", value=on_demand_options, expected_type=type_hints["on_demand_options"])
            check_type(argname="argument replace_unhealthy_instances", value=replace_unhealthy_instances, expected_type=type_hints["replace_unhealthy_instances"])
            check_type(argname="argument spot_options", value=spot_options, expected_type=type_hints["spot_options"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument terminate_instances", value=terminate_instances, expected_type=type_hints["terminate_instances"])
            check_type(argname="argument terminate_instances_with_expiration", value=terminate_instances_with_expiration, expected_type=type_hints["terminate_instances_with_expiration"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument valid_from", value=valid_from, expected_type=type_hints["valid_from"])
            check_type(argname="argument valid_until", value=valid_until, expected_type=type_hints["valid_until"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "launch_template_config": launch_template_config,
            "target_capacity_specification": target_capacity_specification,
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
        if context is not None:
            self._values["context"] = context
        if excess_capacity_termination_policy is not None:
            self._values["excess_capacity_termination_policy"] = excess_capacity_termination_policy
        if fleet_instance_set is not None:
            self._values["fleet_instance_set"] = fleet_instance_set
        if fleet_state is not None:
            self._values["fleet_state"] = fleet_state
        if fulfilled_capacity is not None:
            self._values["fulfilled_capacity"] = fulfilled_capacity
        if fulfilled_on_demand_capacity is not None:
            self._values["fulfilled_on_demand_capacity"] = fulfilled_on_demand_capacity
        if id is not None:
            self._values["id"] = id
        if on_demand_options is not None:
            self._values["on_demand_options"] = on_demand_options
        if replace_unhealthy_instances is not None:
            self._values["replace_unhealthy_instances"] = replace_unhealthy_instances
        if spot_options is not None:
            self._values["spot_options"] = spot_options
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if terminate_instances is not None:
            self._values["terminate_instances"] = terminate_instances
        if terminate_instances_with_expiration is not None:
            self._values["terminate_instances_with_expiration"] = terminate_instances_with_expiration
        if timeouts is not None:
            self._values["timeouts"] = timeouts
        if type is not None:
            self._values["type"] = type
        if valid_from is not None:
            self._values["valid_from"] = valid_from
        if valid_until is not None:
            self._values["valid_until"] = valid_until

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
    def launch_template_config(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Ec2FleetLaunchTemplateConfig"]]:
        '''launch_template_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_config Ec2Fleet#launch_template_config}
        '''
        result = self._values.get("launch_template_config")
        assert result is not None, "Required property 'launch_template_config' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Ec2FleetLaunchTemplateConfig"]], result)

    @builtins.property
    def target_capacity_specification(self) -> "Ec2FleetTargetCapacitySpecification":
        '''target_capacity_specification block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#target_capacity_specification Ec2Fleet#target_capacity_specification}
        '''
        result = self._values.get("target_capacity_specification")
        assert result is not None, "Required property 'target_capacity_specification' is missing"
        return typing.cast("Ec2FleetTargetCapacitySpecification", result)

    @builtins.property
    def context(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#context Ec2Fleet#context}.'''
        result = self._values.get("context")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def excess_capacity_termination_policy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#excess_capacity_termination_policy Ec2Fleet#excess_capacity_termination_policy}.'''
        result = self._values.get("excess_capacity_termination_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def fleet_instance_set(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Ec2FleetFleetInstanceSet"]]]:
        '''fleet_instance_set block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_instance_set Ec2Fleet#fleet_instance_set}
        '''
        result = self._values.get("fleet_instance_set")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Ec2FleetFleetInstanceSet"]]], result)

    @builtins.property
    def fleet_state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fleet_state Ec2Fleet#fleet_state}.'''
        result = self._values.get("fleet_state")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def fulfilled_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_capacity Ec2Fleet#fulfilled_capacity}.'''
        result = self._values.get("fulfilled_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def fulfilled_on_demand_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#fulfilled_on_demand_capacity Ec2Fleet#fulfilled_on_demand_capacity}.'''
        result = self._values.get("fulfilled_on_demand_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#id Ec2Fleet#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def on_demand_options(self) -> typing.Optional["Ec2FleetOnDemandOptions"]:
        '''on_demand_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_options Ec2Fleet#on_demand_options}
        '''
        result = self._values.get("on_demand_options")
        return typing.cast(typing.Optional["Ec2FleetOnDemandOptions"], result)

    @builtins.property
    def replace_unhealthy_instances(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replace_unhealthy_instances Ec2Fleet#replace_unhealthy_instances}.'''
        result = self._values.get("replace_unhealthy_instances")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def spot_options(self) -> typing.Optional["Ec2FleetSpotOptions"]:
        '''spot_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_options Ec2Fleet#spot_options}
        '''
        result = self._values.get("spot_options")
        return typing.cast(typing.Optional["Ec2FleetSpotOptions"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags Ec2Fleet#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#tags_all Ec2Fleet#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def terminate_instances(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances Ec2Fleet#terminate_instances}.'''
        result = self._values.get("terminate_instances")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def terminate_instances_with_expiration(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#terminate_instances_with_expiration Ec2Fleet#terminate_instances_with_expiration}.'''
        result = self._values.get("terminate_instances_with_expiration")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["Ec2FleetTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#timeouts Ec2Fleet#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["Ec2FleetTimeouts"], result)

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#type Ec2Fleet#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def valid_from(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_from Ec2Fleet#valid_from}.'''
        result = self._values.get("valid_from")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def valid_until(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#valid_until Ec2Fleet#valid_until}.'''
        result = self._values.get("valid_until")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetFleetInstanceSet",
    jsii_struct_bases=[],
    name_mapping={
        "instance_ids": "instanceIds",
        "instance_type": "instanceType",
        "lifecycle": "lifecycle",
        "platform": "platform",
    },
)
class Ec2FleetFleetInstanceSet:
    def __init__(
        self,
        *,
        instance_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        instance_type: typing.Optional[builtins.str] = None,
        lifecycle: typing.Optional[builtins.str] = None,
        platform: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_ids Ec2Fleet#instance_ids}.
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_type Ec2Fleet#instance_type}.
        :param lifecycle: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#lifecycle Ec2Fleet#lifecycle}.
        :param platform: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#platform Ec2Fleet#platform}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__45aae8843d5113ba8009509533f4c37ca53e30beb263e3905c991ea6f0b53b84)
            check_type(argname="argument instance_ids", value=instance_ids, expected_type=type_hints["instance_ids"])
            check_type(argname="argument instance_type", value=instance_type, expected_type=type_hints["instance_type"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument platform", value=platform, expected_type=type_hints["platform"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if instance_ids is not None:
            self._values["instance_ids"] = instance_ids
        if instance_type is not None:
            self._values["instance_type"] = instance_type
        if lifecycle is not None:
            self._values["lifecycle"] = lifecycle
        if platform is not None:
            self._values["platform"] = platform

    @builtins.property
    def instance_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_ids Ec2Fleet#instance_ids}.'''
        result = self._values.get("instance_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def instance_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_type Ec2Fleet#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lifecycle(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#lifecycle Ec2Fleet#lifecycle}.'''
        result = self._values.get("lifecycle")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def platform(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#platform Ec2Fleet#platform}.'''
        result = self._values.get("platform")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetFleetInstanceSet(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetFleetInstanceSetList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetFleetInstanceSetList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5cf5c3c02204bae7001c1b525431723e684141bee1d1b35e7da055271d67dfaf)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "Ec2FleetFleetInstanceSetOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f28ed585469adf38e36a93c6cd3b24e33f548312d15f235a12a2c46034ec64be)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Ec2FleetFleetInstanceSetOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a275c76dc45addec9396af073642833efe0a4a01df0761fbb0560b4723946e91)
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
            type_hints = typing.get_type_hints(_typecheckingstub__40204f8d294d4b045da105ebc964a83c3c3ac2adb45f36233b443df704ea2e6b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__eb64ad1ed180fdf153c84296ab7d52845b0e2e6a98c66b39b4ab8b62233b992e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Ec2FleetFleetInstanceSet]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Ec2FleetFleetInstanceSet]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Ec2FleetFleetInstanceSet]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8edc571d859cb743499a9972f9efc5141f70fe4f0f4d9837799864783ee1e2d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Ec2FleetFleetInstanceSetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetFleetInstanceSetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b0d8de0e0d70e188ae860c24bedba64bf1a2fe0f1a96e26d666ba57b9e2a31ba)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetInstanceIds")
    def reset_instance_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceIds", []))

    @jsii.member(jsii_name="resetInstanceType")
    def reset_instance_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceType", []))

    @jsii.member(jsii_name="resetLifecycle")
    def reset_lifecycle(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycle", []))

    @jsii.member(jsii_name="resetPlatform")
    def reset_platform(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPlatform", []))

    @builtins.property
    @jsii.member(jsii_name="instanceIdsInput")
    def instance_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "instanceIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceTypeInput")
    def instance_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "instanceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleInput")
    def lifecycle_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lifecycleInput"))

    @builtins.property
    @jsii.member(jsii_name="platformInput")
    def platform_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "platformInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceIds")
    def instance_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "instanceIds"))

    @instance_ids.setter
    def instance_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b6186a2606f5a7833a38a5cc26a67302e8dc487c8381da16e7a54f09ae81a79a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="instanceType")
    def instance_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "instanceType"))

    @instance_type.setter
    def instance_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__133258078b9e763a0b21c8d78b07a8dbfd38810c6df253e9c350e8e9bc313757)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycle")
    def lifecycle(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycle"))

    @lifecycle.setter
    def lifecycle(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4b861e132e9a76c542cf5c6da6885c13bbfcf5096b2914e0018a13b075caeff6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycle", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="platform")
    def platform(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "platform"))

    @platform.setter
    def platform(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08ba96f5394640ba7caf384296818e38e6d90e0e817a207834e7de1531018e6d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "platform", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetFleetInstanceSet]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetFleetInstanceSet]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetFleetInstanceSet]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7be54835ce10c83120512ad3f1e01738d7c2df2e1e5e4015b8934b420742ad56)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfig",
    jsii_struct_bases=[],
    name_mapping={
        "launch_template_specification": "launchTemplateSpecification",
        "override": "override",
    },
)
class Ec2FleetLaunchTemplateConfig:
    def __init__(
        self,
        *,
        launch_template_specification: typing.Optional[typing.Union["Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification", typing.Dict[builtins.str, typing.Any]]] = None,
        override: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Ec2FleetLaunchTemplateConfigOverride", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param launch_template_specification: launch_template_specification block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_specification Ec2Fleet#launch_template_specification}
        :param override: override block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#override Ec2Fleet#override}
        '''
        if isinstance(launch_template_specification, dict):
            launch_template_specification = Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification(**launch_template_specification)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01f947abccff90e4add81a60db4fb2bce83f4ce63803a2fa5491e6552728e588)
            check_type(argname="argument launch_template_specification", value=launch_template_specification, expected_type=type_hints["launch_template_specification"])
            check_type(argname="argument override", value=override, expected_type=type_hints["override"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if launch_template_specification is not None:
            self._values["launch_template_specification"] = launch_template_specification
        if override is not None:
            self._values["override"] = override

    @builtins.property
    def launch_template_specification(
        self,
    ) -> typing.Optional["Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification"]:
        '''launch_template_specification block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_specification Ec2Fleet#launch_template_specification}
        '''
        result = self._values.get("launch_template_specification")
        return typing.cast(typing.Optional["Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification"], result)

    @builtins.property
    def override(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Ec2FleetLaunchTemplateConfigOverride"]]]:
        '''override block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#override Ec2Fleet#override}
        '''
        result = self._values.get("override")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Ec2FleetLaunchTemplateConfigOverride"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification",
    jsii_struct_bases=[],
    name_mapping={
        "version": "version",
        "launch_template_id": "launchTemplateId",
        "launch_template_name": "launchTemplateName",
    },
)
class Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification:
    def __init__(
        self,
        *,
        version: builtins.str,
        launch_template_id: typing.Optional[builtins.str] = None,
        launch_template_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#version Ec2Fleet#version}.
        :param launch_template_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_id Ec2Fleet#launch_template_id}.
        :param launch_template_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_name Ec2Fleet#launch_template_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__119ec88f6faf289f1c5fbc3a806493472b75e7396635f71f7b36ae91832e2061)
            check_type(argname="argument version", value=version, expected_type=type_hints["version"])
            check_type(argname="argument launch_template_id", value=launch_template_id, expected_type=type_hints["launch_template_id"])
            check_type(argname="argument launch_template_name", value=launch_template_name, expected_type=type_hints["launch_template_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "version": version,
        }
        if launch_template_id is not None:
            self._values["launch_template_id"] = launch_template_id
        if launch_template_name is not None:
            self._values["launch_template_name"] = launch_template_name

    @builtins.property
    def version(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#version Ec2Fleet#version}.'''
        result = self._values.get("version")
        assert result is not None, "Required property 'version' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def launch_template_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_id Ec2Fleet#launch_template_id}.'''
        result = self._values.get("launch_template_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def launch_template_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_name Ec2Fleet#launch_template_name}.'''
        result = self._values.get("launch_template_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetLaunchTemplateConfigLaunchTemplateSpecificationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigLaunchTemplateSpecificationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__28c5fbe00cf944c0e025aaeefe8e015ebb5aec2be6670bfc446830a47bc4e2cd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetLaunchTemplateId")
    def reset_launch_template_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLaunchTemplateId", []))

    @jsii.member(jsii_name="resetLaunchTemplateName")
    def reset_launch_template_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLaunchTemplateName", []))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateIdInput")
    def launch_template_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "launchTemplateIdInput"))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateNameInput")
    def launch_template_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "launchTemplateNameInput"))

    @builtins.property
    @jsii.member(jsii_name="versionInput")
    def version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "versionInput"))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateId")
    def launch_template_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "launchTemplateId"))

    @launch_template_id.setter
    def launch_template_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa601f974cd2fe3397e7156f22c72ab9a8d3840266dbccf76fbc209534c9c151)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "launchTemplateId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="launchTemplateName")
    def launch_template_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "launchTemplateName"))

    @launch_template_name.setter
    def launch_template_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec3a3edfaf2d06cfef9b74f58f72048021cd6d5d1fc9f62616bc40fb471b70d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "launchTemplateName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="version")
    def version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "version"))

    @version.setter
    def version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99c7dafdef43b1593218a85a059681ce3684e3e37cc6e17ee367367556976003)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "version", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c53f576b9d8f3c513b9cc64b0f66db3d1c0a66544dc2724567ac684e7890851e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Ec2FleetLaunchTemplateConfigList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4bc90a137d403c02c1b7ca48e66ce10902b8f61eb2c4c3d37790ce0d3a97387e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "Ec2FleetLaunchTemplateConfigOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86fabfa574ac3a59a8857675e2f236e970a93cb7ff6f62ac5a949b55cc937f15)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Ec2FleetLaunchTemplateConfigOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07691f23bc217c71860d692854849dae63bd027cefc337594a14233324ec94d4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__eccf2e8423dd36ae003d9165fa24f468cd3c6655343f606d2ab8cd8a617c3645)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d2d3f401dfbc2ac2aab950f558951bde8909bf49baf6c5877bed5e109d586407)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Ec2FleetLaunchTemplateConfig]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Ec2FleetLaunchTemplateConfig]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Ec2FleetLaunchTemplateConfig]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__165d7bd7336fa81477e3425dd6284f48a6b960b0a986ca24f01272edbc33f90f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Ec2FleetLaunchTemplateConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__516a3ecd3de933f5f55b1846826db0d648cdcac7f449b1a93205e7150aac2942)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putLaunchTemplateSpecification")
    def put_launch_template_specification(
        self,
        *,
        version: builtins.str,
        launch_template_id: typing.Optional[builtins.str] = None,
        launch_template_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#version Ec2Fleet#version}.
        :param launch_template_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_id Ec2Fleet#launch_template_id}.
        :param launch_template_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_name Ec2Fleet#launch_template_name}.
        '''
        value = Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification(
            version=version,
            launch_template_id=launch_template_id,
            launch_template_name=launch_template_name,
        )

        return typing.cast(None, jsii.invoke(self, "putLaunchTemplateSpecification", [value]))

    @jsii.member(jsii_name="putOverride")
    def put_override(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Ec2FleetLaunchTemplateConfigOverride", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2062ff88e6ceac2c4d97a7f256e67e07a5055754a9b823ae72b54498e61869a2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putOverride", [value]))

    @jsii.member(jsii_name="resetLaunchTemplateSpecification")
    def reset_launch_template_specification(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLaunchTemplateSpecification", []))

    @jsii.member(jsii_name="resetOverride")
    def reset_override(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOverride", []))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateSpecification")
    def launch_template_specification(
        self,
    ) -> Ec2FleetLaunchTemplateConfigLaunchTemplateSpecificationOutputReference:
        return typing.cast(Ec2FleetLaunchTemplateConfigLaunchTemplateSpecificationOutputReference, jsii.get(self, "launchTemplateSpecification"))

    @builtins.property
    @jsii.member(jsii_name="override")
    def override(self) -> "Ec2FleetLaunchTemplateConfigOverrideList":
        return typing.cast("Ec2FleetLaunchTemplateConfigOverrideList", jsii.get(self, "override"))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateSpecificationInput")
    def launch_template_specification_input(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification], jsii.get(self, "launchTemplateSpecificationInput"))

    @builtins.property
    @jsii.member(jsii_name="overrideInput")
    def override_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Ec2FleetLaunchTemplateConfigOverride"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Ec2FleetLaunchTemplateConfigOverride"]]], jsii.get(self, "overrideInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetLaunchTemplateConfig]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetLaunchTemplateConfig]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetLaunchTemplateConfig]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a154c87b6f27166a2d5076d205d5b7157e660ebc0a2f9e6e3ef202ec0cad3ec1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverride",
    jsii_struct_bases=[],
    name_mapping={
        "availability_zone": "availabilityZone",
        "instance_requirements": "instanceRequirements",
        "instance_type": "instanceType",
        "max_price": "maxPrice",
        "priority": "priority",
        "subnet_id": "subnetId",
        "weighted_capacity": "weightedCapacity",
    },
)
class Ec2FleetLaunchTemplateConfigOverride:
    def __init__(
        self,
        *,
        availability_zone: typing.Optional[builtins.str] = None,
        instance_requirements: typing.Optional[typing.Union["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements", typing.Dict[builtins.str, typing.Any]]] = None,
        instance_type: typing.Optional[builtins.str] = None,
        max_price: typing.Optional[builtins.str] = None,
        priority: typing.Optional[jsii.Number] = None,
        subnet_id: typing.Optional[builtins.str] = None,
        weighted_capacity: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param availability_zone: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#availability_zone Ec2Fleet#availability_zone}.
        :param instance_requirements: instance_requirements block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_requirements Ec2Fleet#instance_requirements}
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_type Ec2Fleet#instance_type}.
        :param max_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_price Ec2Fleet#max_price}.
        :param priority: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#priority Ec2Fleet#priority}.
        :param subnet_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#subnet_id Ec2Fleet#subnet_id}.
        :param weighted_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#weighted_capacity Ec2Fleet#weighted_capacity}.
        '''
        if isinstance(instance_requirements, dict):
            instance_requirements = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements(**instance_requirements)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ef45740bdfc9d0aee874e7975907905256eea424a1e1223a03b46c62dab616c4)
            check_type(argname="argument availability_zone", value=availability_zone, expected_type=type_hints["availability_zone"])
            check_type(argname="argument instance_requirements", value=instance_requirements, expected_type=type_hints["instance_requirements"])
            check_type(argname="argument instance_type", value=instance_type, expected_type=type_hints["instance_type"])
            check_type(argname="argument max_price", value=max_price, expected_type=type_hints["max_price"])
            check_type(argname="argument priority", value=priority, expected_type=type_hints["priority"])
            check_type(argname="argument subnet_id", value=subnet_id, expected_type=type_hints["subnet_id"])
            check_type(argname="argument weighted_capacity", value=weighted_capacity, expected_type=type_hints["weighted_capacity"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if availability_zone is not None:
            self._values["availability_zone"] = availability_zone
        if instance_requirements is not None:
            self._values["instance_requirements"] = instance_requirements
        if instance_type is not None:
            self._values["instance_type"] = instance_type
        if max_price is not None:
            self._values["max_price"] = max_price
        if priority is not None:
            self._values["priority"] = priority
        if subnet_id is not None:
            self._values["subnet_id"] = subnet_id
        if weighted_capacity is not None:
            self._values["weighted_capacity"] = weighted_capacity

    @builtins.property
    def availability_zone(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#availability_zone Ec2Fleet#availability_zone}.'''
        result = self._values.get("availability_zone")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def instance_requirements(
        self,
    ) -> typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements"]:
        '''instance_requirements block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_requirements Ec2Fleet#instance_requirements}
        '''
        result = self._values.get("instance_requirements")
        return typing.cast(typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements"], result)

    @builtins.property
    def instance_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_type Ec2Fleet#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def max_price(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_price Ec2Fleet#max_price}.'''
        result = self._values.get("max_price")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def priority(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#priority Ec2Fleet#priority}.'''
        result = self._values.get("priority")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def subnet_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#subnet_id Ec2Fleet#subnet_id}.'''
        result = self._values.get("subnet_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def weighted_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#weighted_capacity Ec2Fleet#weighted_capacity}.'''
        result = self._values.get("weighted_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfigOverride(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements",
    jsii_struct_bases=[],
    name_mapping={
        "memory_mib": "memoryMib",
        "vcpu_count": "vcpuCount",
        "accelerator_count": "acceleratorCount",
        "accelerator_manufacturers": "acceleratorManufacturers",
        "accelerator_names": "acceleratorNames",
        "accelerator_total_memory_mib": "acceleratorTotalMemoryMib",
        "accelerator_types": "acceleratorTypes",
        "allowed_instance_types": "allowedInstanceTypes",
        "bare_metal": "bareMetal",
        "baseline_ebs_bandwidth_mbps": "baselineEbsBandwidthMbps",
        "burstable_performance": "burstablePerformance",
        "cpu_manufacturers": "cpuManufacturers",
        "excluded_instance_types": "excludedInstanceTypes",
        "instance_generations": "instanceGenerations",
        "local_storage": "localStorage",
        "local_storage_types": "localStorageTypes",
        "max_spot_price_as_percentage_of_optimal_on_demand_price": "maxSpotPriceAsPercentageOfOptimalOnDemandPrice",
        "memory_gib_per_vcpu": "memoryGibPerVcpu",
        "network_bandwidth_gbps": "networkBandwidthGbps",
        "network_interface_count": "networkInterfaceCount",
        "on_demand_max_price_percentage_over_lowest_price": "onDemandMaxPricePercentageOverLowestPrice",
        "require_hibernate_support": "requireHibernateSupport",
        "spot_max_price_percentage_over_lowest_price": "spotMaxPricePercentageOverLowestPrice",
        "total_local_storage_gb": "totalLocalStorageGb",
    },
)
class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements:
    def __init__(
        self,
        *,
        memory_mib: typing.Union["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib", typing.Dict[builtins.str, typing.Any]],
        vcpu_count: typing.Union["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount", typing.Dict[builtins.str, typing.Any]],
        accelerator_count: typing.Optional[typing.Union["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount", typing.Dict[builtins.str, typing.Any]]] = None,
        accelerator_manufacturers: typing.Optional[typing.Sequence[builtins.str]] = None,
        accelerator_names: typing.Optional[typing.Sequence[builtins.str]] = None,
        accelerator_total_memory_mib: typing.Optional[typing.Union["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib", typing.Dict[builtins.str, typing.Any]]] = None,
        accelerator_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        allowed_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        bare_metal: typing.Optional[builtins.str] = None,
        baseline_ebs_bandwidth_mbps: typing.Optional[typing.Union["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps", typing.Dict[builtins.str, typing.Any]]] = None,
        burstable_performance: typing.Optional[builtins.str] = None,
        cpu_manufacturers: typing.Optional[typing.Sequence[builtins.str]] = None,
        excluded_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        instance_generations: typing.Optional[typing.Sequence[builtins.str]] = None,
        local_storage: typing.Optional[builtins.str] = None,
        local_storage_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        max_spot_price_as_percentage_of_optimal_on_demand_price: typing.Optional[jsii.Number] = None,
        memory_gib_per_vcpu: typing.Optional[typing.Union["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu", typing.Dict[builtins.str, typing.Any]]] = None,
        network_bandwidth_gbps: typing.Optional[typing.Union["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps", typing.Dict[builtins.str, typing.Any]]] = None,
        network_interface_count: typing.Optional[typing.Union["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount", typing.Dict[builtins.str, typing.Any]]] = None,
        on_demand_max_price_percentage_over_lowest_price: typing.Optional[jsii.Number] = None,
        require_hibernate_support: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        spot_max_price_percentage_over_lowest_price: typing.Optional[jsii.Number] = None,
        total_local_storage_gb: typing.Optional[typing.Union["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param memory_mib: memory_mib block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#memory_mib Ec2Fleet#memory_mib}
        :param vcpu_count: vcpu_count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#vcpu_count Ec2Fleet#vcpu_count}
        :param accelerator_count: accelerator_count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_count Ec2Fleet#accelerator_count}
        :param accelerator_manufacturers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_manufacturers Ec2Fleet#accelerator_manufacturers}.
        :param accelerator_names: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_names Ec2Fleet#accelerator_names}.
        :param accelerator_total_memory_mib: accelerator_total_memory_mib block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_total_memory_mib Ec2Fleet#accelerator_total_memory_mib}
        :param accelerator_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_types Ec2Fleet#accelerator_types}.
        :param allowed_instance_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allowed_instance_types Ec2Fleet#allowed_instance_types}.
        :param bare_metal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#bare_metal Ec2Fleet#bare_metal}.
        :param baseline_ebs_bandwidth_mbps: baseline_ebs_bandwidth_mbps block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#baseline_ebs_bandwidth_mbps Ec2Fleet#baseline_ebs_bandwidth_mbps}
        :param burstable_performance: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#burstable_performance Ec2Fleet#burstable_performance}.
        :param cpu_manufacturers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#cpu_manufacturers Ec2Fleet#cpu_manufacturers}.
        :param excluded_instance_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#excluded_instance_types Ec2Fleet#excluded_instance_types}.
        :param instance_generations: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_generations Ec2Fleet#instance_generations}.
        :param local_storage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#local_storage Ec2Fleet#local_storage}.
        :param local_storage_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#local_storage_types Ec2Fleet#local_storage_types}.
        :param max_spot_price_as_percentage_of_optimal_on_demand_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_spot_price_as_percentage_of_optimal_on_demand_price Ec2Fleet#max_spot_price_as_percentage_of_optimal_on_demand_price}.
        :param memory_gib_per_vcpu: memory_gib_per_vcpu block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#memory_gib_per_vcpu Ec2Fleet#memory_gib_per_vcpu}
        :param network_bandwidth_gbps: network_bandwidth_gbps block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#network_bandwidth_gbps Ec2Fleet#network_bandwidth_gbps}
        :param network_interface_count: network_interface_count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#network_interface_count Ec2Fleet#network_interface_count}
        :param on_demand_max_price_percentage_over_lowest_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_max_price_percentage_over_lowest_price Ec2Fleet#on_demand_max_price_percentage_over_lowest_price}.
        :param require_hibernate_support: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#require_hibernate_support Ec2Fleet#require_hibernate_support}.
        :param spot_max_price_percentage_over_lowest_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_max_price_percentage_over_lowest_price Ec2Fleet#spot_max_price_percentage_over_lowest_price}.
        :param total_local_storage_gb: total_local_storage_gb block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#total_local_storage_gb Ec2Fleet#total_local_storage_gb}
        '''
        if isinstance(memory_mib, dict):
            memory_mib = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib(**memory_mib)
        if isinstance(vcpu_count, dict):
            vcpu_count = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount(**vcpu_count)
        if isinstance(accelerator_count, dict):
            accelerator_count = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount(**accelerator_count)
        if isinstance(accelerator_total_memory_mib, dict):
            accelerator_total_memory_mib = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib(**accelerator_total_memory_mib)
        if isinstance(baseline_ebs_bandwidth_mbps, dict):
            baseline_ebs_bandwidth_mbps = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps(**baseline_ebs_bandwidth_mbps)
        if isinstance(memory_gib_per_vcpu, dict):
            memory_gib_per_vcpu = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu(**memory_gib_per_vcpu)
        if isinstance(network_bandwidth_gbps, dict):
            network_bandwidth_gbps = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps(**network_bandwidth_gbps)
        if isinstance(network_interface_count, dict):
            network_interface_count = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount(**network_interface_count)
        if isinstance(total_local_storage_gb, dict):
            total_local_storage_gb = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb(**total_local_storage_gb)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c7d47bce7f3d09cb89f760c6f533d7bef5fd6faab8fc95284dbfa569464642b5)
            check_type(argname="argument memory_mib", value=memory_mib, expected_type=type_hints["memory_mib"])
            check_type(argname="argument vcpu_count", value=vcpu_count, expected_type=type_hints["vcpu_count"])
            check_type(argname="argument accelerator_count", value=accelerator_count, expected_type=type_hints["accelerator_count"])
            check_type(argname="argument accelerator_manufacturers", value=accelerator_manufacturers, expected_type=type_hints["accelerator_manufacturers"])
            check_type(argname="argument accelerator_names", value=accelerator_names, expected_type=type_hints["accelerator_names"])
            check_type(argname="argument accelerator_total_memory_mib", value=accelerator_total_memory_mib, expected_type=type_hints["accelerator_total_memory_mib"])
            check_type(argname="argument accelerator_types", value=accelerator_types, expected_type=type_hints["accelerator_types"])
            check_type(argname="argument allowed_instance_types", value=allowed_instance_types, expected_type=type_hints["allowed_instance_types"])
            check_type(argname="argument bare_metal", value=bare_metal, expected_type=type_hints["bare_metal"])
            check_type(argname="argument baseline_ebs_bandwidth_mbps", value=baseline_ebs_bandwidth_mbps, expected_type=type_hints["baseline_ebs_bandwidth_mbps"])
            check_type(argname="argument burstable_performance", value=burstable_performance, expected_type=type_hints["burstable_performance"])
            check_type(argname="argument cpu_manufacturers", value=cpu_manufacturers, expected_type=type_hints["cpu_manufacturers"])
            check_type(argname="argument excluded_instance_types", value=excluded_instance_types, expected_type=type_hints["excluded_instance_types"])
            check_type(argname="argument instance_generations", value=instance_generations, expected_type=type_hints["instance_generations"])
            check_type(argname="argument local_storage", value=local_storage, expected_type=type_hints["local_storage"])
            check_type(argname="argument local_storage_types", value=local_storage_types, expected_type=type_hints["local_storage_types"])
            check_type(argname="argument max_spot_price_as_percentage_of_optimal_on_demand_price", value=max_spot_price_as_percentage_of_optimal_on_demand_price, expected_type=type_hints["max_spot_price_as_percentage_of_optimal_on_demand_price"])
            check_type(argname="argument memory_gib_per_vcpu", value=memory_gib_per_vcpu, expected_type=type_hints["memory_gib_per_vcpu"])
            check_type(argname="argument network_bandwidth_gbps", value=network_bandwidth_gbps, expected_type=type_hints["network_bandwidth_gbps"])
            check_type(argname="argument network_interface_count", value=network_interface_count, expected_type=type_hints["network_interface_count"])
            check_type(argname="argument on_demand_max_price_percentage_over_lowest_price", value=on_demand_max_price_percentage_over_lowest_price, expected_type=type_hints["on_demand_max_price_percentage_over_lowest_price"])
            check_type(argname="argument require_hibernate_support", value=require_hibernate_support, expected_type=type_hints["require_hibernate_support"])
            check_type(argname="argument spot_max_price_percentage_over_lowest_price", value=spot_max_price_percentage_over_lowest_price, expected_type=type_hints["spot_max_price_percentage_over_lowest_price"])
            check_type(argname="argument total_local_storage_gb", value=total_local_storage_gb, expected_type=type_hints["total_local_storage_gb"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "memory_mib": memory_mib,
            "vcpu_count": vcpu_count,
        }
        if accelerator_count is not None:
            self._values["accelerator_count"] = accelerator_count
        if accelerator_manufacturers is not None:
            self._values["accelerator_manufacturers"] = accelerator_manufacturers
        if accelerator_names is not None:
            self._values["accelerator_names"] = accelerator_names
        if accelerator_total_memory_mib is not None:
            self._values["accelerator_total_memory_mib"] = accelerator_total_memory_mib
        if accelerator_types is not None:
            self._values["accelerator_types"] = accelerator_types
        if allowed_instance_types is not None:
            self._values["allowed_instance_types"] = allowed_instance_types
        if bare_metal is not None:
            self._values["bare_metal"] = bare_metal
        if baseline_ebs_bandwidth_mbps is not None:
            self._values["baseline_ebs_bandwidth_mbps"] = baseline_ebs_bandwidth_mbps
        if burstable_performance is not None:
            self._values["burstable_performance"] = burstable_performance
        if cpu_manufacturers is not None:
            self._values["cpu_manufacturers"] = cpu_manufacturers
        if excluded_instance_types is not None:
            self._values["excluded_instance_types"] = excluded_instance_types
        if instance_generations is not None:
            self._values["instance_generations"] = instance_generations
        if local_storage is not None:
            self._values["local_storage"] = local_storage
        if local_storage_types is not None:
            self._values["local_storage_types"] = local_storage_types
        if max_spot_price_as_percentage_of_optimal_on_demand_price is not None:
            self._values["max_spot_price_as_percentage_of_optimal_on_demand_price"] = max_spot_price_as_percentage_of_optimal_on_demand_price
        if memory_gib_per_vcpu is not None:
            self._values["memory_gib_per_vcpu"] = memory_gib_per_vcpu
        if network_bandwidth_gbps is not None:
            self._values["network_bandwidth_gbps"] = network_bandwidth_gbps
        if network_interface_count is not None:
            self._values["network_interface_count"] = network_interface_count
        if on_demand_max_price_percentage_over_lowest_price is not None:
            self._values["on_demand_max_price_percentage_over_lowest_price"] = on_demand_max_price_percentage_over_lowest_price
        if require_hibernate_support is not None:
            self._values["require_hibernate_support"] = require_hibernate_support
        if spot_max_price_percentage_over_lowest_price is not None:
            self._values["spot_max_price_percentage_over_lowest_price"] = spot_max_price_percentage_over_lowest_price
        if total_local_storage_gb is not None:
            self._values["total_local_storage_gb"] = total_local_storage_gb

    @builtins.property
    def memory_mib(
        self,
    ) -> "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib":
        '''memory_mib block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#memory_mib Ec2Fleet#memory_mib}
        '''
        result = self._values.get("memory_mib")
        assert result is not None, "Required property 'memory_mib' is missing"
        return typing.cast("Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib", result)

    @builtins.property
    def vcpu_count(
        self,
    ) -> "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount":
        '''vcpu_count block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#vcpu_count Ec2Fleet#vcpu_count}
        '''
        result = self._values.get("vcpu_count")
        assert result is not None, "Required property 'vcpu_count' is missing"
        return typing.cast("Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount", result)

    @builtins.property
    def accelerator_count(
        self,
    ) -> typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount"]:
        '''accelerator_count block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_count Ec2Fleet#accelerator_count}
        '''
        result = self._values.get("accelerator_count")
        return typing.cast(typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount"], result)

    @builtins.property
    def accelerator_manufacturers(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_manufacturers Ec2Fleet#accelerator_manufacturers}.'''
        result = self._values.get("accelerator_manufacturers")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def accelerator_names(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_names Ec2Fleet#accelerator_names}.'''
        result = self._values.get("accelerator_names")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def accelerator_total_memory_mib(
        self,
    ) -> typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib"]:
        '''accelerator_total_memory_mib block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_total_memory_mib Ec2Fleet#accelerator_total_memory_mib}
        '''
        result = self._values.get("accelerator_total_memory_mib")
        return typing.cast(typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib"], result)

    @builtins.property
    def accelerator_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_types Ec2Fleet#accelerator_types}.'''
        result = self._values.get("accelerator_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def allowed_instance_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allowed_instance_types Ec2Fleet#allowed_instance_types}.'''
        result = self._values.get("allowed_instance_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def bare_metal(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#bare_metal Ec2Fleet#bare_metal}.'''
        result = self._values.get("bare_metal")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def baseline_ebs_bandwidth_mbps(
        self,
    ) -> typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps"]:
        '''baseline_ebs_bandwidth_mbps block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#baseline_ebs_bandwidth_mbps Ec2Fleet#baseline_ebs_bandwidth_mbps}
        '''
        result = self._values.get("baseline_ebs_bandwidth_mbps")
        return typing.cast(typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps"], result)

    @builtins.property
    def burstable_performance(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#burstable_performance Ec2Fleet#burstable_performance}.'''
        result = self._values.get("burstable_performance")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def cpu_manufacturers(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#cpu_manufacturers Ec2Fleet#cpu_manufacturers}.'''
        result = self._values.get("cpu_manufacturers")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def excluded_instance_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#excluded_instance_types Ec2Fleet#excluded_instance_types}.'''
        result = self._values.get("excluded_instance_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def instance_generations(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_generations Ec2Fleet#instance_generations}.'''
        result = self._values.get("instance_generations")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def local_storage(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#local_storage Ec2Fleet#local_storage}.'''
        result = self._values.get("local_storage")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def local_storage_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#local_storage_types Ec2Fleet#local_storage_types}.'''
        result = self._values.get("local_storage_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def max_spot_price_as_percentage_of_optimal_on_demand_price(
        self,
    ) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_spot_price_as_percentage_of_optimal_on_demand_price Ec2Fleet#max_spot_price_as_percentage_of_optimal_on_demand_price}.'''
        result = self._values.get("max_spot_price_as_percentage_of_optimal_on_demand_price")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def memory_gib_per_vcpu(
        self,
    ) -> typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu"]:
        '''memory_gib_per_vcpu block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#memory_gib_per_vcpu Ec2Fleet#memory_gib_per_vcpu}
        '''
        result = self._values.get("memory_gib_per_vcpu")
        return typing.cast(typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu"], result)

    @builtins.property
    def network_bandwidth_gbps(
        self,
    ) -> typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps"]:
        '''network_bandwidth_gbps block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#network_bandwidth_gbps Ec2Fleet#network_bandwidth_gbps}
        '''
        result = self._values.get("network_bandwidth_gbps")
        return typing.cast(typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps"], result)

    @builtins.property
    def network_interface_count(
        self,
    ) -> typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount"]:
        '''network_interface_count block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#network_interface_count Ec2Fleet#network_interface_count}
        '''
        result = self._values.get("network_interface_count")
        return typing.cast(typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount"], result)

    @builtins.property
    def on_demand_max_price_percentage_over_lowest_price(
        self,
    ) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_max_price_percentage_over_lowest_price Ec2Fleet#on_demand_max_price_percentage_over_lowest_price}.'''
        result = self._values.get("on_demand_max_price_percentage_over_lowest_price")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def require_hibernate_support(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#require_hibernate_support Ec2Fleet#require_hibernate_support}.'''
        result = self._values.get("require_hibernate_support")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def spot_max_price_percentage_over_lowest_price(
        self,
    ) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_max_price_percentage_over_lowest_price Ec2Fleet#spot_max_price_percentage_over_lowest_price}.'''
        result = self._values.get("spot_max_price_percentage_over_lowest_price")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def total_local_storage_gb(
        self,
    ) -> typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb"]:
        '''total_local_storage_gb block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#total_local_storage_gb Ec2Fleet#total_local_storage_gb}
        '''
        result = self._values.get("total_local_storage_gb")
        return typing.cast(typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__688e0c98eca32beba61f338e6ee7ddd9ce6b7e3b85b9140ade2aa298c6530b67)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCountOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCountOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3acffc603968cfaf86488ebf49577bcdc7e2bf286d902ca3637d40a88c15add4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @jsii.member(jsii_name="resetMin")
    def reset_min(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMin", []))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="minInput")
    def min_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minInput"))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "max"))

    @max.setter
    def max(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__901af9667d95c3aa0158a36fab0f72f1d52b5afe4f32775fc430ea8c8cf9aa14)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__72159cae2cff0d7a2353693ff2899dc73319915f240537547e3c1631a2ec32f0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a8526e34d808405a2fbdcf5756c35c90f69126876486a8272ab361a41ad9b3e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__44956b1206ae4e83f82dd50c2c38f8efd71598662abcb68d67ecbb30cefe9157)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMibOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMibOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__99a9ba4d4fe26601d2f8d89b035c4b5d682463bb15fd5491baa3de49143bd753)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @jsii.member(jsii_name="resetMin")
    def reset_min(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMin", []))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="minInput")
    def min_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minInput"))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "max"))

    @max.setter
    def max(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__238be6f3c830a04c4b911d69ec01a3a1e2c1f902030221f6736f5ab4edcaf317)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__abbf044a348dc8c3990767b61ce45c00815886b6e0f90f9b0378d18c38668eab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06c2f7e3254dc8e55afdd7be9423da5265061dfd1911cd237f0ded48c50c6dba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__798054db504ffcc586194cf36bcce1574f8b6fbd6786ed2a96103bac5cc3c627)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c8c08bacfd64ac70d503771a4486fb8d1d99c6b36c333e580451b6b2cca7af19)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @jsii.member(jsii_name="resetMin")
    def reset_min(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMin", []))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="minInput")
    def min_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minInput"))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "max"))

    @max.setter
    def max(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__939ff7c4cc290cd3f4b0f65dc6602d1ab38b4d8d1f66eb82f9a6bf83e694017a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea6e5ffa7ef127f8a02256048a73d7a31bcb09ef106ecb1f5b46483e34530641)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__63b0c46b250fbceb47c6ff2cf0cdf18bbe49bdb364312fc79ce9f3851f28f5a3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3bb3e7658f035c9aacbb76eb16014a61e36a3621f490972a0e3de32d67761b73)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpuOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpuOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b9795f3b8e6c5b85e55033c7516c4cbf3d2efc668fee72b52bbf63b3132c1018)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @jsii.member(jsii_name="resetMin")
    def reset_min(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMin", []))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="minInput")
    def min_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minInput"))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "max"))

    @max.setter
    def max(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d84aa834c6efff28fb6d07fec91a08f3491b2c0af2586b979d370db18693410)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7308f1ae30683290b2edca5a6da41c9c2a8a9410f84765d38f13836fa6669fe0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7787ae8aedc7a285569a1822632b1fe8dff5fbd3b0f4593599f2cc09b7d587af)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib",
    jsii_struct_bases=[],
    name_mapping={"min": "min", "max": "max"},
)
class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib:
    def __init__(
        self,
        *,
        min: jsii.Number,
        max: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f09be6cf396ca9fef1906c48371894a69ef43dbd1ba88f4b407c3b9768ca3ed3)
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "min": min,
        }
        if max is not None:
            self._values["max"] = max

    @builtins.property
    def min(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.'''
        result = self._values.get("min")
        assert result is not None, "Required property 'min' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMibOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMibOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a1a8cf42ad6af63ddec8494282f86b81bc33f3ebb4d6fd6444d83b5e6e6de477)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="minInput")
    def min_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minInput"))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "max"))

    @max.setter
    def max(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8abe8bc0da44ae729509d57d65f3132e9ab183e82286d432e1f48fcc0d2eb0bb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4836a86f0e8e8189b8e1040c415ee2c7abaafb39e6f0caef904bedfbdd025165)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e754be8d60e0627d0c44aba6c9345e1a4446c08ed9bc695add5c5877fe5e903d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c9e3377314d55123253e643d92becfbaa0ec282cd3f3853aa21380b8c85d60fa)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbpsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbpsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c54fdee673d46089a67e3a4a4b371760a4af792e3cc9ce019da5a1ef6ef409f8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @jsii.member(jsii_name="resetMin")
    def reset_min(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMin", []))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="minInput")
    def min_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minInput"))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "max"))

    @max.setter
    def max(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96d55630e954cc8c470594334b1bb3b48e4d2a8164072e7b10b6f92aaa126b46)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a95d8c58d5c83c4537394022b985e0e3eaeed7169204a16b2ee614eff477fed1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d4cb73012ea3499c1077e7b2b0b804037c8ec6d3f693a0c29be7d84608de4892)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d465787d3465a2f20977a79a1ec32b906759e8f81a47e70a526936f3cd0b9c2)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCountOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCountOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__707e7cd0a009868cca84d61e027c1db83f29d0ff05d7568c07dfa4269df871ea)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @jsii.member(jsii_name="resetMin")
    def reset_min(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMin", []))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="minInput")
    def min_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minInput"))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "max"))

    @max.setter
    def max(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__165fb2e079d0899204984460d071d5f58085f8d81dbb73f4eac2d012fd58bdf5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e6547ea30f11adec1ab601b84cec34f9a25f0fe82109505146bdf04da3803bc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__036b3099e26bbec2b0a46855a80fab475a69a05428d1117afdcb98288de645bb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4b7ee2c3b836277f1002ae37aba5c4a2a3daffe63507b713c1b444904a6c1427)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAcceleratorCount")
    def put_accelerator_count(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        value = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount(
            max=max, min=min
        )

        return typing.cast(None, jsii.invoke(self, "putAcceleratorCount", [value]))

    @jsii.member(jsii_name="putAcceleratorTotalMemoryMib")
    def put_accelerator_total_memory_mib(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        value = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib(
            max=max, min=min
        )

        return typing.cast(None, jsii.invoke(self, "putAcceleratorTotalMemoryMib", [value]))

    @jsii.member(jsii_name="putBaselineEbsBandwidthMbps")
    def put_baseline_ebs_bandwidth_mbps(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        value = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps(
            max=max, min=min
        )

        return typing.cast(None, jsii.invoke(self, "putBaselineEbsBandwidthMbps", [value]))

    @jsii.member(jsii_name="putMemoryGibPerVcpu")
    def put_memory_gib_per_vcpu(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        value = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu(
            max=max, min=min
        )

        return typing.cast(None, jsii.invoke(self, "putMemoryGibPerVcpu", [value]))

    @jsii.member(jsii_name="putMemoryMib")
    def put_memory_mib(
        self,
        *,
        min: jsii.Number,
        max: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        '''
        value = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib(
            min=min, max=max
        )

        return typing.cast(None, jsii.invoke(self, "putMemoryMib", [value]))

    @jsii.member(jsii_name="putNetworkBandwidthGbps")
    def put_network_bandwidth_gbps(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        value = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps(
            max=max, min=min
        )

        return typing.cast(None, jsii.invoke(self, "putNetworkBandwidthGbps", [value]))

    @jsii.member(jsii_name="putNetworkInterfaceCount")
    def put_network_interface_count(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        value = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount(
            max=max, min=min
        )

        return typing.cast(None, jsii.invoke(self, "putNetworkInterfaceCount", [value]))

    @jsii.member(jsii_name="putTotalLocalStorageGb")
    def put_total_local_storage_gb(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        value = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb(
            max=max, min=min
        )

        return typing.cast(None, jsii.invoke(self, "putTotalLocalStorageGb", [value]))

    @jsii.member(jsii_name="putVcpuCount")
    def put_vcpu_count(
        self,
        *,
        min: jsii.Number,
        max: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        '''
        value = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount(
            min=min, max=max
        )

        return typing.cast(None, jsii.invoke(self, "putVcpuCount", [value]))

    @jsii.member(jsii_name="resetAcceleratorCount")
    def reset_accelerator_count(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAcceleratorCount", []))

    @jsii.member(jsii_name="resetAcceleratorManufacturers")
    def reset_accelerator_manufacturers(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAcceleratorManufacturers", []))

    @jsii.member(jsii_name="resetAcceleratorNames")
    def reset_accelerator_names(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAcceleratorNames", []))

    @jsii.member(jsii_name="resetAcceleratorTotalMemoryMib")
    def reset_accelerator_total_memory_mib(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAcceleratorTotalMemoryMib", []))

    @jsii.member(jsii_name="resetAcceleratorTypes")
    def reset_accelerator_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAcceleratorTypes", []))

    @jsii.member(jsii_name="resetAllowedInstanceTypes")
    def reset_allowed_instance_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllowedInstanceTypes", []))

    @jsii.member(jsii_name="resetBareMetal")
    def reset_bare_metal(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBareMetal", []))

    @jsii.member(jsii_name="resetBaselineEbsBandwidthMbps")
    def reset_baseline_ebs_bandwidth_mbps(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBaselineEbsBandwidthMbps", []))

    @jsii.member(jsii_name="resetBurstablePerformance")
    def reset_burstable_performance(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBurstablePerformance", []))

    @jsii.member(jsii_name="resetCpuManufacturers")
    def reset_cpu_manufacturers(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCpuManufacturers", []))

    @jsii.member(jsii_name="resetExcludedInstanceTypes")
    def reset_excluded_instance_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExcludedInstanceTypes", []))

    @jsii.member(jsii_name="resetInstanceGenerations")
    def reset_instance_generations(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceGenerations", []))

    @jsii.member(jsii_name="resetLocalStorage")
    def reset_local_storage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLocalStorage", []))

    @jsii.member(jsii_name="resetLocalStorageTypes")
    def reset_local_storage_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLocalStorageTypes", []))

    @jsii.member(jsii_name="resetMaxSpotPriceAsPercentageOfOptimalOnDemandPrice")
    def reset_max_spot_price_as_percentage_of_optimal_on_demand_price(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxSpotPriceAsPercentageOfOptimalOnDemandPrice", []))

    @jsii.member(jsii_name="resetMemoryGibPerVcpu")
    def reset_memory_gib_per_vcpu(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMemoryGibPerVcpu", []))

    @jsii.member(jsii_name="resetNetworkBandwidthGbps")
    def reset_network_bandwidth_gbps(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNetworkBandwidthGbps", []))

    @jsii.member(jsii_name="resetNetworkInterfaceCount")
    def reset_network_interface_count(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNetworkInterfaceCount", []))

    @jsii.member(jsii_name="resetOnDemandMaxPricePercentageOverLowestPrice")
    def reset_on_demand_max_price_percentage_over_lowest_price(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnDemandMaxPricePercentageOverLowestPrice", []))

    @jsii.member(jsii_name="resetRequireHibernateSupport")
    def reset_require_hibernate_support(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRequireHibernateSupport", []))

    @jsii.member(jsii_name="resetSpotMaxPricePercentageOverLowestPrice")
    def reset_spot_max_price_percentage_over_lowest_price(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSpotMaxPricePercentageOverLowestPrice", []))

    @jsii.member(jsii_name="resetTotalLocalStorageGb")
    def reset_total_local_storage_gb(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTotalLocalStorageGb", []))

    @builtins.property
    @jsii.member(jsii_name="acceleratorCount")
    def accelerator_count(
        self,
    ) -> Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCountOutputReference:
        return typing.cast(Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCountOutputReference, jsii.get(self, "acceleratorCount"))

    @builtins.property
    @jsii.member(jsii_name="acceleratorTotalMemoryMib")
    def accelerator_total_memory_mib(
        self,
    ) -> Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMibOutputReference:
        return typing.cast(Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMibOutputReference, jsii.get(self, "acceleratorTotalMemoryMib"))

    @builtins.property
    @jsii.member(jsii_name="baselineEbsBandwidthMbps")
    def baseline_ebs_bandwidth_mbps(
        self,
    ) -> Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference:
        return typing.cast(Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference, jsii.get(self, "baselineEbsBandwidthMbps"))

    @builtins.property
    @jsii.member(jsii_name="memoryGibPerVcpu")
    def memory_gib_per_vcpu(
        self,
    ) -> Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpuOutputReference:
        return typing.cast(Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpuOutputReference, jsii.get(self, "memoryGibPerVcpu"))

    @builtins.property
    @jsii.member(jsii_name="memoryMib")
    def memory_mib(
        self,
    ) -> Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMibOutputReference:
        return typing.cast(Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMibOutputReference, jsii.get(self, "memoryMib"))

    @builtins.property
    @jsii.member(jsii_name="networkBandwidthGbps")
    def network_bandwidth_gbps(
        self,
    ) -> Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbpsOutputReference:
        return typing.cast(Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbpsOutputReference, jsii.get(self, "networkBandwidthGbps"))

    @builtins.property
    @jsii.member(jsii_name="networkInterfaceCount")
    def network_interface_count(
        self,
    ) -> Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCountOutputReference:
        return typing.cast(Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCountOutputReference, jsii.get(self, "networkInterfaceCount"))

    @builtins.property
    @jsii.member(jsii_name="totalLocalStorageGb")
    def total_local_storage_gb(
        self,
    ) -> "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGbOutputReference":
        return typing.cast("Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGbOutputReference", jsii.get(self, "totalLocalStorageGb"))

    @builtins.property
    @jsii.member(jsii_name="vcpuCount")
    def vcpu_count(
        self,
    ) -> "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCountOutputReference":
        return typing.cast("Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCountOutputReference", jsii.get(self, "vcpuCount"))

    @builtins.property
    @jsii.member(jsii_name="acceleratorCountInput")
    def accelerator_count_input(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount], jsii.get(self, "acceleratorCountInput"))

    @builtins.property
    @jsii.member(jsii_name="acceleratorManufacturersInput")
    def accelerator_manufacturers_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "acceleratorManufacturersInput"))

    @builtins.property
    @jsii.member(jsii_name="acceleratorNamesInput")
    def accelerator_names_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "acceleratorNamesInput"))

    @builtins.property
    @jsii.member(jsii_name="acceleratorTotalMemoryMibInput")
    def accelerator_total_memory_mib_input(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib], jsii.get(self, "acceleratorTotalMemoryMibInput"))

    @builtins.property
    @jsii.member(jsii_name="acceleratorTypesInput")
    def accelerator_types_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "acceleratorTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="allowedInstanceTypesInput")
    def allowed_instance_types_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "allowedInstanceTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="bareMetalInput")
    def bare_metal_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bareMetalInput"))

    @builtins.property
    @jsii.member(jsii_name="baselineEbsBandwidthMbpsInput")
    def baseline_ebs_bandwidth_mbps_input(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps], jsii.get(self, "baselineEbsBandwidthMbpsInput"))

    @builtins.property
    @jsii.member(jsii_name="burstablePerformanceInput")
    def burstable_performance_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "burstablePerformanceInput"))

    @builtins.property
    @jsii.member(jsii_name="cpuManufacturersInput")
    def cpu_manufacturers_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "cpuManufacturersInput"))

    @builtins.property
    @jsii.member(jsii_name="excludedInstanceTypesInput")
    def excluded_instance_types_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "excludedInstanceTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceGenerationsInput")
    def instance_generations_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "instanceGenerationsInput"))

    @builtins.property
    @jsii.member(jsii_name="localStorageInput")
    def local_storage_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "localStorageInput"))

    @builtins.property
    @jsii.member(jsii_name="localStorageTypesInput")
    def local_storage_types_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "localStorageTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="maxSpotPriceAsPercentageOfOptimalOnDemandPriceInput")
    def max_spot_price_as_percentage_of_optimal_on_demand_price_input(
        self,
    ) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxSpotPriceAsPercentageOfOptimalOnDemandPriceInput"))

    @builtins.property
    @jsii.member(jsii_name="memoryGibPerVcpuInput")
    def memory_gib_per_vcpu_input(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu], jsii.get(self, "memoryGibPerVcpuInput"))

    @builtins.property
    @jsii.member(jsii_name="memoryMibInput")
    def memory_mib_input(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib], jsii.get(self, "memoryMibInput"))

    @builtins.property
    @jsii.member(jsii_name="networkBandwidthGbpsInput")
    def network_bandwidth_gbps_input(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps], jsii.get(self, "networkBandwidthGbpsInput"))

    @builtins.property
    @jsii.member(jsii_name="networkInterfaceCountInput")
    def network_interface_count_input(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount], jsii.get(self, "networkInterfaceCountInput"))

    @builtins.property
    @jsii.member(jsii_name="onDemandMaxPricePercentageOverLowestPriceInput")
    def on_demand_max_price_percentage_over_lowest_price_input(
        self,
    ) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "onDemandMaxPricePercentageOverLowestPriceInput"))

    @builtins.property
    @jsii.member(jsii_name="requireHibernateSupportInput")
    def require_hibernate_support_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "requireHibernateSupportInput"))

    @builtins.property
    @jsii.member(jsii_name="spotMaxPricePercentageOverLowestPriceInput")
    def spot_max_price_percentage_over_lowest_price_input(
        self,
    ) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "spotMaxPricePercentageOverLowestPriceInput"))

    @builtins.property
    @jsii.member(jsii_name="totalLocalStorageGbInput")
    def total_local_storage_gb_input(
        self,
    ) -> typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb"]:
        return typing.cast(typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb"], jsii.get(self, "totalLocalStorageGbInput"))

    @builtins.property
    @jsii.member(jsii_name="vcpuCountInput")
    def vcpu_count_input(
        self,
    ) -> typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount"]:
        return typing.cast(typing.Optional["Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount"], jsii.get(self, "vcpuCountInput"))

    @builtins.property
    @jsii.member(jsii_name="acceleratorManufacturers")
    def accelerator_manufacturers(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "acceleratorManufacturers"))

    @accelerator_manufacturers.setter
    def accelerator_manufacturers(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5de46fd25989f196729bbe9232bb99b2353494302789d5221c65f25c2265b868)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "acceleratorManufacturers", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="acceleratorNames")
    def accelerator_names(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "acceleratorNames"))

    @accelerator_names.setter
    def accelerator_names(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__29307d95a8515b061be38474b0a44d676df08d2c7d5370cf1882f60a6463a971)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "acceleratorNames", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="acceleratorTypes")
    def accelerator_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "acceleratorTypes"))

    @accelerator_types.setter
    def accelerator_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b71cc665a5f2b02cd371aec7488303df9dd8891c745dc7c9154769cc29ce0ada)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "acceleratorTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="allowedInstanceTypes")
    def allowed_instance_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "allowedInstanceTypes"))

    @allowed_instance_types.setter
    def allowed_instance_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ad0095525c04bbc335adbc5a747f2dbf66733ed3990610826dd3e1e159c4d33d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "allowedInstanceTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="bareMetal")
    def bare_metal(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bareMetal"))

    @bare_metal.setter
    def bare_metal(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__059500df115aef488331b4aa273e2c33850febdfcd89bc1ed0240ac2d216adc2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bareMetal", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="burstablePerformance")
    def burstable_performance(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "burstablePerformance"))

    @burstable_performance.setter
    def burstable_performance(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12996e08161806f33071d58a36530a7861ca7d871c8866ba7de86d51dc5febae)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "burstablePerformance", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="cpuManufacturers")
    def cpu_manufacturers(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "cpuManufacturers"))

    @cpu_manufacturers.setter
    def cpu_manufacturers(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1505082473a138549e576ca358fb05ebbc6a0cb3c317a4ece36a86d321705ccf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cpuManufacturers", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="excludedInstanceTypes")
    def excluded_instance_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "excludedInstanceTypes"))

    @excluded_instance_types.setter
    def excluded_instance_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d0e54e6596e53501aa90fda2155b6d65b311bb62ed1c4423f7e34e549934ee78)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "excludedInstanceTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="instanceGenerations")
    def instance_generations(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "instanceGenerations"))

    @instance_generations.setter
    def instance_generations(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1249b69c21719288c53c7a1a618848eeabfcbe6114d6f8fb895e60b4e8d2c40d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceGenerations", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="localStorage")
    def local_storage(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "localStorage"))

    @local_storage.setter
    def local_storage(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ecb19412ae58eeab5718df51a21f5cb1ba4795a64ae35978b1726728ba69b079)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "localStorage", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="localStorageTypes")
    def local_storage_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "localStorageTypes"))

    @local_storage_types.setter
    def local_storage_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b9e913f2c3c713e046c7f92cab06c4188d1fb57e5c39161728da8171404345d3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "localStorageTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxSpotPriceAsPercentageOfOptimalOnDemandPrice")
    def max_spot_price_as_percentage_of_optimal_on_demand_price(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxSpotPriceAsPercentageOfOptimalOnDemandPrice"))

    @max_spot_price_as_percentage_of_optimal_on_demand_price.setter
    def max_spot_price_as_percentage_of_optimal_on_demand_price(
        self,
        value: jsii.Number,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__29178c12a3feef5876f55ca715cc9cb8b67d80e5790411fed511bb29946fe262)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxSpotPriceAsPercentageOfOptimalOnDemandPrice", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onDemandMaxPricePercentageOverLowestPrice")
    def on_demand_max_price_percentage_over_lowest_price(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "onDemandMaxPricePercentageOverLowestPrice"))

    @on_demand_max_price_percentage_over_lowest_price.setter
    def on_demand_max_price_percentage_over_lowest_price(
        self,
        value: jsii.Number,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6f0e27c4104c7c5c8b8c8bc548e409bd2170f646e8e5716b83db7fa497cc1bc7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onDemandMaxPricePercentageOverLowestPrice", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="requireHibernateSupport")
    def require_hibernate_support(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "requireHibernateSupport"))

    @require_hibernate_support.setter
    def require_hibernate_support(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ab7f1fc96dc2f83408928de3b334b40f5318f8787cc57d059f67a1b84827c07)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "requireHibernateSupport", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="spotMaxPricePercentageOverLowestPrice")
    def spot_max_price_percentage_over_lowest_price(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "spotMaxPricePercentageOverLowestPrice"))

    @spot_max_price_percentage_over_lowest_price.setter
    def spot_max_price_percentage_over_lowest_price(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a40a7f403790fbc4354b4a97ca114e0d3a8efddb5835caa0e63f494c2cdaef3f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "spotMaxPricePercentageOverLowestPrice", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d771e843264f0eab3c6b08497e63e5669940dada8c813a5a919797dcda9449b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__71d4b2aa6a36c4fef1b47e98df91e0d4435ce6cfde6a419e69a343b81b52fa82)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGbOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGbOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b30fe4f23c972d5a6d1b591341cfe3344237c589fbbd2bfda96c34de5df391c2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @jsii.member(jsii_name="resetMin")
    def reset_min(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMin", []))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="minInput")
    def min_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minInput"))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "max"))

    @max.setter
    def max(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__923eea7048d0cef3834230c434cefd62790e6a2faab8b754bc3fbb34615b9841)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b53a391f34fd049dfc1fe728ceb1833347f944c6cbee00b2b59a4a375f06fa4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__308593cebf3e0bb60ed73929f8038851de553b9dead7af6d10598a19b8bbc0a9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount",
    jsii_struct_bases=[],
    name_mapping={"min": "min", "max": "max"},
)
class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount:
    def __init__(
        self,
        *,
        min: jsii.Number,
        max: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01a5b8ed2c6a94597577672880da8bdb482201e1e5ab6afb0263ffadb4108a2b)
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "min": min,
        }
        if max is not None:
            self._values["max"] = max

    @builtins.property
    def min(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.'''
        result = self._values.get("min")
        assert result is not None, "Required property 'min' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCountOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCountOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0a60423c23e4a5f49ceb63b9cc5f97867845df437a35c75b2507e8c5e9759edf)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMax")
    def reset_max(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMax", []))

    @builtins.property
    @jsii.member(jsii_name="maxInput")
    def max_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxInput"))

    @builtins.property
    @jsii.member(jsii_name="minInput")
    def min_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minInput"))

    @builtins.property
    @jsii.member(jsii_name="max")
    def max(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "max"))

    @max.setter
    def max(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e6b1897bd80d6563b112120a9591a088773372f2bb2810953504255abfb01df)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5324a955a7c1f5fb02966cdba4d796a7bdae32bbd514f3e9dd54bde777db6f8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__65dfe22b76ff06da9624c6f4ff8e17e98e63936882760bc1a53dbfb8e7175f7c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Ec2FleetLaunchTemplateConfigOverrideList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7f1d6bf951d1cc33d071169c2bd1b907042c7553a7622413a021a922972b900a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Ec2FleetLaunchTemplateConfigOverrideOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b3209f25ac1a5d8a3248a05a82bde7ac9c877d2b3b4319f4bed0ca9c222e7ef)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Ec2FleetLaunchTemplateConfigOverrideOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__440c458ae8b9b43f7c42342969e746da8bc56a83100f03c2a8f56aab87404729)
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
            type_hints = typing.get_type_hints(_typecheckingstub__82caa6bf8477b09e310c3dd48bbb3330f1e16cde25b6a11d8ae18eac1f8e06e8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7b00309a8f85f1f048a452b820d1108565e81944ad8eaed6f30d02f17bc82cbb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Ec2FleetLaunchTemplateConfigOverride]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Ec2FleetLaunchTemplateConfigOverride]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Ec2FleetLaunchTemplateConfigOverride]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa6ada24b272546fac4531866983bfd346818bf470ca68037e7690bfdac40551)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Ec2FleetLaunchTemplateConfigOverrideOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4a0849cc7588e65dec7d1e8a1ef29e054c3be95852ec894ed9ece2e518409584)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putInstanceRequirements")
    def put_instance_requirements(
        self,
        *,
        memory_mib: typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib, typing.Dict[builtins.str, typing.Any]],
        vcpu_count: typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount, typing.Dict[builtins.str, typing.Any]],
        accelerator_count: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount, typing.Dict[builtins.str, typing.Any]]] = None,
        accelerator_manufacturers: typing.Optional[typing.Sequence[builtins.str]] = None,
        accelerator_names: typing.Optional[typing.Sequence[builtins.str]] = None,
        accelerator_total_memory_mib: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib, typing.Dict[builtins.str, typing.Any]]] = None,
        accelerator_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        allowed_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        bare_metal: typing.Optional[builtins.str] = None,
        baseline_ebs_bandwidth_mbps: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps, typing.Dict[builtins.str, typing.Any]]] = None,
        burstable_performance: typing.Optional[builtins.str] = None,
        cpu_manufacturers: typing.Optional[typing.Sequence[builtins.str]] = None,
        excluded_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        instance_generations: typing.Optional[typing.Sequence[builtins.str]] = None,
        local_storage: typing.Optional[builtins.str] = None,
        local_storage_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        max_spot_price_as_percentage_of_optimal_on_demand_price: typing.Optional[jsii.Number] = None,
        memory_gib_per_vcpu: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu, typing.Dict[builtins.str, typing.Any]]] = None,
        network_bandwidth_gbps: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps, typing.Dict[builtins.str, typing.Any]]] = None,
        network_interface_count: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount, typing.Dict[builtins.str, typing.Any]]] = None,
        on_demand_max_price_percentage_over_lowest_price: typing.Optional[jsii.Number] = None,
        require_hibernate_support: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        spot_max_price_percentage_over_lowest_price: typing.Optional[jsii.Number] = None,
        total_local_storage_gb: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param memory_mib: memory_mib block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#memory_mib Ec2Fleet#memory_mib}
        :param vcpu_count: vcpu_count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#vcpu_count Ec2Fleet#vcpu_count}
        :param accelerator_count: accelerator_count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_count Ec2Fleet#accelerator_count}
        :param accelerator_manufacturers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_manufacturers Ec2Fleet#accelerator_manufacturers}.
        :param accelerator_names: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_names Ec2Fleet#accelerator_names}.
        :param accelerator_total_memory_mib: accelerator_total_memory_mib block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_total_memory_mib Ec2Fleet#accelerator_total_memory_mib}
        :param accelerator_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_types Ec2Fleet#accelerator_types}.
        :param allowed_instance_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allowed_instance_types Ec2Fleet#allowed_instance_types}.
        :param bare_metal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#bare_metal Ec2Fleet#bare_metal}.
        :param baseline_ebs_bandwidth_mbps: baseline_ebs_bandwidth_mbps block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#baseline_ebs_bandwidth_mbps Ec2Fleet#baseline_ebs_bandwidth_mbps}
        :param burstable_performance: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#burstable_performance Ec2Fleet#burstable_performance}.
        :param cpu_manufacturers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#cpu_manufacturers Ec2Fleet#cpu_manufacturers}.
        :param excluded_instance_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#excluded_instance_types Ec2Fleet#excluded_instance_types}.
        :param instance_generations: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_generations Ec2Fleet#instance_generations}.
        :param local_storage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#local_storage Ec2Fleet#local_storage}.
        :param local_storage_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#local_storage_types Ec2Fleet#local_storage_types}.
        :param max_spot_price_as_percentage_of_optimal_on_demand_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_spot_price_as_percentage_of_optimal_on_demand_price Ec2Fleet#max_spot_price_as_percentage_of_optimal_on_demand_price}.
        :param memory_gib_per_vcpu: memory_gib_per_vcpu block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#memory_gib_per_vcpu Ec2Fleet#memory_gib_per_vcpu}
        :param network_bandwidth_gbps: network_bandwidth_gbps block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#network_bandwidth_gbps Ec2Fleet#network_bandwidth_gbps}
        :param network_interface_count: network_interface_count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#network_interface_count Ec2Fleet#network_interface_count}
        :param on_demand_max_price_percentage_over_lowest_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_max_price_percentage_over_lowest_price Ec2Fleet#on_demand_max_price_percentage_over_lowest_price}.
        :param require_hibernate_support: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#require_hibernate_support Ec2Fleet#require_hibernate_support}.
        :param spot_max_price_percentage_over_lowest_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_max_price_percentage_over_lowest_price Ec2Fleet#spot_max_price_percentage_over_lowest_price}.
        :param total_local_storage_gb: total_local_storage_gb block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#total_local_storage_gb Ec2Fleet#total_local_storage_gb}
        '''
        value = Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements(
            memory_mib=memory_mib,
            vcpu_count=vcpu_count,
            accelerator_count=accelerator_count,
            accelerator_manufacturers=accelerator_manufacturers,
            accelerator_names=accelerator_names,
            accelerator_total_memory_mib=accelerator_total_memory_mib,
            accelerator_types=accelerator_types,
            allowed_instance_types=allowed_instance_types,
            bare_metal=bare_metal,
            baseline_ebs_bandwidth_mbps=baseline_ebs_bandwidth_mbps,
            burstable_performance=burstable_performance,
            cpu_manufacturers=cpu_manufacturers,
            excluded_instance_types=excluded_instance_types,
            instance_generations=instance_generations,
            local_storage=local_storage,
            local_storage_types=local_storage_types,
            max_spot_price_as_percentage_of_optimal_on_demand_price=max_spot_price_as_percentage_of_optimal_on_demand_price,
            memory_gib_per_vcpu=memory_gib_per_vcpu,
            network_bandwidth_gbps=network_bandwidth_gbps,
            network_interface_count=network_interface_count,
            on_demand_max_price_percentage_over_lowest_price=on_demand_max_price_percentage_over_lowest_price,
            require_hibernate_support=require_hibernate_support,
            spot_max_price_percentage_over_lowest_price=spot_max_price_percentage_over_lowest_price,
            total_local_storage_gb=total_local_storage_gb,
        )

        return typing.cast(None, jsii.invoke(self, "putInstanceRequirements", [value]))

    @jsii.member(jsii_name="resetAvailabilityZone")
    def reset_availability_zone(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityZone", []))

    @jsii.member(jsii_name="resetInstanceRequirements")
    def reset_instance_requirements(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceRequirements", []))

    @jsii.member(jsii_name="resetInstanceType")
    def reset_instance_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceType", []))

    @jsii.member(jsii_name="resetMaxPrice")
    def reset_max_price(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxPrice", []))

    @jsii.member(jsii_name="resetPriority")
    def reset_priority(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPriority", []))

    @jsii.member(jsii_name="resetSubnetId")
    def reset_subnet_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSubnetId", []))

    @jsii.member(jsii_name="resetWeightedCapacity")
    def reset_weighted_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWeightedCapacity", []))

    @builtins.property
    @jsii.member(jsii_name="instanceRequirements")
    def instance_requirements(
        self,
    ) -> Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsOutputReference:
        return typing.cast(Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsOutputReference, jsii.get(self, "instanceRequirements"))

    @builtins.property
    @jsii.member(jsii_name="availabilityZoneInput")
    def availability_zone_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "availabilityZoneInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceRequirementsInput")
    def instance_requirements_input(
        self,
    ) -> typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements]:
        return typing.cast(typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements], jsii.get(self, "instanceRequirementsInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceTypeInput")
    def instance_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "instanceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="maxPriceInput")
    def max_price_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "maxPriceInput"))

    @builtins.property
    @jsii.member(jsii_name="priorityInput")
    def priority_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "priorityInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetIdInput")
    def subnet_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "subnetIdInput"))

    @builtins.property
    @jsii.member(jsii_name="weightedCapacityInput")
    def weighted_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "weightedCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityZone")
    def availability_zone(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "availabilityZone"))

    @availability_zone.setter
    def availability_zone(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8defbab6900c61e4820cdaf12b525f9523e4c1bc386bcb06acbbd2ddad1d7d03)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityZone", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="instanceType")
    def instance_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "instanceType"))

    @instance_type.setter
    def instance_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db75fdb141058231dde4925c8ac4fa37773f6302f50f0a818889b2fd11e1cfc4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxPrice")
    def max_price(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "maxPrice"))

    @max_price.setter
    def max_price(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9ac4cf413556d5f924a72f57dbedb228cc94a74c603e41b270486fad06053f2c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxPrice", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="priority")
    def priority(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "priority"))

    @priority.setter
    def priority(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__567ce2a6c5f16ebaa7686514599e43073fa6145bba848c2e6f5ed32da4f3f9d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "priority", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnetId")
    def subnet_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "subnetId"))

    @subnet_id.setter
    def subnet_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2947ebc776d1fabeb37fca5b0ef4f152db92d117c6def670f5258379aff25b45)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnetId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="weightedCapacity")
    def weighted_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "weightedCapacity"))

    @weighted_capacity.setter
    def weighted_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01998afb616e3680d4ce7b5cdbe35eb2cbf208d2f4bd8faac9108b148f73bcef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "weightedCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetLaunchTemplateConfigOverride]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetLaunchTemplateConfigOverride]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetLaunchTemplateConfigOverride]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__feb4ab01a85982733bfbdc152c6bcdf2e980faf059bf3a0445aa6af61b1b2441)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetOnDemandOptions",
    jsii_struct_bases=[],
    name_mapping={
        "allocation_strategy": "allocationStrategy",
        "capacity_reservation_options": "capacityReservationOptions",
        "max_total_price": "maxTotalPrice",
        "min_target_capacity": "minTargetCapacity",
        "single_availability_zone": "singleAvailabilityZone",
        "single_instance_type": "singleInstanceType",
    },
)
class Ec2FleetOnDemandOptions:
    def __init__(
        self,
        *,
        allocation_strategy: typing.Optional[builtins.str] = None,
        capacity_reservation_options: typing.Optional[typing.Union["Ec2FleetOnDemandOptionsCapacityReservationOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        max_total_price: typing.Optional[builtins.str] = None,
        min_target_capacity: typing.Optional[jsii.Number] = None,
        single_availability_zone: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        single_instance_type: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param allocation_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allocation_strategy Ec2Fleet#allocation_strategy}.
        :param capacity_reservation_options: capacity_reservation_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#capacity_reservation_options Ec2Fleet#capacity_reservation_options}
        :param max_total_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_total_price Ec2Fleet#max_total_price}.
        :param min_target_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min_target_capacity Ec2Fleet#min_target_capacity}.
        :param single_availability_zone: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_availability_zone Ec2Fleet#single_availability_zone}.
        :param single_instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_instance_type Ec2Fleet#single_instance_type}.
        '''
        if isinstance(capacity_reservation_options, dict):
            capacity_reservation_options = Ec2FleetOnDemandOptionsCapacityReservationOptions(**capacity_reservation_options)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d7b1aeca6b1dad20e8d0b6c5548eb61fdc5f043c426f8b9c0b8d59f0e3f2f0a)
            check_type(argname="argument allocation_strategy", value=allocation_strategy, expected_type=type_hints["allocation_strategy"])
            check_type(argname="argument capacity_reservation_options", value=capacity_reservation_options, expected_type=type_hints["capacity_reservation_options"])
            check_type(argname="argument max_total_price", value=max_total_price, expected_type=type_hints["max_total_price"])
            check_type(argname="argument min_target_capacity", value=min_target_capacity, expected_type=type_hints["min_target_capacity"])
            check_type(argname="argument single_availability_zone", value=single_availability_zone, expected_type=type_hints["single_availability_zone"])
            check_type(argname="argument single_instance_type", value=single_instance_type, expected_type=type_hints["single_instance_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if allocation_strategy is not None:
            self._values["allocation_strategy"] = allocation_strategy
        if capacity_reservation_options is not None:
            self._values["capacity_reservation_options"] = capacity_reservation_options
        if max_total_price is not None:
            self._values["max_total_price"] = max_total_price
        if min_target_capacity is not None:
            self._values["min_target_capacity"] = min_target_capacity
        if single_availability_zone is not None:
            self._values["single_availability_zone"] = single_availability_zone
        if single_instance_type is not None:
            self._values["single_instance_type"] = single_instance_type

    @builtins.property
    def allocation_strategy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allocation_strategy Ec2Fleet#allocation_strategy}.'''
        result = self._values.get("allocation_strategy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def capacity_reservation_options(
        self,
    ) -> typing.Optional["Ec2FleetOnDemandOptionsCapacityReservationOptions"]:
        '''capacity_reservation_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#capacity_reservation_options Ec2Fleet#capacity_reservation_options}
        '''
        result = self._values.get("capacity_reservation_options")
        return typing.cast(typing.Optional["Ec2FleetOnDemandOptionsCapacityReservationOptions"], result)

    @builtins.property
    def max_total_price(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_total_price Ec2Fleet#max_total_price}.'''
        result = self._values.get("max_total_price")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def min_target_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min_target_capacity Ec2Fleet#min_target_capacity}.'''
        result = self._values.get("min_target_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def single_availability_zone(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_availability_zone Ec2Fleet#single_availability_zone}.'''
        result = self._values.get("single_availability_zone")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def single_instance_type(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_instance_type Ec2Fleet#single_instance_type}.'''
        result = self._values.get("single_instance_type")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetOnDemandOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions",
    jsii_struct_bases=[],
    name_mapping={"usage_strategy": "usageStrategy"},
)
class Ec2FleetOnDemandOptionsCapacityReservationOptions:
    def __init__(self, *, usage_strategy: typing.Optional[builtins.str] = None) -> None:
        '''
        :param usage_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#usage_strategy Ec2Fleet#usage_strategy}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4834214e08ad44b3784975df976e8c07b3f21ffc15fc2c3a0bd28b33a2889cf3)
            check_type(argname="argument usage_strategy", value=usage_strategy, expected_type=type_hints["usage_strategy"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if usage_strategy is not None:
            self._values["usage_strategy"] = usage_strategy

    @builtins.property
    def usage_strategy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#usage_strategy Ec2Fleet#usage_strategy}.'''
        result = self._values.get("usage_strategy")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetOnDemandOptionsCapacityReservationOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetOnDemandOptionsCapacityReservationOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetOnDemandOptionsCapacityReservationOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c3de875e5f2e7e3a5d1feed940bb6213d2fdae4b9885847e4ae401da4ababb0d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetUsageStrategy")
    def reset_usage_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUsageStrategy", []))

    @builtins.property
    @jsii.member(jsii_name="usageStrategyInput")
    def usage_strategy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "usageStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="usageStrategy")
    def usage_strategy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "usageStrategy"))

    @usage_strategy.setter
    def usage_strategy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f4a4cb37a6efa1d1ae3ed9575b258bf9912f208e37f8a9b4ebcf6320ef79559)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "usageStrategy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetOnDemandOptionsCapacityReservationOptions]:
        return typing.cast(typing.Optional[Ec2FleetOnDemandOptionsCapacityReservationOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetOnDemandOptionsCapacityReservationOptions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__712d0f3bae33e90ce024687eac56aaa2fde08571e9ecd5dc0d08d00e6e6fd541)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Ec2FleetOnDemandOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetOnDemandOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__627f724a25c06391ea5025d713987c4119f5d1fe973b6adf946de0658f7eec3d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCapacityReservationOptions")
    def put_capacity_reservation_options(
        self,
        *,
        usage_strategy: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param usage_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#usage_strategy Ec2Fleet#usage_strategy}.
        '''
        value = Ec2FleetOnDemandOptionsCapacityReservationOptions(
            usage_strategy=usage_strategy
        )

        return typing.cast(None, jsii.invoke(self, "putCapacityReservationOptions", [value]))

    @jsii.member(jsii_name="resetAllocationStrategy")
    def reset_allocation_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllocationStrategy", []))

    @jsii.member(jsii_name="resetCapacityReservationOptions")
    def reset_capacity_reservation_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCapacityReservationOptions", []))

    @jsii.member(jsii_name="resetMaxTotalPrice")
    def reset_max_total_price(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxTotalPrice", []))

    @jsii.member(jsii_name="resetMinTargetCapacity")
    def reset_min_target_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinTargetCapacity", []))

    @jsii.member(jsii_name="resetSingleAvailabilityZone")
    def reset_single_availability_zone(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSingleAvailabilityZone", []))

    @jsii.member(jsii_name="resetSingleInstanceType")
    def reset_single_instance_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSingleInstanceType", []))

    @builtins.property
    @jsii.member(jsii_name="capacityReservationOptions")
    def capacity_reservation_options(
        self,
    ) -> Ec2FleetOnDemandOptionsCapacityReservationOptionsOutputReference:
        return typing.cast(Ec2FleetOnDemandOptionsCapacityReservationOptionsOutputReference, jsii.get(self, "capacityReservationOptions"))

    @builtins.property
    @jsii.member(jsii_name="allocationStrategyInput")
    def allocation_strategy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "allocationStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="capacityReservationOptionsInput")
    def capacity_reservation_options_input(
        self,
    ) -> typing.Optional[Ec2FleetOnDemandOptionsCapacityReservationOptions]:
        return typing.cast(typing.Optional[Ec2FleetOnDemandOptionsCapacityReservationOptions], jsii.get(self, "capacityReservationOptionsInput"))

    @builtins.property
    @jsii.member(jsii_name="maxTotalPriceInput")
    def max_total_price_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "maxTotalPriceInput"))

    @builtins.property
    @jsii.member(jsii_name="minTargetCapacityInput")
    def min_target_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minTargetCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="singleAvailabilityZoneInput")
    def single_availability_zone_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "singleAvailabilityZoneInput"))

    @builtins.property
    @jsii.member(jsii_name="singleInstanceTypeInput")
    def single_instance_type_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "singleInstanceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="allocationStrategy")
    def allocation_strategy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "allocationStrategy"))

    @allocation_strategy.setter
    def allocation_strategy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fdafb7bfb3923390299eb3205a318908300485fa109a2acbbca69f5721fe7137)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "allocationStrategy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxTotalPrice")
    def max_total_price(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "maxTotalPrice"))

    @max_total_price.setter
    def max_total_price(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__330cbc258b9fea5e356ff05fdb25cfba9d97e1d3a4f80c992161bdf52a00c0cd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxTotalPrice", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minTargetCapacity")
    def min_target_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minTargetCapacity"))

    @min_target_capacity.setter
    def min_target_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96fa1c00cedac7a17a136434a0c46e0a2a551f47a29501680d9a70f1a5f26ff6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minTargetCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="singleAvailabilityZone")
    def single_availability_zone(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "singleAvailabilityZone"))

    @single_availability_zone.setter
    def single_availability_zone(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e1f9626f6fea46baf39a8c979a64a14b2ca82adc9a42731f490a74fb486a90a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "singleAvailabilityZone", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="singleInstanceType")
    def single_instance_type(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "singleInstanceType"))

    @single_instance_type.setter
    def single_instance_type(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56233bdcc0912028d864f78807d7f806352bc7a3a59672d06c5a7cda694acf6f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "singleInstanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Ec2FleetOnDemandOptions]:
        return typing.cast(typing.Optional[Ec2FleetOnDemandOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[Ec2FleetOnDemandOptions]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15e6b072fc178b54757266393a2b67db9f4f129902ed5f426e61ba3f0cf75fdf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetSpotOptions",
    jsii_struct_bases=[],
    name_mapping={
        "allocation_strategy": "allocationStrategy",
        "instance_interruption_behavior": "instanceInterruptionBehavior",
        "instance_pools_to_use_count": "instancePoolsToUseCount",
        "maintenance_strategies": "maintenanceStrategies",
        "max_total_price": "maxTotalPrice",
        "min_target_capacity": "minTargetCapacity",
        "single_availability_zone": "singleAvailabilityZone",
        "single_instance_type": "singleInstanceType",
    },
)
class Ec2FleetSpotOptions:
    def __init__(
        self,
        *,
        allocation_strategy: typing.Optional[builtins.str] = None,
        instance_interruption_behavior: typing.Optional[builtins.str] = None,
        instance_pools_to_use_count: typing.Optional[jsii.Number] = None,
        maintenance_strategies: typing.Optional[typing.Union["Ec2FleetSpotOptionsMaintenanceStrategies", typing.Dict[builtins.str, typing.Any]]] = None,
        max_total_price: typing.Optional[builtins.str] = None,
        min_target_capacity: typing.Optional[jsii.Number] = None,
        single_availability_zone: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        single_instance_type: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param allocation_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allocation_strategy Ec2Fleet#allocation_strategy}.
        :param instance_interruption_behavior: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_interruption_behavior Ec2Fleet#instance_interruption_behavior}.
        :param instance_pools_to_use_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_pools_to_use_count Ec2Fleet#instance_pools_to_use_count}.
        :param maintenance_strategies: maintenance_strategies block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#maintenance_strategies Ec2Fleet#maintenance_strategies}
        :param max_total_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_total_price Ec2Fleet#max_total_price}.
        :param min_target_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min_target_capacity Ec2Fleet#min_target_capacity}.
        :param single_availability_zone: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_availability_zone Ec2Fleet#single_availability_zone}.
        :param single_instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_instance_type Ec2Fleet#single_instance_type}.
        '''
        if isinstance(maintenance_strategies, dict):
            maintenance_strategies = Ec2FleetSpotOptionsMaintenanceStrategies(**maintenance_strategies)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05c18cd65781d422c577059f5e7c0d7774fcea8c8244b4c584c723dc05621eee)
            check_type(argname="argument allocation_strategy", value=allocation_strategy, expected_type=type_hints["allocation_strategy"])
            check_type(argname="argument instance_interruption_behavior", value=instance_interruption_behavior, expected_type=type_hints["instance_interruption_behavior"])
            check_type(argname="argument instance_pools_to_use_count", value=instance_pools_to_use_count, expected_type=type_hints["instance_pools_to_use_count"])
            check_type(argname="argument maintenance_strategies", value=maintenance_strategies, expected_type=type_hints["maintenance_strategies"])
            check_type(argname="argument max_total_price", value=max_total_price, expected_type=type_hints["max_total_price"])
            check_type(argname="argument min_target_capacity", value=min_target_capacity, expected_type=type_hints["min_target_capacity"])
            check_type(argname="argument single_availability_zone", value=single_availability_zone, expected_type=type_hints["single_availability_zone"])
            check_type(argname="argument single_instance_type", value=single_instance_type, expected_type=type_hints["single_instance_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if allocation_strategy is not None:
            self._values["allocation_strategy"] = allocation_strategy
        if instance_interruption_behavior is not None:
            self._values["instance_interruption_behavior"] = instance_interruption_behavior
        if instance_pools_to_use_count is not None:
            self._values["instance_pools_to_use_count"] = instance_pools_to_use_count
        if maintenance_strategies is not None:
            self._values["maintenance_strategies"] = maintenance_strategies
        if max_total_price is not None:
            self._values["max_total_price"] = max_total_price
        if min_target_capacity is not None:
            self._values["min_target_capacity"] = min_target_capacity
        if single_availability_zone is not None:
            self._values["single_availability_zone"] = single_availability_zone
        if single_instance_type is not None:
            self._values["single_instance_type"] = single_instance_type

    @builtins.property
    def allocation_strategy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allocation_strategy Ec2Fleet#allocation_strategy}.'''
        result = self._values.get("allocation_strategy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def instance_interruption_behavior(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_interruption_behavior Ec2Fleet#instance_interruption_behavior}.'''
        result = self._values.get("instance_interruption_behavior")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def instance_pools_to_use_count(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_pools_to_use_count Ec2Fleet#instance_pools_to_use_count}.'''
        result = self._values.get("instance_pools_to_use_count")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def maintenance_strategies(
        self,
    ) -> typing.Optional["Ec2FleetSpotOptionsMaintenanceStrategies"]:
        '''maintenance_strategies block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#maintenance_strategies Ec2Fleet#maintenance_strategies}
        '''
        result = self._values.get("maintenance_strategies")
        return typing.cast(typing.Optional["Ec2FleetSpotOptionsMaintenanceStrategies"], result)

    @builtins.property
    def max_total_price(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_total_price Ec2Fleet#max_total_price}.'''
        result = self._values.get("max_total_price")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def min_target_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min_target_capacity Ec2Fleet#min_target_capacity}.'''
        result = self._values.get("min_target_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def single_availability_zone(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_availability_zone Ec2Fleet#single_availability_zone}.'''
        result = self._values.get("single_availability_zone")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def single_instance_type(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_instance_type Ec2Fleet#single_instance_type}.'''
        result = self._values.get("single_instance_type")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetSpotOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetSpotOptionsMaintenanceStrategies",
    jsii_struct_bases=[],
    name_mapping={"capacity_rebalance": "capacityRebalance"},
)
class Ec2FleetSpotOptionsMaintenanceStrategies:
    def __init__(
        self,
        *,
        capacity_rebalance: typing.Optional[typing.Union["Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param capacity_rebalance: capacity_rebalance block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#capacity_rebalance Ec2Fleet#capacity_rebalance}
        '''
        if isinstance(capacity_rebalance, dict):
            capacity_rebalance = Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance(**capacity_rebalance)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d93ff23762b23a07c8758932202f49eb2706f38543f6b11f4ef6d85f9476ad7)
            check_type(argname="argument capacity_rebalance", value=capacity_rebalance, expected_type=type_hints["capacity_rebalance"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if capacity_rebalance is not None:
            self._values["capacity_rebalance"] = capacity_rebalance

    @builtins.property
    def capacity_rebalance(
        self,
    ) -> typing.Optional["Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance"]:
        '''capacity_rebalance block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#capacity_rebalance Ec2Fleet#capacity_rebalance}
        '''
        result = self._values.get("capacity_rebalance")
        return typing.cast(typing.Optional["Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetSpotOptionsMaintenanceStrategies(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance",
    jsii_struct_bases=[],
    name_mapping={
        "replacement_strategy": "replacementStrategy",
        "termination_delay": "terminationDelay",
    },
)
class Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance:
    def __init__(
        self,
        *,
        replacement_strategy: typing.Optional[builtins.str] = None,
        termination_delay: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param replacement_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replacement_strategy Ec2Fleet#replacement_strategy}.
        :param termination_delay: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#termination_delay Ec2Fleet#termination_delay}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d1ff938874645a59844e518420ab8ba83dcc23f56a72392a867a8774402122ce)
            check_type(argname="argument replacement_strategy", value=replacement_strategy, expected_type=type_hints["replacement_strategy"])
            check_type(argname="argument termination_delay", value=termination_delay, expected_type=type_hints["termination_delay"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if replacement_strategy is not None:
            self._values["replacement_strategy"] = replacement_strategy
        if termination_delay is not None:
            self._values["termination_delay"] = termination_delay

    @builtins.property
    def replacement_strategy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replacement_strategy Ec2Fleet#replacement_strategy}.'''
        result = self._values.get("replacement_strategy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def termination_delay(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#termination_delay Ec2Fleet#termination_delay}.'''
        result = self._values.get("termination_delay")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalanceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalanceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8c5cfb051c4c815a623804a2176d2543c7001e2e24fd6d160a0532aaf4eccf53)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetReplacementStrategy")
    def reset_replacement_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReplacementStrategy", []))

    @jsii.member(jsii_name="resetTerminationDelay")
    def reset_termination_delay(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTerminationDelay", []))

    @builtins.property
    @jsii.member(jsii_name="replacementStrategyInput")
    def replacement_strategy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "replacementStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="terminationDelayInput")
    def termination_delay_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "terminationDelayInput"))

    @builtins.property
    @jsii.member(jsii_name="replacementStrategy")
    def replacement_strategy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "replacementStrategy"))

    @replacement_strategy.setter
    def replacement_strategy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d8b2ea3e79e4a55528ee8a8c0430901cae5f46582c7cdd76be0dbe342def4d8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "replacementStrategy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="terminationDelay")
    def termination_delay(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "terminationDelay"))

    @termination_delay.setter
    def termination_delay(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df373bec2fbbce7bcf08ac903a4342003c2cd6b33b6675285d28af36f136f141)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terminationDelay", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance]:
        return typing.cast(typing.Optional[Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d3baf8d8c8c78daa0c8aa2d94e1475b4f43fecd741003ab930aa02f9967cb88)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Ec2FleetSpotOptionsMaintenanceStrategiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetSpotOptionsMaintenanceStrategiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1e10fb838578e05b203e98540daf6250f1acdc5d20e8fe05963f0a37badeb60c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCapacityRebalance")
    def put_capacity_rebalance(
        self,
        *,
        replacement_strategy: typing.Optional[builtins.str] = None,
        termination_delay: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param replacement_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#replacement_strategy Ec2Fleet#replacement_strategy}.
        :param termination_delay: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#termination_delay Ec2Fleet#termination_delay}.
        '''
        value = Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance(
            replacement_strategy=replacement_strategy,
            termination_delay=termination_delay,
        )

        return typing.cast(None, jsii.invoke(self, "putCapacityRebalance", [value]))

    @jsii.member(jsii_name="resetCapacityRebalance")
    def reset_capacity_rebalance(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCapacityRebalance", []))

    @builtins.property
    @jsii.member(jsii_name="capacityRebalance")
    def capacity_rebalance(
        self,
    ) -> Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalanceOutputReference:
        return typing.cast(Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalanceOutputReference, jsii.get(self, "capacityRebalance"))

    @builtins.property
    @jsii.member(jsii_name="capacityRebalanceInput")
    def capacity_rebalance_input(
        self,
    ) -> typing.Optional[Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance]:
        return typing.cast(typing.Optional[Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance], jsii.get(self, "capacityRebalanceInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2FleetSpotOptionsMaintenanceStrategies]:
        return typing.cast(typing.Optional[Ec2FleetSpotOptionsMaintenanceStrategies], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetSpotOptionsMaintenanceStrategies],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df76b2db319868a0a792f4b923778d9a64eed94ba045185539ed49e99a1cc63a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Ec2FleetSpotOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetSpotOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__58cce03acbdf1ddf0a69e5927a0343f0acfe4f9f628b02be07da705a164b29db)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putMaintenanceStrategies")
    def put_maintenance_strategies(
        self,
        *,
        capacity_rebalance: typing.Optional[typing.Union[Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param capacity_rebalance: capacity_rebalance block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#capacity_rebalance Ec2Fleet#capacity_rebalance}
        '''
        value = Ec2FleetSpotOptionsMaintenanceStrategies(
            capacity_rebalance=capacity_rebalance
        )

        return typing.cast(None, jsii.invoke(self, "putMaintenanceStrategies", [value]))

    @jsii.member(jsii_name="resetAllocationStrategy")
    def reset_allocation_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllocationStrategy", []))

    @jsii.member(jsii_name="resetInstanceInterruptionBehavior")
    def reset_instance_interruption_behavior(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceInterruptionBehavior", []))

    @jsii.member(jsii_name="resetInstancePoolsToUseCount")
    def reset_instance_pools_to_use_count(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstancePoolsToUseCount", []))

    @jsii.member(jsii_name="resetMaintenanceStrategies")
    def reset_maintenance_strategies(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaintenanceStrategies", []))

    @jsii.member(jsii_name="resetMaxTotalPrice")
    def reset_max_total_price(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxTotalPrice", []))

    @jsii.member(jsii_name="resetMinTargetCapacity")
    def reset_min_target_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinTargetCapacity", []))

    @jsii.member(jsii_name="resetSingleAvailabilityZone")
    def reset_single_availability_zone(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSingleAvailabilityZone", []))

    @jsii.member(jsii_name="resetSingleInstanceType")
    def reset_single_instance_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSingleInstanceType", []))

    @builtins.property
    @jsii.member(jsii_name="maintenanceStrategies")
    def maintenance_strategies(
        self,
    ) -> Ec2FleetSpotOptionsMaintenanceStrategiesOutputReference:
        return typing.cast(Ec2FleetSpotOptionsMaintenanceStrategiesOutputReference, jsii.get(self, "maintenanceStrategies"))

    @builtins.property
    @jsii.member(jsii_name="allocationStrategyInput")
    def allocation_strategy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "allocationStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceInterruptionBehaviorInput")
    def instance_interruption_behavior_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "instanceInterruptionBehaviorInput"))

    @builtins.property
    @jsii.member(jsii_name="instancePoolsToUseCountInput")
    def instance_pools_to_use_count_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "instancePoolsToUseCountInput"))

    @builtins.property
    @jsii.member(jsii_name="maintenanceStrategiesInput")
    def maintenance_strategies_input(
        self,
    ) -> typing.Optional[Ec2FleetSpotOptionsMaintenanceStrategies]:
        return typing.cast(typing.Optional[Ec2FleetSpotOptionsMaintenanceStrategies], jsii.get(self, "maintenanceStrategiesInput"))

    @builtins.property
    @jsii.member(jsii_name="maxTotalPriceInput")
    def max_total_price_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "maxTotalPriceInput"))

    @builtins.property
    @jsii.member(jsii_name="minTargetCapacityInput")
    def min_target_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minTargetCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="singleAvailabilityZoneInput")
    def single_availability_zone_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "singleAvailabilityZoneInput"))

    @builtins.property
    @jsii.member(jsii_name="singleInstanceTypeInput")
    def single_instance_type_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "singleInstanceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="allocationStrategy")
    def allocation_strategy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "allocationStrategy"))

    @allocation_strategy.setter
    def allocation_strategy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f9a52bb32c6db5796cf6580a9bed746548584162bb2d6c957283833223849037)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "allocationStrategy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="instanceInterruptionBehavior")
    def instance_interruption_behavior(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "instanceInterruptionBehavior"))

    @instance_interruption_behavior.setter
    def instance_interruption_behavior(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1495476c75ed3e60f48d63cc270762f93c3c711b831a127c7ffc342ed9f027bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceInterruptionBehavior", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="instancePoolsToUseCount")
    def instance_pools_to_use_count(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "instancePoolsToUseCount"))

    @instance_pools_to_use_count.setter
    def instance_pools_to_use_count(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f9f6cce37cb02fb62345e797e62bc6cac04f56f529269fbc94b98fc1ac6587d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instancePoolsToUseCount", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxTotalPrice")
    def max_total_price(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "maxTotalPrice"))

    @max_total_price.setter
    def max_total_price(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ca946018751e0d6729b7ff52e5efccf7fe0ca9a419ea01435f6164acc337b31)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxTotalPrice", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minTargetCapacity")
    def min_target_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minTargetCapacity"))

    @min_target_capacity.setter
    def min_target_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b8c6c748f24e5c929b6622b75773025bd1b802f312f83ffebb1f33ab0820fae0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minTargetCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="singleAvailabilityZone")
    def single_availability_zone(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "singleAvailabilityZone"))

    @single_availability_zone.setter
    def single_availability_zone(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__813be52de28ab62bbc27969f38e19e4b7f906d6c5d8eb0325c08b9e65d616a41)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "singleAvailabilityZone", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="singleInstanceType")
    def single_instance_type(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "singleInstanceType"))

    @single_instance_type.setter
    def single_instance_type(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a65b4be8938371e6b9dec5bec8a9ae100282092cdacae305b9d7da859290444a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "singleInstanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Ec2FleetSpotOptions]:
        return typing.cast(typing.Optional[Ec2FleetSpotOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[Ec2FleetSpotOptions]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ffa74fefce2fc29533e0c0a253deecf2897fb0e04d6d1d6e808f7ed236a5550c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetTargetCapacitySpecification",
    jsii_struct_bases=[],
    name_mapping={
        "default_target_capacity_type": "defaultTargetCapacityType",
        "total_target_capacity": "totalTargetCapacity",
        "on_demand_target_capacity": "onDemandTargetCapacity",
        "spot_target_capacity": "spotTargetCapacity",
        "target_capacity_unit_type": "targetCapacityUnitType",
    },
)
class Ec2FleetTargetCapacitySpecification:
    def __init__(
        self,
        *,
        default_target_capacity_type: builtins.str,
        total_target_capacity: jsii.Number,
        on_demand_target_capacity: typing.Optional[jsii.Number] = None,
        spot_target_capacity: typing.Optional[jsii.Number] = None,
        target_capacity_unit_type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param default_target_capacity_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#default_target_capacity_type Ec2Fleet#default_target_capacity_type}.
        :param total_target_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#total_target_capacity Ec2Fleet#total_target_capacity}.
        :param on_demand_target_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_target_capacity Ec2Fleet#on_demand_target_capacity}.
        :param spot_target_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_target_capacity Ec2Fleet#spot_target_capacity}.
        :param target_capacity_unit_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#target_capacity_unit_type Ec2Fleet#target_capacity_unit_type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d73101bc338713bd6105d79c66e087b23cffe5b5f01247e98edbc25f050ff175)
            check_type(argname="argument default_target_capacity_type", value=default_target_capacity_type, expected_type=type_hints["default_target_capacity_type"])
            check_type(argname="argument total_target_capacity", value=total_target_capacity, expected_type=type_hints["total_target_capacity"])
            check_type(argname="argument on_demand_target_capacity", value=on_demand_target_capacity, expected_type=type_hints["on_demand_target_capacity"])
            check_type(argname="argument spot_target_capacity", value=spot_target_capacity, expected_type=type_hints["spot_target_capacity"])
            check_type(argname="argument target_capacity_unit_type", value=target_capacity_unit_type, expected_type=type_hints["target_capacity_unit_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_target_capacity_type": default_target_capacity_type,
            "total_target_capacity": total_target_capacity,
        }
        if on_demand_target_capacity is not None:
            self._values["on_demand_target_capacity"] = on_demand_target_capacity
        if spot_target_capacity is not None:
            self._values["spot_target_capacity"] = spot_target_capacity
        if target_capacity_unit_type is not None:
            self._values["target_capacity_unit_type"] = target_capacity_unit_type

    @builtins.property
    def default_target_capacity_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#default_target_capacity_type Ec2Fleet#default_target_capacity_type}.'''
        result = self._values.get("default_target_capacity_type")
        assert result is not None, "Required property 'default_target_capacity_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def total_target_capacity(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#total_target_capacity Ec2Fleet#total_target_capacity}.'''
        result = self._values.get("total_target_capacity")
        assert result is not None, "Required property 'total_target_capacity' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def on_demand_target_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_target_capacity Ec2Fleet#on_demand_target_capacity}.'''
        result = self._values.get("on_demand_target_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def spot_target_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_target_capacity Ec2Fleet#spot_target_capacity}.'''
        result = self._values.get("spot_target_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def target_capacity_unit_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#target_capacity_unit_type Ec2Fleet#target_capacity_unit_type}.'''
        result = self._values.get("target_capacity_unit_type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetTargetCapacitySpecification(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetTargetCapacitySpecificationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetTargetCapacitySpecificationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fff8a4e121cf1ae87d0349e5cd5178af59c7433991a75fccb02e364db8202bc9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetOnDemandTargetCapacity")
    def reset_on_demand_target_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnDemandTargetCapacity", []))

    @jsii.member(jsii_name="resetSpotTargetCapacity")
    def reset_spot_target_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSpotTargetCapacity", []))

    @jsii.member(jsii_name="resetTargetCapacityUnitType")
    def reset_target_capacity_unit_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetCapacityUnitType", []))

    @builtins.property
    @jsii.member(jsii_name="defaultTargetCapacityTypeInput")
    def default_target_capacity_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultTargetCapacityTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="onDemandTargetCapacityInput")
    def on_demand_target_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "onDemandTargetCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="spotTargetCapacityInput")
    def spot_target_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "spotTargetCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="targetCapacityUnitTypeInput")
    def target_capacity_unit_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "targetCapacityUnitTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="totalTargetCapacityInput")
    def total_target_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "totalTargetCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultTargetCapacityType")
    def default_target_capacity_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultTargetCapacityType"))

    @default_target_capacity_type.setter
    def default_target_capacity_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eed9ace8e8d26b4c16b4b1159950e0d7a31857de25ce62b2b5bccc484a9b8882)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultTargetCapacityType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onDemandTargetCapacity")
    def on_demand_target_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "onDemandTargetCapacity"))

    @on_demand_target_capacity.setter
    def on_demand_target_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3bc9a7157ab652aed13f9814f1cf58edc13b06f605a6e2b5796c257d59ac62f8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onDemandTargetCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="spotTargetCapacity")
    def spot_target_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "spotTargetCapacity"))

    @spot_target_capacity.setter
    def spot_target_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d0e789771ca8089fdb791cda08583dc4b10c3bab1ad49fddc86ceeca636905e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "spotTargetCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="targetCapacityUnitType")
    def target_capacity_unit_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "targetCapacityUnitType"))

    @target_capacity_unit_type.setter
    def target_capacity_unit_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99aeb4ab6eaab6f5917433de09cf043b595e70181318f4671c10000a9dae0fee)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetCapacityUnitType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="totalTargetCapacity")
    def total_target_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "totalTargetCapacity"))

    @total_target_capacity.setter
    def total_target_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db9de949834972e567c2bbe980ac118fccdeea49783f1ceb29669d7f451e20e3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "totalTargetCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Ec2FleetTargetCapacitySpecification]:
        return typing.cast(typing.Optional[Ec2FleetTargetCapacitySpecification], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2FleetTargetCapacitySpecification],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5927dd08ca13ab4066c915b50200d9913fb1ed6d041f7fa08b6ba91a89993266)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2Fleet.Ec2FleetTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class Ec2FleetTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#create Ec2Fleet#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#delete Ec2Fleet#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#update Ec2Fleet#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6406b6550d91a12f2601b8247493d02d6e94a9303b1ed9f097d928fe302d0eee)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#create Ec2Fleet#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#delete Ec2Fleet#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#update Ec2Fleet#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2FleetTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2FleetTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2Fleet.Ec2FleetTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c12d4dd3456dca0acc705c7edbc31ac0c4d2e8e6b0bf03b8cc7b9d6d6fd4fc2b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0406be953d1d83b76ae8b5f5717a1e144a5361ebb78d14de8fbf9440771740b8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99e26ae9042bb85a3f55628ad7e45f76048f3c9e028dfbc528f9a5d1e3a84bce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1da442ed3125df0bba8af46627dccabc3fa090b840a40f9b0027bda29ed960cf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6475f6e4946fd53ad3c839f569ba6ea9d0c8c0e471a1b480b2fec63b1a022427)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Ec2Fleet",
    "Ec2FleetConfig",
    "Ec2FleetFleetInstanceSet",
    "Ec2FleetFleetInstanceSetList",
    "Ec2FleetFleetInstanceSetOutputReference",
    "Ec2FleetLaunchTemplateConfig",
    "Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification",
    "Ec2FleetLaunchTemplateConfigLaunchTemplateSpecificationOutputReference",
    "Ec2FleetLaunchTemplateConfigList",
    "Ec2FleetLaunchTemplateConfigOutputReference",
    "Ec2FleetLaunchTemplateConfigOverride",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCountOutputReference",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMibOutputReference",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpuOutputReference",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMibOutputReference",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbpsOutputReference",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCountOutputReference",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsOutputReference",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGbOutputReference",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount",
    "Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCountOutputReference",
    "Ec2FleetLaunchTemplateConfigOverrideList",
    "Ec2FleetLaunchTemplateConfigOverrideOutputReference",
    "Ec2FleetOnDemandOptions",
    "Ec2FleetOnDemandOptionsCapacityReservationOptions",
    "Ec2FleetOnDemandOptionsCapacityReservationOptionsOutputReference",
    "Ec2FleetOnDemandOptionsOutputReference",
    "Ec2FleetSpotOptions",
    "Ec2FleetSpotOptionsMaintenanceStrategies",
    "Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance",
    "Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalanceOutputReference",
    "Ec2FleetSpotOptionsMaintenanceStrategiesOutputReference",
    "Ec2FleetSpotOptionsOutputReference",
    "Ec2FleetTargetCapacitySpecification",
    "Ec2FleetTargetCapacitySpecificationOutputReference",
    "Ec2FleetTimeouts",
    "Ec2FleetTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__2db791429c86a7a865023f626557171e60f47a281fdbb6f2307052a15251f6a3(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    launch_template_config: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Ec2FleetLaunchTemplateConfig, typing.Dict[builtins.str, typing.Any]]]],
    target_capacity_specification: typing.Union[Ec2FleetTargetCapacitySpecification, typing.Dict[builtins.str, typing.Any]],
    context: typing.Optional[builtins.str] = None,
    excess_capacity_termination_policy: typing.Optional[builtins.str] = None,
    fleet_instance_set: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Ec2FleetFleetInstanceSet, typing.Dict[builtins.str, typing.Any]]]]] = None,
    fleet_state: typing.Optional[builtins.str] = None,
    fulfilled_capacity: typing.Optional[jsii.Number] = None,
    fulfilled_on_demand_capacity: typing.Optional[jsii.Number] = None,
    id: typing.Optional[builtins.str] = None,
    on_demand_options: typing.Optional[typing.Union[Ec2FleetOnDemandOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    replace_unhealthy_instances: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    spot_options: typing.Optional[typing.Union[Ec2FleetSpotOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    terminate_instances: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    terminate_instances_with_expiration: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    timeouts: typing.Optional[typing.Union[Ec2FleetTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    type: typing.Optional[builtins.str] = None,
    valid_from: typing.Optional[builtins.str] = None,
    valid_until: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__81dacc73f8ef57d12d0a75fc4beecb568fe60b7486282aecb722ddd6b59ce2dc(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6c6ac616d860afe051a0d084ca422e5e6a5079925329f172b8afd6aa858e2b0(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Ec2FleetFleetInstanceSet, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3333e7f55bb95d2ef1efbaa8eed0a60ead0feecbdaad57e0f15775dbc662f71a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Ec2FleetLaunchTemplateConfig, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d71df3ac9a0921a498d577fd12046c76b04900a500a29fa9538ea615e721764e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8086d51d7f50cb92986ec23b1765c8756f6244bcee73050de6b3ea6811c6a9bf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b3377d101ac8d80d8b5420323624f6dbb42dcc2b5f24667cac8fdbff009b413(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c98c26159d54395f3f32201810bc77115caa6d4897aa8dbf4ec84f7b816c9802(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__acb45ab0e0182bab9eefea35aa770e33929b133fdc110a6811a68d2bed137177(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a64cb2bd89416794cefedb9ac1c6f447582dddd099202c8c68244a6481f0985e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18988ddae3d4b292d0368c10b7f63a7aa7a33eeb2730f364710e06f53e074a1a(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5b2139240b76ab6c4a2128a2434701a474810c865ebbcdb161192464b5e209c(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6dc313e1fc7c2fddd904e6dfe074f9bb39e78dbdf1ca5e3d48ad9edf61b732d7(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d51318d5042c7b52bc95e3b039cd368b38045510353201c18a6a4e833b875a0a(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__953b12f7a615293fb130e0136d921713b93c7b039a0b084ef6673a2859950333(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8986311b04c5473211e67d7a353d50c26d5204bbfd6247fd2fa7532ac18ed78e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75232ed3195a672ddd6e28424ee5dead25b6890578f8d04a8062d674ea0e09b3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__648a3091676c8260921d6e78b81343f2e1999419b25a41a50c27319b77eec96e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1aa1ab1f090a40ed05cb1470093f013eeebad88b1d5c6f33d709b28952a7f41b(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    launch_template_config: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Ec2FleetLaunchTemplateConfig, typing.Dict[builtins.str, typing.Any]]]],
    target_capacity_specification: typing.Union[Ec2FleetTargetCapacitySpecification, typing.Dict[builtins.str, typing.Any]],
    context: typing.Optional[builtins.str] = None,
    excess_capacity_termination_policy: typing.Optional[builtins.str] = None,
    fleet_instance_set: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Ec2FleetFleetInstanceSet, typing.Dict[builtins.str, typing.Any]]]]] = None,
    fleet_state: typing.Optional[builtins.str] = None,
    fulfilled_capacity: typing.Optional[jsii.Number] = None,
    fulfilled_on_demand_capacity: typing.Optional[jsii.Number] = None,
    id: typing.Optional[builtins.str] = None,
    on_demand_options: typing.Optional[typing.Union[Ec2FleetOnDemandOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    replace_unhealthy_instances: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    spot_options: typing.Optional[typing.Union[Ec2FleetSpotOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    terminate_instances: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    terminate_instances_with_expiration: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    timeouts: typing.Optional[typing.Union[Ec2FleetTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    type: typing.Optional[builtins.str] = None,
    valid_from: typing.Optional[builtins.str] = None,
    valid_until: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__45aae8843d5113ba8009509533f4c37ca53e30beb263e3905c991ea6f0b53b84(
    *,
    instance_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    instance_type: typing.Optional[builtins.str] = None,
    lifecycle: typing.Optional[builtins.str] = None,
    platform: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5cf5c3c02204bae7001c1b525431723e684141bee1d1b35e7da055271d67dfaf(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f28ed585469adf38e36a93c6cd3b24e33f548312d15f235a12a2c46034ec64be(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a275c76dc45addec9396af073642833efe0a4a01df0761fbb0560b4723946e91(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40204f8d294d4b045da105ebc964a83c3c3ac2adb45f36233b443df704ea2e6b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb64ad1ed180fdf153c84296ab7d52845b0e2e6a98c66b39b4ab8b62233b992e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8edc571d859cb743499a9972f9efc5141f70fe4f0f4d9837799864783ee1e2d0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Ec2FleetFleetInstanceSet]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0d8de0e0d70e188ae860c24bedba64bf1a2fe0f1a96e26d666ba57b9e2a31ba(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6186a2606f5a7833a38a5cc26a67302e8dc487c8381da16e7a54f09ae81a79a(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__133258078b9e763a0b21c8d78b07a8dbfd38810c6df253e9c350e8e9bc313757(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b861e132e9a76c542cf5c6da6885c13bbfcf5096b2914e0018a13b075caeff6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08ba96f5394640ba7caf384296818e38e6d90e0e817a207834e7de1531018e6d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7be54835ce10c83120512ad3f1e01738d7c2df2e1e5e4015b8934b420742ad56(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetFleetInstanceSet]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01f947abccff90e4add81a60db4fb2bce83f4ce63803a2fa5491e6552728e588(
    *,
    launch_template_specification: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification, typing.Dict[builtins.str, typing.Any]]] = None,
    override: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Ec2FleetLaunchTemplateConfigOverride, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__119ec88f6faf289f1c5fbc3a806493472b75e7396635f71f7b36ae91832e2061(
    *,
    version: builtins.str,
    launch_template_id: typing.Optional[builtins.str] = None,
    launch_template_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28c5fbe00cf944c0e025aaeefe8e015ebb5aec2be6670bfc446830a47bc4e2cd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa601f974cd2fe3397e7156f22c72ab9a8d3840266dbccf76fbc209534c9c151(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec3a3edfaf2d06cfef9b74f58f72048021cd6d5d1fc9f62616bc40fb471b70d9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99c7dafdef43b1593218a85a059681ce3684e3e37cc6e17ee367367556976003(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c53f576b9d8f3c513b9cc64b0f66db3d1c0a66544dc2724567ac684e7890851e(
    value: typing.Optional[Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4bc90a137d403c02c1b7ca48e66ce10902b8f61eb2c4c3d37790ce0d3a97387e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86fabfa574ac3a59a8857675e2f236e970a93cb7ff6f62ac5a949b55cc937f15(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07691f23bc217c71860d692854849dae63bd027cefc337594a14233324ec94d4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eccf2e8423dd36ae003d9165fa24f468cd3c6655343f606d2ab8cd8a617c3645(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2d3f401dfbc2ac2aab950f558951bde8909bf49baf6c5877bed5e109d586407(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__165d7bd7336fa81477e3425dd6284f48a6b960b0a986ca24f01272edbc33f90f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Ec2FleetLaunchTemplateConfig]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__516a3ecd3de933f5f55b1846826db0d648cdcac7f449b1a93205e7150aac2942(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2062ff88e6ceac2c4d97a7f256e67e07a5055754a9b823ae72b54498e61869a2(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Ec2FleetLaunchTemplateConfigOverride, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a154c87b6f27166a2d5076d205d5b7157e660ebc0a2f9e6e3ef202ec0cad3ec1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetLaunchTemplateConfig]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef45740bdfc9d0aee874e7975907905256eea424a1e1223a03b46c62dab616c4(
    *,
    availability_zone: typing.Optional[builtins.str] = None,
    instance_requirements: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements, typing.Dict[builtins.str, typing.Any]]] = None,
    instance_type: typing.Optional[builtins.str] = None,
    max_price: typing.Optional[builtins.str] = None,
    priority: typing.Optional[jsii.Number] = None,
    subnet_id: typing.Optional[builtins.str] = None,
    weighted_capacity: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7d47bce7f3d09cb89f760c6f533d7bef5fd6faab8fc95284dbfa569464642b5(
    *,
    memory_mib: typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib, typing.Dict[builtins.str, typing.Any]],
    vcpu_count: typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount, typing.Dict[builtins.str, typing.Any]],
    accelerator_count: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount, typing.Dict[builtins.str, typing.Any]]] = None,
    accelerator_manufacturers: typing.Optional[typing.Sequence[builtins.str]] = None,
    accelerator_names: typing.Optional[typing.Sequence[builtins.str]] = None,
    accelerator_total_memory_mib: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib, typing.Dict[builtins.str, typing.Any]]] = None,
    accelerator_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    allowed_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    bare_metal: typing.Optional[builtins.str] = None,
    baseline_ebs_bandwidth_mbps: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps, typing.Dict[builtins.str, typing.Any]]] = None,
    burstable_performance: typing.Optional[builtins.str] = None,
    cpu_manufacturers: typing.Optional[typing.Sequence[builtins.str]] = None,
    excluded_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    instance_generations: typing.Optional[typing.Sequence[builtins.str]] = None,
    local_storage: typing.Optional[builtins.str] = None,
    local_storage_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    max_spot_price_as_percentage_of_optimal_on_demand_price: typing.Optional[jsii.Number] = None,
    memory_gib_per_vcpu: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu, typing.Dict[builtins.str, typing.Any]]] = None,
    network_bandwidth_gbps: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps, typing.Dict[builtins.str, typing.Any]]] = None,
    network_interface_count: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount, typing.Dict[builtins.str, typing.Any]]] = None,
    on_demand_max_price_percentage_over_lowest_price: typing.Optional[jsii.Number] = None,
    require_hibernate_support: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    spot_max_price_percentage_over_lowest_price: typing.Optional[jsii.Number] = None,
    total_local_storage_gb: typing.Optional[typing.Union[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__688e0c98eca32beba61f338e6ee7ddd9ce6b7e3b85b9140ade2aa298c6530b67(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3acffc603968cfaf86488ebf49577bcdc7e2bf286d902ca3637d40a88c15add4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__901af9667d95c3aa0158a36fab0f72f1d52b5afe4f32775fc430ea8c8cf9aa14(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72159cae2cff0d7a2353693ff2899dc73319915f240537547e3c1631a2ec32f0(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a8526e34d808405a2fbdcf5756c35c90f69126876486a8272ab361a41ad9b3e(
    value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44956b1206ae4e83f82dd50c2c38f8efd71598662abcb68d67ecbb30cefe9157(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99a9ba4d4fe26601d2f8d89b035c4b5d682463bb15fd5491baa3de49143bd753(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__238be6f3c830a04c4b911d69ec01a3a1e2c1f902030221f6736f5ab4edcaf317(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__abbf044a348dc8c3990767b61ce45c00815886b6e0f90f9b0378d18c38668eab(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06c2f7e3254dc8e55afdd7be9423da5265061dfd1911cd237f0ded48c50c6dba(
    value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__798054db504ffcc586194cf36bcce1574f8b6fbd6786ed2a96103bac5cc3c627(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c8c08bacfd64ac70d503771a4486fb8d1d99c6b36c333e580451b6b2cca7af19(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__939ff7c4cc290cd3f4b0f65dc6602d1ab38b4d8d1f66eb82f9a6bf83e694017a(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea6e5ffa7ef127f8a02256048a73d7a31bcb09ef106ecb1f5b46483e34530641(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__63b0c46b250fbceb47c6ff2cf0cdf18bbe49bdb364312fc79ce9f3851f28f5a3(
    value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3bb3e7658f035c9aacbb76eb16014a61e36a3621f490972a0e3de32d67761b73(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9795f3b8e6c5b85e55033c7516c4cbf3d2efc668fee72b52bbf63b3132c1018(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d84aa834c6efff28fb6d07fec91a08f3491b2c0af2586b979d370db18693410(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7308f1ae30683290b2edca5a6da41c9c2a8a9410f84765d38f13836fa6669fe0(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7787ae8aedc7a285569a1822632b1fe8dff5fbd3b0f4593599f2cc09b7d587af(
    value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f09be6cf396ca9fef1906c48371894a69ef43dbd1ba88f4b407c3b9768ca3ed3(
    *,
    min: jsii.Number,
    max: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1a8cf42ad6af63ddec8494282f86b81bc33f3ebb4d6fd6444d83b5e6e6de477(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8abe8bc0da44ae729509d57d65f3132e9ab183e82286d432e1f48fcc0d2eb0bb(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4836a86f0e8e8189b8e1040c415ee2c7abaafb39e6f0caef904bedfbdd025165(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e754be8d60e0627d0c44aba6c9345e1a4446c08ed9bc695add5c5877fe5e903d(
    value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c9e3377314d55123253e643d92becfbaa0ec282cd3f3853aa21380b8c85d60fa(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c54fdee673d46089a67e3a4a4b371760a4af792e3cc9ce019da5a1ef6ef409f8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96d55630e954cc8c470594334b1bb3b48e4d2a8164072e7b10b6f92aaa126b46(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a95d8c58d5c83c4537394022b985e0e3eaeed7169204a16b2ee614eff477fed1(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4cb73012ea3499c1077e7b2b0b804037c8ec6d3f693a0c29be7d84608de4892(
    value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d465787d3465a2f20977a79a1ec32b906759e8f81a47e70a526936f3cd0b9c2(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__707e7cd0a009868cca84d61e027c1db83f29d0ff05d7568c07dfa4269df871ea(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__165fb2e079d0899204984460d071d5f58085f8d81dbb73f4eac2d012fd58bdf5(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e6547ea30f11adec1ab601b84cec34f9a25f0fe82109505146bdf04da3803bc(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__036b3099e26bbec2b0a46855a80fab475a69a05428d1117afdcb98288de645bb(
    value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b7ee2c3b836277f1002ae37aba5c4a2a3daffe63507b713c1b444904a6c1427(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5de46fd25989f196729bbe9232bb99b2353494302789d5221c65f25c2265b868(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29307d95a8515b061be38474b0a44d676df08d2c7d5370cf1882f60a6463a971(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b71cc665a5f2b02cd371aec7488303df9dd8891c745dc7c9154769cc29ce0ada(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ad0095525c04bbc335adbc5a747f2dbf66733ed3990610826dd3e1e159c4d33d(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__059500df115aef488331b4aa273e2c33850febdfcd89bc1ed0240ac2d216adc2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12996e08161806f33071d58a36530a7861ca7d871c8866ba7de86d51dc5febae(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1505082473a138549e576ca358fb05ebbc6a0cb3c317a4ece36a86d321705ccf(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0e54e6596e53501aa90fda2155b6d65b311bb62ed1c4423f7e34e549934ee78(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1249b69c21719288c53c7a1a618848eeabfcbe6114d6f8fb895e60b4e8d2c40d(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ecb19412ae58eeab5718df51a21f5cb1ba4795a64ae35978b1726728ba69b079(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9e913f2c3c713e046c7f92cab06c4188d1fb57e5c39161728da8171404345d3(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29178c12a3feef5876f55ca715cc9cb8b67d80e5790411fed511bb29946fe262(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f0e27c4104c7c5c8b8c8bc548e409bd2170f646e8e5716b83db7fa497cc1bc7(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ab7f1fc96dc2f83408928de3b334b40f5318f8787cc57d059f67a1b84827c07(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a40a7f403790fbc4354b4a97ca114e0d3a8efddb5835caa0e63f494c2cdaef3f(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d771e843264f0eab3c6b08497e63e5669940dada8c813a5a919797dcda9449b(
    value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__71d4b2aa6a36c4fef1b47e98df91e0d4435ce6cfde6a419e69a343b81b52fa82(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b30fe4f23c972d5a6d1b591341cfe3344237c589fbbd2bfda96c34de5df391c2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__923eea7048d0cef3834230c434cefd62790e6a2faab8b754bc3fbb34615b9841(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b53a391f34fd049dfc1fe728ceb1833347f944c6cbee00b2b59a4a375f06fa4(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__308593cebf3e0bb60ed73929f8038851de553b9dead7af6d10598a19b8bbc0a9(
    value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01a5b8ed2c6a94597577672880da8bdb482201e1e5ab6afb0263ffadb4108a2b(
    *,
    min: jsii.Number,
    max: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a60423c23e4a5f49ceb63b9cc5f97867845df437a35c75b2507e8c5e9759edf(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e6b1897bd80d6563b112120a9591a088773372f2bb2810953504255abfb01df(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5324a955a7c1f5fb02966cdba4d796a7bdae32bbd514f3e9dd54bde777db6f8(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65dfe22b76ff06da9624c6f4ff8e17e98e63936882760bc1a53dbfb8e7175f7c(
    value: typing.Optional[Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f1d6bf951d1cc33d071169c2bd1b907042c7553a7622413a021a922972b900a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b3209f25ac1a5d8a3248a05a82bde7ac9c877d2b3b4319f4bed0ca9c222e7ef(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__440c458ae8b9b43f7c42342969e746da8bc56a83100f03c2a8f56aab87404729(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82caa6bf8477b09e310c3dd48bbb3330f1e16cde25b6a11d8ae18eac1f8e06e8(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b00309a8f85f1f048a452b820d1108565e81944ad8eaed6f30d02f17bc82cbb(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa6ada24b272546fac4531866983bfd346818bf470ca68037e7690bfdac40551(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Ec2FleetLaunchTemplateConfigOverride]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a0849cc7588e65dec7d1e8a1ef29e054c3be95852ec894ed9ece2e518409584(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8defbab6900c61e4820cdaf12b525f9523e4c1bc386bcb06acbbd2ddad1d7d03(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db75fdb141058231dde4925c8ac4fa37773f6302f50f0a818889b2fd11e1cfc4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ac4cf413556d5f924a72f57dbedb228cc94a74c603e41b270486fad06053f2c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__567ce2a6c5f16ebaa7686514599e43073fa6145bba848c2e6f5ed32da4f3f9d9(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2947ebc776d1fabeb37fca5b0ef4f152db92d117c6def670f5258379aff25b45(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01998afb616e3680d4ce7b5cdbe35eb2cbf208d2f4bd8faac9108b148f73bcef(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__feb4ab01a85982733bfbdc152c6bcdf2e980faf059bf3a0445aa6af61b1b2441(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetLaunchTemplateConfigOverride]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d7b1aeca6b1dad20e8d0b6c5548eb61fdc5f043c426f8b9c0b8d59f0e3f2f0a(
    *,
    allocation_strategy: typing.Optional[builtins.str] = None,
    capacity_reservation_options: typing.Optional[typing.Union[Ec2FleetOnDemandOptionsCapacityReservationOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    max_total_price: typing.Optional[builtins.str] = None,
    min_target_capacity: typing.Optional[jsii.Number] = None,
    single_availability_zone: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    single_instance_type: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4834214e08ad44b3784975df976e8c07b3f21ffc15fc2c3a0bd28b33a2889cf3(
    *,
    usage_strategy: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3de875e5f2e7e3a5d1feed940bb6213d2fdae4b9885847e4ae401da4ababb0d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f4a4cb37a6efa1d1ae3ed9575b258bf9912f208e37f8a9b4ebcf6320ef79559(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__712d0f3bae33e90ce024687eac56aaa2fde08571e9ecd5dc0d08d00e6e6fd541(
    value: typing.Optional[Ec2FleetOnDemandOptionsCapacityReservationOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__627f724a25c06391ea5025d713987c4119f5d1fe973b6adf946de0658f7eec3d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdafb7bfb3923390299eb3205a318908300485fa109a2acbbca69f5721fe7137(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__330cbc258b9fea5e356ff05fdb25cfba9d97e1d3a4f80c992161bdf52a00c0cd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96fa1c00cedac7a17a136434a0c46e0a2a551f47a29501680d9a70f1a5f26ff6(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1f9626f6fea46baf39a8c979a64a14b2ca82adc9a42731f490a74fb486a90a4(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56233bdcc0912028d864f78807d7f806352bc7a3a59672d06c5a7cda694acf6f(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15e6b072fc178b54757266393a2b67db9f4f129902ed5f426e61ba3f0cf75fdf(
    value: typing.Optional[Ec2FleetOnDemandOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05c18cd65781d422c577059f5e7c0d7774fcea8c8244b4c584c723dc05621eee(
    *,
    allocation_strategy: typing.Optional[builtins.str] = None,
    instance_interruption_behavior: typing.Optional[builtins.str] = None,
    instance_pools_to_use_count: typing.Optional[jsii.Number] = None,
    maintenance_strategies: typing.Optional[typing.Union[Ec2FleetSpotOptionsMaintenanceStrategies, typing.Dict[builtins.str, typing.Any]]] = None,
    max_total_price: typing.Optional[builtins.str] = None,
    min_target_capacity: typing.Optional[jsii.Number] = None,
    single_availability_zone: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    single_instance_type: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d93ff23762b23a07c8758932202f49eb2706f38543f6b11f4ef6d85f9476ad7(
    *,
    capacity_rebalance: typing.Optional[typing.Union[Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1ff938874645a59844e518420ab8ba83dcc23f56a72392a867a8774402122ce(
    *,
    replacement_strategy: typing.Optional[builtins.str] = None,
    termination_delay: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c5cfb051c4c815a623804a2176d2543c7001e2e24fd6d160a0532aaf4eccf53(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d8b2ea3e79e4a55528ee8a8c0430901cae5f46582c7cdd76be0dbe342def4d8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df373bec2fbbce7bcf08ac903a4342003c2cd6b33b6675285d28af36f136f141(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d3baf8d8c8c78daa0c8aa2d94e1475b4f43fecd741003ab930aa02f9967cb88(
    value: typing.Optional[Ec2FleetSpotOptionsMaintenanceStrategiesCapacityRebalance],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e10fb838578e05b203e98540daf6250f1acdc5d20e8fe05963f0a37badeb60c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df76b2db319868a0a792f4b923778d9a64eed94ba045185539ed49e99a1cc63a(
    value: typing.Optional[Ec2FleetSpotOptionsMaintenanceStrategies],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__58cce03acbdf1ddf0a69e5927a0343f0acfe4f9f628b02be07da705a164b29db(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9a52bb32c6db5796cf6580a9bed746548584162bb2d6c957283833223849037(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1495476c75ed3e60f48d63cc270762f93c3c711b831a127c7ffc342ed9f027bd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9f6cce37cb02fb62345e797e62bc6cac04f56f529269fbc94b98fc1ac6587d0(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ca946018751e0d6729b7ff52e5efccf7fe0ca9a419ea01435f6164acc337b31(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8c6c748f24e5c929b6622b75773025bd1b802f312f83ffebb1f33ab0820fae0(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__813be52de28ab62bbc27969f38e19e4b7f906d6c5d8eb0325c08b9e65d616a41(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a65b4be8938371e6b9dec5bec8a9ae100282092cdacae305b9d7da859290444a(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ffa74fefce2fc29533e0c0a253deecf2897fb0e04d6d1d6e808f7ed236a5550c(
    value: typing.Optional[Ec2FleetSpotOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d73101bc338713bd6105d79c66e087b23cffe5b5f01247e98edbc25f050ff175(
    *,
    default_target_capacity_type: builtins.str,
    total_target_capacity: jsii.Number,
    on_demand_target_capacity: typing.Optional[jsii.Number] = None,
    spot_target_capacity: typing.Optional[jsii.Number] = None,
    target_capacity_unit_type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fff8a4e121cf1ae87d0349e5cd5178af59c7433991a75fccb02e364db8202bc9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eed9ace8e8d26b4c16b4b1159950e0d7a31857de25ce62b2b5bccc484a9b8882(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3bc9a7157ab652aed13f9814f1cf58edc13b06f605a6e2b5796c257d59ac62f8(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0e789771ca8089fdb791cda08583dc4b10c3bab1ad49fddc86ceeca636905e6(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99aeb4ab6eaab6f5917433de09cf043b595e70181318f4671c10000a9dae0fee(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db9de949834972e567c2bbe980ac118fccdeea49783f1ceb29669d7f451e20e3(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5927dd08ca13ab4066c915b50200d9913fb1ed6d041f7fa08b6ba91a89993266(
    value: typing.Optional[Ec2FleetTargetCapacitySpecification],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6406b6550d91a12f2601b8247493d02d6e94a9303b1ed9f097d928fe302d0eee(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c12d4dd3456dca0acc705c7edbc31ac0c4d2e8e6b0bf03b8cc7b9d6d6fd4fc2b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0406be953d1d83b76ae8b5f5717a1e144a5361ebb78d14de8fbf9440771740b8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99e26ae9042bb85a3f55628ad7e45f76048f3c9e028dfbc528f9a5d1e3a84bce(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1da442ed3125df0bba8af46627dccabc3fa090b840a40f9b0027bda29ed960cf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6475f6e4946fd53ad3c839f569ba6ea9d0c8c0e471a1b480b2fec63b1a022427(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Ec2FleetTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
