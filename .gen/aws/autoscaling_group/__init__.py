r'''
# `aws_autoscaling_group`

Refer to the Terraform Registry for docs: [`aws_autoscaling_group`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group).
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


class AutoscalingGroup(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroup",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group aws_autoscaling_group}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        max_size: jsii.Number,
        min_size: jsii.Number,
        availability_zone_distribution: typing.Optional[typing.Union["AutoscalingGroupAvailabilityZoneDistribution", typing.Dict[builtins.str, typing.Any]]] = None,
        availability_zones: typing.Optional[typing.Sequence[builtins.str]] = None,
        capacity_rebalance: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        capacity_reservation_specification: typing.Optional[typing.Union["AutoscalingGroupCapacityReservationSpecification", typing.Dict[builtins.str, typing.Any]]] = None,
        context: typing.Optional[builtins.str] = None,
        default_cooldown: typing.Optional[jsii.Number] = None,
        default_instance_warmup: typing.Optional[jsii.Number] = None,
        desired_capacity: typing.Optional[jsii.Number] = None,
        desired_capacity_type: typing.Optional[builtins.str] = None,
        enabled_metrics: typing.Optional[typing.Sequence[builtins.str]] = None,
        force_delete: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        force_delete_warm_pool: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        health_check_grace_period: typing.Optional[jsii.Number] = None,
        health_check_type: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        ignore_failed_scaling_activities: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        initial_lifecycle_hook: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AutoscalingGroupInitialLifecycleHook", typing.Dict[builtins.str, typing.Any]]]]] = None,
        instance_maintenance_policy: typing.Optional[typing.Union["AutoscalingGroupInstanceMaintenancePolicy", typing.Dict[builtins.str, typing.Any]]] = None,
        instance_refresh: typing.Optional[typing.Union["AutoscalingGroupInstanceRefresh", typing.Dict[builtins.str, typing.Any]]] = None,
        launch_configuration: typing.Optional[builtins.str] = None,
        launch_template: typing.Optional[typing.Union["AutoscalingGroupLaunchTemplate", typing.Dict[builtins.str, typing.Any]]] = None,
        load_balancers: typing.Optional[typing.Sequence[builtins.str]] = None,
        max_instance_lifetime: typing.Optional[jsii.Number] = None,
        metrics_granularity: typing.Optional[builtins.str] = None,
        min_elb_capacity: typing.Optional[jsii.Number] = None,
        mixed_instances_policy: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicy", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        placement_group: typing.Optional[builtins.str] = None,
        protect_from_scale_in: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        service_linked_role_arn: typing.Optional[builtins.str] = None,
        suspended_processes: typing.Optional[typing.Sequence[builtins.str]] = None,
        tag: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AutoscalingGroupTag", typing.Dict[builtins.str, typing.Any]]]]] = None,
        target_group_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
        termination_policies: typing.Optional[typing.Sequence[builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["AutoscalingGroupTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        traffic_source: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AutoscalingGroupTrafficSource", typing.Dict[builtins.str, typing.Any]]]]] = None,
        vpc_zone_identifier: typing.Optional[typing.Sequence[builtins.str]] = None,
        wait_for_capacity_timeout: typing.Optional[builtins.str] = None,
        wait_for_elb_capacity: typing.Optional[jsii.Number] = None,
        warm_pool: typing.Optional[typing.Union["AutoscalingGroupWarmPool", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group aws_autoscaling_group} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param max_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_size AutoscalingGroup#max_size}.
        :param min_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_size AutoscalingGroup#min_size}.
        :param availability_zone_distribution: availability_zone_distribution block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zone_distribution AutoscalingGroup#availability_zone_distribution}
        :param availability_zones: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zones AutoscalingGroup#availability_zones}.
        :param capacity_rebalance: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_rebalance AutoscalingGroup#capacity_rebalance}.
        :param capacity_reservation_specification: capacity_reservation_specification block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_specification AutoscalingGroup#capacity_reservation_specification}
        :param context: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#context AutoscalingGroup#context}.
        :param default_cooldown: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_cooldown AutoscalingGroup#default_cooldown}.
        :param default_instance_warmup: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_instance_warmup AutoscalingGroup#default_instance_warmup}.
        :param desired_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity AutoscalingGroup#desired_capacity}.
        :param desired_capacity_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity_type AutoscalingGroup#desired_capacity_type}.
        :param enabled_metrics: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#enabled_metrics AutoscalingGroup#enabled_metrics}.
        :param force_delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete AutoscalingGroup#force_delete}.
        :param force_delete_warm_pool: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete_warm_pool AutoscalingGroup#force_delete_warm_pool}.
        :param health_check_grace_period: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_grace_period AutoscalingGroup#health_check_grace_period}.
        :param health_check_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_type AutoscalingGroup#health_check_type}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#id AutoscalingGroup#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param ignore_failed_scaling_activities: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#ignore_failed_scaling_activities AutoscalingGroup#ignore_failed_scaling_activities}.
        :param initial_lifecycle_hook: initial_lifecycle_hook block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#initial_lifecycle_hook AutoscalingGroup#initial_lifecycle_hook}
        :param instance_maintenance_policy: instance_maintenance_policy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_maintenance_policy AutoscalingGroup#instance_maintenance_policy}
        :param instance_refresh: instance_refresh block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_refresh AutoscalingGroup#instance_refresh}
        :param launch_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_configuration AutoscalingGroup#launch_configuration}.
        :param launch_template: launch_template block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template AutoscalingGroup#launch_template}
        :param load_balancers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#load_balancers AutoscalingGroup#load_balancers}.
        :param max_instance_lifetime: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_instance_lifetime AutoscalingGroup#max_instance_lifetime}.
        :param metrics_granularity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#metrics_granularity AutoscalingGroup#metrics_granularity}.
        :param min_elb_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_elb_capacity AutoscalingGroup#min_elb_capacity}.
        :param mixed_instances_policy: mixed_instances_policy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#mixed_instances_policy AutoscalingGroup#mixed_instances_policy}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name AutoscalingGroup#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name_prefix AutoscalingGroup#name_prefix}.
        :param placement_group: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#placement_group AutoscalingGroup#placement_group}.
        :param protect_from_scale_in: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#protect_from_scale_in AutoscalingGroup#protect_from_scale_in}.
        :param service_linked_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#service_linked_role_arn AutoscalingGroup#service_linked_role_arn}.
        :param suspended_processes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#suspended_processes AutoscalingGroup#suspended_processes}.
        :param tag: tag block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#tag AutoscalingGroup#tag}
        :param target_group_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#target_group_arns AutoscalingGroup#target_group_arns}.
        :param termination_policies: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#termination_policies AutoscalingGroup#termination_policies}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#timeouts AutoscalingGroup#timeouts}
        :param traffic_source: traffic_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#traffic_source AutoscalingGroup#traffic_source}
        :param vpc_zone_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#vpc_zone_identifier AutoscalingGroup#vpc_zone_identifier}.
        :param wait_for_capacity_timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_capacity_timeout AutoscalingGroup#wait_for_capacity_timeout}.
        :param wait_for_elb_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_elb_capacity AutoscalingGroup#wait_for_elb_capacity}.
        :param warm_pool: warm_pool block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#warm_pool AutoscalingGroup#warm_pool}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc60a750015678917ef7bc59a6c6c70568e9808733949153f65dfb7d9a7effa0)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = AutoscalingGroupConfig(
            max_size=max_size,
            min_size=min_size,
            availability_zone_distribution=availability_zone_distribution,
            availability_zones=availability_zones,
            capacity_rebalance=capacity_rebalance,
            capacity_reservation_specification=capacity_reservation_specification,
            context=context,
            default_cooldown=default_cooldown,
            default_instance_warmup=default_instance_warmup,
            desired_capacity=desired_capacity,
            desired_capacity_type=desired_capacity_type,
            enabled_metrics=enabled_metrics,
            force_delete=force_delete,
            force_delete_warm_pool=force_delete_warm_pool,
            health_check_grace_period=health_check_grace_period,
            health_check_type=health_check_type,
            id=id,
            ignore_failed_scaling_activities=ignore_failed_scaling_activities,
            initial_lifecycle_hook=initial_lifecycle_hook,
            instance_maintenance_policy=instance_maintenance_policy,
            instance_refresh=instance_refresh,
            launch_configuration=launch_configuration,
            launch_template=launch_template,
            load_balancers=load_balancers,
            max_instance_lifetime=max_instance_lifetime,
            metrics_granularity=metrics_granularity,
            min_elb_capacity=min_elb_capacity,
            mixed_instances_policy=mixed_instances_policy,
            name=name,
            name_prefix=name_prefix,
            placement_group=placement_group,
            protect_from_scale_in=protect_from_scale_in,
            service_linked_role_arn=service_linked_role_arn,
            suspended_processes=suspended_processes,
            tag=tag,
            target_group_arns=target_group_arns,
            termination_policies=termination_policies,
            timeouts=timeouts,
            traffic_source=traffic_source,
            vpc_zone_identifier=vpc_zone_identifier,
            wait_for_capacity_timeout=wait_for_capacity_timeout,
            wait_for_elb_capacity=wait_for_elb_capacity,
            warm_pool=warm_pool,
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
        '''Generates CDKTF code for importing a AutoscalingGroup resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the AutoscalingGroup to import.
        :param import_from_id: The id of the existing AutoscalingGroup that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the AutoscalingGroup to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d8015046ddb611b1463b4f084c1906504556e6bd8f2418b2b9826905c8fcb75)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putAvailabilityZoneDistribution")
    def put_availability_zone_distribution(
        self,
        *,
        capacity_distribution_strategy: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param capacity_distribution_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_distribution_strategy AutoscalingGroup#capacity_distribution_strategy}.
        '''
        value = AutoscalingGroupAvailabilityZoneDistribution(
            capacity_distribution_strategy=capacity_distribution_strategy
        )

        return typing.cast(None, jsii.invoke(self, "putAvailabilityZoneDistribution", [value]))

    @jsii.member(jsii_name="putCapacityReservationSpecification")
    def put_capacity_reservation_specification(
        self,
        *,
        capacity_reservation_preference: typing.Optional[builtins.str] = None,
        capacity_reservation_target: typing.Optional[typing.Union["AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param capacity_reservation_preference: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_preference AutoscalingGroup#capacity_reservation_preference}.
        :param capacity_reservation_target: capacity_reservation_target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_target AutoscalingGroup#capacity_reservation_target}
        '''
        value = AutoscalingGroupCapacityReservationSpecification(
            capacity_reservation_preference=capacity_reservation_preference,
            capacity_reservation_target=capacity_reservation_target,
        )

        return typing.cast(None, jsii.invoke(self, "putCapacityReservationSpecification", [value]))

    @jsii.member(jsii_name="putInitialLifecycleHook")
    def put_initial_lifecycle_hook(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AutoscalingGroupInitialLifecycleHook", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96acacd3efd24f62b07182f9ef6f0bfcf452e0927038031a8728a8630fb5e906)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInitialLifecycleHook", [value]))

    @jsii.member(jsii_name="putInstanceMaintenancePolicy")
    def put_instance_maintenance_policy(
        self,
        *,
        max_healthy_percentage: jsii.Number,
        min_healthy_percentage: jsii.Number,
    ) -> None:
        '''
        :param max_healthy_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_healthy_percentage AutoscalingGroup#max_healthy_percentage}.
        :param min_healthy_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_healthy_percentage AutoscalingGroup#min_healthy_percentage}.
        '''
        value = AutoscalingGroupInstanceMaintenancePolicy(
            max_healthy_percentage=max_healthy_percentage,
            min_healthy_percentage=min_healthy_percentage,
        )

        return typing.cast(None, jsii.invoke(self, "putInstanceMaintenancePolicy", [value]))

    @jsii.member(jsii_name="putInstanceRefresh")
    def put_instance_refresh(
        self,
        *,
        strategy: builtins.str,
        preferences: typing.Optional[typing.Union["AutoscalingGroupInstanceRefreshPreferences", typing.Dict[builtins.str, typing.Any]]] = None,
        triggers: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#strategy AutoscalingGroup#strategy}.
        :param preferences: preferences block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#preferences AutoscalingGroup#preferences}
        :param triggers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#triggers AutoscalingGroup#triggers}.
        '''
        value = AutoscalingGroupInstanceRefresh(
            strategy=strategy, preferences=preferences, triggers=triggers
        )

        return typing.cast(None, jsii.invoke(self, "putInstanceRefresh", [value]))

    @jsii.member(jsii_name="putLaunchTemplate")
    def put_launch_template(
        self,
        *,
        id: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#id AutoscalingGroup#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name AutoscalingGroup#name}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#version AutoscalingGroup#version}.
        '''
        value = AutoscalingGroupLaunchTemplate(id=id, name=name, version=version)

        return typing.cast(None, jsii.invoke(self, "putLaunchTemplate", [value]))

    @jsii.member(jsii_name="putMixedInstancesPolicy")
    def put_mixed_instances_policy(
        self,
        *,
        launch_template: typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplate", typing.Dict[builtins.str, typing.Any]],
        instances_distribution: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyInstancesDistribution", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param launch_template: launch_template block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template AutoscalingGroup#launch_template}
        :param instances_distribution: instances_distribution block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instances_distribution AutoscalingGroup#instances_distribution}
        '''
        value = AutoscalingGroupMixedInstancesPolicy(
            launch_template=launch_template,
            instances_distribution=instances_distribution,
        )

        return typing.cast(None, jsii.invoke(self, "putMixedInstancesPolicy", [value]))

    @jsii.member(jsii_name="putTag")
    def put_tag(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AutoscalingGroupTag", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f013eddc2efca7832526ad4539c62f7ebb69667002beacb47f3f8e0e26f58965)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTag", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#delete AutoscalingGroup#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#update AutoscalingGroup#update}.
        '''
        value = AutoscalingGroupTimeouts(delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="putTrafficSource")
    def put_traffic_source(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AutoscalingGroupTrafficSource", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a0c8e1b7cae37f7c5b998c93a650387169d372f6c9eeeaeef6e464300d1d566d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTrafficSource", [value]))

    @jsii.member(jsii_name="putWarmPool")
    def put_warm_pool(
        self,
        *,
        instance_reuse_policy: typing.Optional[typing.Union["AutoscalingGroupWarmPoolInstanceReusePolicy", typing.Dict[builtins.str, typing.Any]]] = None,
        max_group_prepared_capacity: typing.Optional[jsii.Number] = None,
        min_size: typing.Optional[jsii.Number] = None,
        pool_state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_reuse_policy: instance_reuse_policy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_reuse_policy AutoscalingGroup#instance_reuse_policy}
        :param max_group_prepared_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_group_prepared_capacity AutoscalingGroup#max_group_prepared_capacity}.
        :param min_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_size AutoscalingGroup#min_size}.
        :param pool_state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#pool_state AutoscalingGroup#pool_state}.
        '''
        value = AutoscalingGroupWarmPool(
            instance_reuse_policy=instance_reuse_policy,
            max_group_prepared_capacity=max_group_prepared_capacity,
            min_size=min_size,
            pool_state=pool_state,
        )

        return typing.cast(None, jsii.invoke(self, "putWarmPool", [value]))

    @jsii.member(jsii_name="resetAvailabilityZoneDistribution")
    def reset_availability_zone_distribution(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityZoneDistribution", []))

    @jsii.member(jsii_name="resetAvailabilityZones")
    def reset_availability_zones(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityZones", []))

    @jsii.member(jsii_name="resetCapacityRebalance")
    def reset_capacity_rebalance(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCapacityRebalance", []))

    @jsii.member(jsii_name="resetCapacityReservationSpecification")
    def reset_capacity_reservation_specification(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCapacityReservationSpecification", []))

    @jsii.member(jsii_name="resetContext")
    def reset_context(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContext", []))

    @jsii.member(jsii_name="resetDefaultCooldown")
    def reset_default_cooldown(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultCooldown", []))

    @jsii.member(jsii_name="resetDefaultInstanceWarmup")
    def reset_default_instance_warmup(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultInstanceWarmup", []))

    @jsii.member(jsii_name="resetDesiredCapacity")
    def reset_desired_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDesiredCapacity", []))

    @jsii.member(jsii_name="resetDesiredCapacityType")
    def reset_desired_capacity_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDesiredCapacityType", []))

    @jsii.member(jsii_name="resetEnabledMetrics")
    def reset_enabled_metrics(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnabledMetrics", []))

    @jsii.member(jsii_name="resetForceDelete")
    def reset_force_delete(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetForceDelete", []))

    @jsii.member(jsii_name="resetForceDeleteWarmPool")
    def reset_force_delete_warm_pool(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetForceDeleteWarmPool", []))

    @jsii.member(jsii_name="resetHealthCheckGracePeriod")
    def reset_health_check_grace_period(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHealthCheckGracePeriod", []))

    @jsii.member(jsii_name="resetHealthCheckType")
    def reset_health_check_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHealthCheckType", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetIgnoreFailedScalingActivities")
    def reset_ignore_failed_scaling_activities(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIgnoreFailedScalingActivities", []))

    @jsii.member(jsii_name="resetInitialLifecycleHook")
    def reset_initial_lifecycle_hook(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInitialLifecycleHook", []))

    @jsii.member(jsii_name="resetInstanceMaintenancePolicy")
    def reset_instance_maintenance_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceMaintenancePolicy", []))

    @jsii.member(jsii_name="resetInstanceRefresh")
    def reset_instance_refresh(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceRefresh", []))

    @jsii.member(jsii_name="resetLaunchConfiguration")
    def reset_launch_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLaunchConfiguration", []))

    @jsii.member(jsii_name="resetLaunchTemplate")
    def reset_launch_template(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLaunchTemplate", []))

    @jsii.member(jsii_name="resetLoadBalancers")
    def reset_load_balancers(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLoadBalancers", []))

    @jsii.member(jsii_name="resetMaxInstanceLifetime")
    def reset_max_instance_lifetime(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxInstanceLifetime", []))

    @jsii.member(jsii_name="resetMetricsGranularity")
    def reset_metrics_granularity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMetricsGranularity", []))

    @jsii.member(jsii_name="resetMinElbCapacity")
    def reset_min_elb_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinElbCapacity", []))

    @jsii.member(jsii_name="resetMixedInstancesPolicy")
    def reset_mixed_instances_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMixedInstancesPolicy", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetNamePrefix")
    def reset_name_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNamePrefix", []))

    @jsii.member(jsii_name="resetPlacementGroup")
    def reset_placement_group(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPlacementGroup", []))

    @jsii.member(jsii_name="resetProtectFromScaleIn")
    def reset_protect_from_scale_in(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProtectFromScaleIn", []))

    @jsii.member(jsii_name="resetServiceLinkedRoleArn")
    def reset_service_linked_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetServiceLinkedRoleArn", []))

    @jsii.member(jsii_name="resetSuspendedProcesses")
    def reset_suspended_processes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSuspendedProcesses", []))

    @jsii.member(jsii_name="resetTag")
    def reset_tag(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTag", []))

    @jsii.member(jsii_name="resetTargetGroupArns")
    def reset_target_group_arns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetGroupArns", []))

    @jsii.member(jsii_name="resetTerminationPolicies")
    def reset_termination_policies(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTerminationPolicies", []))

    @jsii.member(jsii_name="resetTimeouts")
    def reset_timeouts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeouts", []))

    @jsii.member(jsii_name="resetTrafficSource")
    def reset_traffic_source(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTrafficSource", []))

    @jsii.member(jsii_name="resetVpcZoneIdentifier")
    def reset_vpc_zone_identifier(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVpcZoneIdentifier", []))

    @jsii.member(jsii_name="resetWaitForCapacityTimeout")
    def reset_wait_for_capacity_timeout(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWaitForCapacityTimeout", []))

    @jsii.member(jsii_name="resetWaitForElbCapacity")
    def reset_wait_for_elb_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWaitForElbCapacity", []))

    @jsii.member(jsii_name="resetWarmPool")
    def reset_warm_pool(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWarmPool", []))

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
    @jsii.member(jsii_name="availabilityZoneDistribution")
    def availability_zone_distribution(
        self,
    ) -> "AutoscalingGroupAvailabilityZoneDistributionOutputReference":
        return typing.cast("AutoscalingGroupAvailabilityZoneDistributionOutputReference", jsii.get(self, "availabilityZoneDistribution"))

    @builtins.property
    @jsii.member(jsii_name="capacityReservationSpecification")
    def capacity_reservation_specification(
        self,
    ) -> "AutoscalingGroupCapacityReservationSpecificationOutputReference":
        return typing.cast("AutoscalingGroupCapacityReservationSpecificationOutputReference", jsii.get(self, "capacityReservationSpecification"))

    @builtins.property
    @jsii.member(jsii_name="initialLifecycleHook")
    def initial_lifecycle_hook(self) -> "AutoscalingGroupInitialLifecycleHookList":
        return typing.cast("AutoscalingGroupInitialLifecycleHookList", jsii.get(self, "initialLifecycleHook"))

    @builtins.property
    @jsii.member(jsii_name="instanceMaintenancePolicy")
    def instance_maintenance_policy(
        self,
    ) -> "AutoscalingGroupInstanceMaintenancePolicyOutputReference":
        return typing.cast("AutoscalingGroupInstanceMaintenancePolicyOutputReference", jsii.get(self, "instanceMaintenancePolicy"))

    @builtins.property
    @jsii.member(jsii_name="instanceRefresh")
    def instance_refresh(self) -> "AutoscalingGroupInstanceRefreshOutputReference":
        return typing.cast("AutoscalingGroupInstanceRefreshOutputReference", jsii.get(self, "instanceRefresh"))

    @builtins.property
    @jsii.member(jsii_name="launchTemplate")
    def launch_template(self) -> "AutoscalingGroupLaunchTemplateOutputReference":
        return typing.cast("AutoscalingGroupLaunchTemplateOutputReference", jsii.get(self, "launchTemplate"))

    @builtins.property
    @jsii.member(jsii_name="mixedInstancesPolicy")
    def mixed_instances_policy(
        self,
    ) -> "AutoscalingGroupMixedInstancesPolicyOutputReference":
        return typing.cast("AutoscalingGroupMixedInstancesPolicyOutputReference", jsii.get(self, "mixedInstancesPolicy"))

    @builtins.property
    @jsii.member(jsii_name="predictedCapacity")
    def predicted_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "predictedCapacity"))

    @builtins.property
    @jsii.member(jsii_name="tag")
    def tag(self) -> "AutoscalingGroupTagList":
        return typing.cast("AutoscalingGroupTagList", jsii.get(self, "tag"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "AutoscalingGroupTimeoutsOutputReference":
        return typing.cast("AutoscalingGroupTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="trafficSource")
    def traffic_source(self) -> "AutoscalingGroupTrafficSourceList":
        return typing.cast("AutoscalingGroupTrafficSourceList", jsii.get(self, "trafficSource"))

    @builtins.property
    @jsii.member(jsii_name="warmPool")
    def warm_pool(self) -> "AutoscalingGroupWarmPoolOutputReference":
        return typing.cast("AutoscalingGroupWarmPoolOutputReference", jsii.get(self, "warmPool"))

    @builtins.property
    @jsii.member(jsii_name="warmPoolSize")
    def warm_pool_size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "warmPoolSize"))

    @builtins.property
    @jsii.member(jsii_name="availabilityZoneDistributionInput")
    def availability_zone_distribution_input(
        self,
    ) -> typing.Optional["AutoscalingGroupAvailabilityZoneDistribution"]:
        return typing.cast(typing.Optional["AutoscalingGroupAvailabilityZoneDistribution"], jsii.get(self, "availabilityZoneDistributionInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityZonesInput")
    def availability_zones_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "availabilityZonesInput"))

    @builtins.property
    @jsii.member(jsii_name="capacityRebalanceInput")
    def capacity_rebalance_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "capacityRebalanceInput"))

    @builtins.property
    @jsii.member(jsii_name="capacityReservationSpecificationInput")
    def capacity_reservation_specification_input(
        self,
    ) -> typing.Optional["AutoscalingGroupCapacityReservationSpecification"]:
        return typing.cast(typing.Optional["AutoscalingGroupCapacityReservationSpecification"], jsii.get(self, "capacityReservationSpecificationInput"))

    @builtins.property
    @jsii.member(jsii_name="contextInput")
    def context_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contextInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultCooldownInput")
    def default_cooldown_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "defaultCooldownInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultInstanceWarmupInput")
    def default_instance_warmup_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "defaultInstanceWarmupInput"))

    @builtins.property
    @jsii.member(jsii_name="desiredCapacityInput")
    def desired_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "desiredCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="desiredCapacityTypeInput")
    def desired_capacity_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "desiredCapacityTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="enabledMetricsInput")
    def enabled_metrics_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "enabledMetricsInput"))

    @builtins.property
    @jsii.member(jsii_name="forceDeleteInput")
    def force_delete_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "forceDeleteInput"))

    @builtins.property
    @jsii.member(jsii_name="forceDeleteWarmPoolInput")
    def force_delete_warm_pool_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "forceDeleteWarmPoolInput"))

    @builtins.property
    @jsii.member(jsii_name="healthCheckGracePeriodInput")
    def health_check_grace_period_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "healthCheckGracePeriodInput"))

    @builtins.property
    @jsii.member(jsii_name="healthCheckTypeInput")
    def health_check_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "healthCheckTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="ignoreFailedScalingActivitiesInput")
    def ignore_failed_scaling_activities_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "ignoreFailedScalingActivitiesInput"))

    @builtins.property
    @jsii.member(jsii_name="initialLifecycleHookInput")
    def initial_lifecycle_hook_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupInitialLifecycleHook"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupInitialLifecycleHook"]]], jsii.get(self, "initialLifecycleHookInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceMaintenancePolicyInput")
    def instance_maintenance_policy_input(
        self,
    ) -> typing.Optional["AutoscalingGroupInstanceMaintenancePolicy"]:
        return typing.cast(typing.Optional["AutoscalingGroupInstanceMaintenancePolicy"], jsii.get(self, "instanceMaintenancePolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceRefreshInput")
    def instance_refresh_input(
        self,
    ) -> typing.Optional["AutoscalingGroupInstanceRefresh"]:
        return typing.cast(typing.Optional["AutoscalingGroupInstanceRefresh"], jsii.get(self, "instanceRefreshInput"))

    @builtins.property
    @jsii.member(jsii_name="launchConfigurationInput")
    def launch_configuration_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "launchConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateInput")
    def launch_template_input(
        self,
    ) -> typing.Optional["AutoscalingGroupLaunchTemplate"]:
        return typing.cast(typing.Optional["AutoscalingGroupLaunchTemplate"], jsii.get(self, "launchTemplateInput"))

    @builtins.property
    @jsii.member(jsii_name="loadBalancersInput")
    def load_balancers_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "loadBalancersInput"))

    @builtins.property
    @jsii.member(jsii_name="maxInstanceLifetimeInput")
    def max_instance_lifetime_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxInstanceLifetimeInput"))

    @builtins.property
    @jsii.member(jsii_name="maxSizeInput")
    def max_size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxSizeInput"))

    @builtins.property
    @jsii.member(jsii_name="metricsGranularityInput")
    def metrics_granularity_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "metricsGranularityInput"))

    @builtins.property
    @jsii.member(jsii_name="minElbCapacityInput")
    def min_elb_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minElbCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="minSizeInput")
    def min_size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minSizeInput"))

    @builtins.property
    @jsii.member(jsii_name="mixedInstancesPolicyInput")
    def mixed_instances_policy_input(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicy"]:
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicy"], jsii.get(self, "mixedInstancesPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="namePrefixInput")
    def name_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "namePrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="placementGroupInput")
    def placement_group_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "placementGroupInput"))

    @builtins.property
    @jsii.member(jsii_name="protectFromScaleInInput")
    def protect_from_scale_in_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "protectFromScaleInInput"))

    @builtins.property
    @jsii.member(jsii_name="serviceLinkedRoleArnInput")
    def service_linked_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "serviceLinkedRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="suspendedProcessesInput")
    def suspended_processes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "suspendedProcessesInput"))

    @builtins.property
    @jsii.member(jsii_name="tagInput")
    def tag_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupTag"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupTag"]]], jsii.get(self, "tagInput"))

    @builtins.property
    @jsii.member(jsii_name="targetGroupArnsInput")
    def target_group_arns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "targetGroupArnsInput"))

    @builtins.property
    @jsii.member(jsii_name="terminationPoliciesInput")
    def termination_policies_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "terminationPoliciesInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "AutoscalingGroupTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "AutoscalingGroupTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="trafficSourceInput")
    def traffic_source_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupTrafficSource"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupTrafficSource"]]], jsii.get(self, "trafficSourceInput"))

    @builtins.property
    @jsii.member(jsii_name="vpcZoneIdentifierInput")
    def vpc_zone_identifier_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "vpcZoneIdentifierInput"))

    @builtins.property
    @jsii.member(jsii_name="waitForCapacityTimeoutInput")
    def wait_for_capacity_timeout_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "waitForCapacityTimeoutInput"))

    @builtins.property
    @jsii.member(jsii_name="waitForElbCapacityInput")
    def wait_for_elb_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "waitForElbCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="warmPoolInput")
    def warm_pool_input(self) -> typing.Optional["AutoscalingGroupWarmPool"]:
        return typing.cast(typing.Optional["AutoscalingGroupWarmPool"], jsii.get(self, "warmPoolInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityZones")
    def availability_zones(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "availabilityZones"))

    @availability_zones.setter
    def availability_zones(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5366fd23f5a754b230e7799a228718e27f37d42bfd2b772d1adf6d68fe180943)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityZones", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="capacityRebalance")
    def capacity_rebalance(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "capacityRebalance"))

    @capacity_rebalance.setter
    def capacity_rebalance(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b8fcbe25b9defc4ebe682db2a0ac7d9c6c2279ab47e5252cb0753a1f03cc8e33)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "capacityRebalance", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="context")
    def context(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "context"))

    @context.setter
    def context(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a6906919755407ff5e1c1f55c4e3096c5c7c7db9c9ffff7724aceaaa9556b749)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "context", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="defaultCooldown")
    def default_cooldown(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "defaultCooldown"))

    @default_cooldown.setter
    def default_cooldown(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__894d9bf1782c16c74ad3083d97ab3de767ed864a75c5b058ea34088f2c47c250)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultCooldown", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="defaultInstanceWarmup")
    def default_instance_warmup(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "defaultInstanceWarmup"))

    @default_instance_warmup.setter
    def default_instance_warmup(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6726893d1e789753bb6a03cad79e6db60153161503bee3cf3afd5ec3796f2a6e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultInstanceWarmup", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="desiredCapacity")
    def desired_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "desiredCapacity"))

    @desired_capacity.setter
    def desired_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab952b2d4e8dea42d3a065983ad3e826da1b94c1e303a74eefe6173c403661c2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "desiredCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="desiredCapacityType")
    def desired_capacity_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "desiredCapacityType"))

    @desired_capacity_type.setter
    def desired_capacity_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2390fc22c6c8143d2525fd3b9b76dc63618de29eb5c9148890a43d2176aca628)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "desiredCapacityType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enabledMetrics")
    def enabled_metrics(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "enabledMetrics"))

    @enabled_metrics.setter
    def enabled_metrics(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__809fc9f9e78be5319309c9f70f26cd66885d2218a7aea86d4e5a40c3d373542e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabledMetrics", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="forceDelete")
    def force_delete(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "forceDelete"))

    @force_delete.setter
    def force_delete(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ade7e41f54d7c2c5f849439cf5a69cec6410991c05b47a34795fd45755933d8e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "forceDelete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="forceDeleteWarmPool")
    def force_delete_warm_pool(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "forceDeleteWarmPool"))

    @force_delete_warm_pool.setter
    def force_delete_warm_pool(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9ed016bbc155c7cdcdf1034b30a65078f4bfe9ed7dd654029110f81c165025d3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "forceDeleteWarmPool", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="healthCheckGracePeriod")
    def health_check_grace_period(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "healthCheckGracePeriod"))

    @health_check_grace_period.setter
    def health_check_grace_period(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__250eeb23b4a4c44317148a24b511cb3c55df45732a03603c58bb9a600520c6b9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "healthCheckGracePeriod", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="healthCheckType")
    def health_check_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "healthCheckType"))

    @health_check_type.setter
    def health_check_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b1a1dc35d20328873e0f9d567d19e69dab18f074e5e7e1a3b1686489118b747)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "healthCheckType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cadf5dca8d512e40831e831b4107c66e01e21599d3879a5e78bd3f733f446b47)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ignoreFailedScalingActivities")
    def ignore_failed_scaling_activities(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "ignoreFailedScalingActivities"))

    @ignore_failed_scaling_activities.setter
    def ignore_failed_scaling_activities(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e4f6a00e49d412482d44c0311794a4856dff638389b3185f55bbe3f58a03d20)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ignoreFailedScalingActivities", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="launchConfiguration")
    def launch_configuration(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "launchConfiguration"))

    @launch_configuration.setter
    def launch_configuration(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7195d09867dcbb507ce445938f1428eede1560c5de2b020fed5e83f679f41bc6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "launchConfiguration", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="loadBalancers")
    def load_balancers(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "loadBalancers"))

    @load_balancers.setter
    def load_balancers(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__998118813b10fd3c06a86bc6304addf847c8db68dba799f7c94bfa7a8370f4fc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "loadBalancers", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxInstanceLifetime")
    def max_instance_lifetime(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxInstanceLifetime"))

    @max_instance_lifetime.setter
    def max_instance_lifetime(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e70c4a8d3ccfc2a467ed95d3bd92d18e9f2b79afbc1c79c56a0bda5b5f84b5e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxInstanceLifetime", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxSize")
    def max_size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxSize"))

    @max_size.setter
    def max_size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__196d5ae0c23b6ac2a92d9d5255c0284aa7d29ce3be59c9d1c4d96b9437a9d978)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxSize", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="metricsGranularity")
    def metrics_granularity(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "metricsGranularity"))

    @metrics_granularity.setter
    def metrics_granularity(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3aaec2b7d4e5185ff19e111ee8a504d18f1da14a7251486f2cf62bece7b4528c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "metricsGranularity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minElbCapacity")
    def min_elb_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minElbCapacity"))

    @min_elb_capacity.setter
    def min_elb_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9aa55452ad44136b8cc3724b89432a7f7464f70e625e69f3f34859d6bc456ce5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minElbCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minSize")
    def min_size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minSize"))

    @min_size.setter
    def min_size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7a0798cc516adc98e8fd728f0833b2bd8df672257cfa1d56ef24c3c5a16ceecb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minSize", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__992ffec32464f123c17eace68e92c66aea8052c133f213aa1c8bff4a8844f71c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="namePrefix")
    def name_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "namePrefix"))

    @name_prefix.setter
    def name_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4075057685879b58be88e97fd066d1f371d52f6b22eab83319d3fcb9e1368a3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "namePrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="placementGroup")
    def placement_group(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "placementGroup"))

    @placement_group.setter
    def placement_group(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__35781dcf56586fee98dfded5942e1f8f99318e736b5eb9af77b211f95a59427e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "placementGroup", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="protectFromScaleIn")
    def protect_from_scale_in(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "protectFromScaleIn"))

    @protect_from_scale_in.setter
    def protect_from_scale_in(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b37a8cdb990aff91fa5a8a08f70c1dc16f7e7ecbf33af3a799d44aefdc1e397)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "protectFromScaleIn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="serviceLinkedRoleArn")
    def service_linked_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "serviceLinkedRoleArn"))

    @service_linked_role_arn.setter
    def service_linked_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dccfd8c3e7cc7d6cb79c4c5fa0deb221f90e40a1faca0dfb75bedaa1853cc681)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "serviceLinkedRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="suspendedProcesses")
    def suspended_processes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "suspendedProcesses"))

    @suspended_processes.setter
    def suspended_processes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a937c73874d69a134180958e85911dab44a47aa3191abad53d365dbffc2bb311)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "suspendedProcesses", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="targetGroupArns")
    def target_group_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "targetGroupArns"))

    @target_group_arns.setter
    def target_group_arns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c88d518aacf921c79772f525acd4efc400fc9538e298d92639da705a9b1419c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetGroupArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="terminationPolicies")
    def termination_policies(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "terminationPolicies"))

    @termination_policies.setter
    def termination_policies(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d29d511c33f3eff2f1e48801d587dc534ca8dbd8f7ad0ab530b2fd56c9e3c5ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terminationPolicies", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="vpcZoneIdentifier")
    def vpc_zone_identifier(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "vpcZoneIdentifier"))

    @vpc_zone_identifier.setter
    def vpc_zone_identifier(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c510b2791cbedd762a72775b0d0c7b2cddeeef2c9659b537fc851dccffc35786)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "vpcZoneIdentifier", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="waitForCapacityTimeout")
    def wait_for_capacity_timeout(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "waitForCapacityTimeout"))

    @wait_for_capacity_timeout.setter
    def wait_for_capacity_timeout(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__92b7638c3b322882530c00c205751371c49b9646f237c3e972672098a4c9b5d4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "waitForCapacityTimeout", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="waitForElbCapacity")
    def wait_for_elb_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "waitForElbCapacity"))

    @wait_for_elb_capacity.setter
    def wait_for_elb_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6a5d1af2feeb437a918baf0203c27dcc89f0cee5e08e051d05b127a177103e26)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "waitForElbCapacity", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupAvailabilityZoneDistribution",
    jsii_struct_bases=[],
    name_mapping={"capacity_distribution_strategy": "capacityDistributionStrategy"},
)
class AutoscalingGroupAvailabilityZoneDistribution:
    def __init__(
        self,
        *,
        capacity_distribution_strategy: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param capacity_distribution_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_distribution_strategy AutoscalingGroup#capacity_distribution_strategy}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9f4bbccd1e20a86dd59e8b8cc8ad8dd138d75ca5d7bd5153f4c09b66d38556ba)
            check_type(argname="argument capacity_distribution_strategy", value=capacity_distribution_strategy, expected_type=type_hints["capacity_distribution_strategy"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if capacity_distribution_strategy is not None:
            self._values["capacity_distribution_strategy"] = capacity_distribution_strategy

    @builtins.property
    def capacity_distribution_strategy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_distribution_strategy AutoscalingGroup#capacity_distribution_strategy}.'''
        result = self._values.get("capacity_distribution_strategy")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupAvailabilityZoneDistribution(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupAvailabilityZoneDistributionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupAvailabilityZoneDistributionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4cefbfcc4fa7d2b0c325d5e8a25e5b5a2bd794fe0bcbd3004371b53ce714ca57)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCapacityDistributionStrategy")
    def reset_capacity_distribution_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCapacityDistributionStrategy", []))

    @builtins.property
    @jsii.member(jsii_name="capacityDistributionStrategyInput")
    def capacity_distribution_strategy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "capacityDistributionStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="capacityDistributionStrategy")
    def capacity_distribution_strategy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "capacityDistributionStrategy"))

    @capacity_distribution_strategy.setter
    def capacity_distribution_strategy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9fadbcab0f5b76b5051ec9d25fe80d8330e660014b65960285c105a3191840a5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "capacityDistributionStrategy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupAvailabilityZoneDistribution]:
        return typing.cast(typing.Optional[AutoscalingGroupAvailabilityZoneDistribution], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupAvailabilityZoneDistribution],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__55f03ac7fc847cc0fd0b8a7bd6c321eae9a6ace36831f162a5f0bc8156a81bad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupCapacityReservationSpecification",
    jsii_struct_bases=[],
    name_mapping={
        "capacity_reservation_preference": "capacityReservationPreference",
        "capacity_reservation_target": "capacityReservationTarget",
    },
)
class AutoscalingGroupCapacityReservationSpecification:
    def __init__(
        self,
        *,
        capacity_reservation_preference: typing.Optional[builtins.str] = None,
        capacity_reservation_target: typing.Optional[typing.Union["AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param capacity_reservation_preference: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_preference AutoscalingGroup#capacity_reservation_preference}.
        :param capacity_reservation_target: capacity_reservation_target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_target AutoscalingGroup#capacity_reservation_target}
        '''
        if isinstance(capacity_reservation_target, dict):
            capacity_reservation_target = AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget(**capacity_reservation_target)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__58e1ad7b34b05a91bcfa57bb69b27395e6d8c75211f75eb0964bbaea5a8a6d5c)
            check_type(argname="argument capacity_reservation_preference", value=capacity_reservation_preference, expected_type=type_hints["capacity_reservation_preference"])
            check_type(argname="argument capacity_reservation_target", value=capacity_reservation_target, expected_type=type_hints["capacity_reservation_target"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if capacity_reservation_preference is not None:
            self._values["capacity_reservation_preference"] = capacity_reservation_preference
        if capacity_reservation_target is not None:
            self._values["capacity_reservation_target"] = capacity_reservation_target

    @builtins.property
    def capacity_reservation_preference(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_preference AutoscalingGroup#capacity_reservation_preference}.'''
        result = self._values.get("capacity_reservation_preference")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def capacity_reservation_target(
        self,
    ) -> typing.Optional["AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget"]:
        '''capacity_reservation_target block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_target AutoscalingGroup#capacity_reservation_target}
        '''
        result = self._values.get("capacity_reservation_target")
        return typing.cast(typing.Optional["AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupCapacityReservationSpecification(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget",
    jsii_struct_bases=[],
    name_mapping={
        "capacity_reservation_ids": "capacityReservationIds",
        "capacity_reservation_resource_group_arns": "capacityReservationResourceGroupArns",
    },
)
class AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget:
    def __init__(
        self,
        *,
        capacity_reservation_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        capacity_reservation_resource_group_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param capacity_reservation_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_ids AutoscalingGroup#capacity_reservation_ids}.
        :param capacity_reservation_resource_group_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_resource_group_arns AutoscalingGroup#capacity_reservation_resource_group_arns}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b6849998174d7cb686aeeba15e42c3710906516fb50fe9462916cd5d23da8c9)
            check_type(argname="argument capacity_reservation_ids", value=capacity_reservation_ids, expected_type=type_hints["capacity_reservation_ids"])
            check_type(argname="argument capacity_reservation_resource_group_arns", value=capacity_reservation_resource_group_arns, expected_type=type_hints["capacity_reservation_resource_group_arns"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if capacity_reservation_ids is not None:
            self._values["capacity_reservation_ids"] = capacity_reservation_ids
        if capacity_reservation_resource_group_arns is not None:
            self._values["capacity_reservation_resource_group_arns"] = capacity_reservation_resource_group_arns

    @builtins.property
    def capacity_reservation_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_ids AutoscalingGroup#capacity_reservation_ids}.'''
        result = self._values.get("capacity_reservation_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def capacity_reservation_resource_group_arns(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_resource_group_arns AutoscalingGroup#capacity_reservation_resource_group_arns}.'''
        result = self._values.get("capacity_reservation_resource_group_arns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupCapacityReservationSpecificationCapacityReservationTargetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupCapacityReservationSpecificationCapacityReservationTargetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f69d88751898d31c077933cc875e47507b45f565e6a4a0ae561a27aeb0ec1d65)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCapacityReservationIds")
    def reset_capacity_reservation_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCapacityReservationIds", []))

    @jsii.member(jsii_name="resetCapacityReservationResourceGroupArns")
    def reset_capacity_reservation_resource_group_arns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCapacityReservationResourceGroupArns", []))

    @builtins.property
    @jsii.member(jsii_name="capacityReservationIdsInput")
    def capacity_reservation_ids_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "capacityReservationIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="capacityReservationResourceGroupArnsInput")
    def capacity_reservation_resource_group_arns_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "capacityReservationResourceGroupArnsInput"))

    @builtins.property
    @jsii.member(jsii_name="capacityReservationIds")
    def capacity_reservation_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "capacityReservationIds"))

    @capacity_reservation_ids.setter
    def capacity_reservation_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b420f2a9fe93057794b82f58cf2aad778132522a47bd2e93dc4919a26d4901b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "capacityReservationIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="capacityReservationResourceGroupArns")
    def capacity_reservation_resource_group_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "capacityReservationResourceGroupArns"))

    @capacity_reservation_resource_group_arns.setter
    def capacity_reservation_resource_group_arns(
        self,
        value: typing.List[builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__00c3886f87357038aeb093d8d7140bbb3ef21d96a7872479227c2502b0b0d0b1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "capacityReservationResourceGroupArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget]:
        return typing.cast(typing.Optional[AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b34a459cd9011cf3c338b48bb11639d730fd9e61b278ed0b81365e29e91dd3d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AutoscalingGroupCapacityReservationSpecificationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupCapacityReservationSpecificationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c48e32fc249b9d5adee83e5cbb09ff52bc4db19cf1b97cc274c15d8d043c47c7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCapacityReservationTarget")
    def put_capacity_reservation_target(
        self,
        *,
        capacity_reservation_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        capacity_reservation_resource_group_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param capacity_reservation_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_ids AutoscalingGroup#capacity_reservation_ids}.
        :param capacity_reservation_resource_group_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_resource_group_arns AutoscalingGroup#capacity_reservation_resource_group_arns}.
        '''
        value = AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget(
            capacity_reservation_ids=capacity_reservation_ids,
            capacity_reservation_resource_group_arns=capacity_reservation_resource_group_arns,
        )

        return typing.cast(None, jsii.invoke(self, "putCapacityReservationTarget", [value]))

    @jsii.member(jsii_name="resetCapacityReservationPreference")
    def reset_capacity_reservation_preference(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCapacityReservationPreference", []))

    @jsii.member(jsii_name="resetCapacityReservationTarget")
    def reset_capacity_reservation_target(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCapacityReservationTarget", []))

    @builtins.property
    @jsii.member(jsii_name="capacityReservationTarget")
    def capacity_reservation_target(
        self,
    ) -> AutoscalingGroupCapacityReservationSpecificationCapacityReservationTargetOutputReference:
        return typing.cast(AutoscalingGroupCapacityReservationSpecificationCapacityReservationTargetOutputReference, jsii.get(self, "capacityReservationTarget"))

    @builtins.property
    @jsii.member(jsii_name="capacityReservationPreferenceInput")
    def capacity_reservation_preference_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "capacityReservationPreferenceInput"))

    @builtins.property
    @jsii.member(jsii_name="capacityReservationTargetInput")
    def capacity_reservation_target_input(
        self,
    ) -> typing.Optional[AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget]:
        return typing.cast(typing.Optional[AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget], jsii.get(self, "capacityReservationTargetInput"))

    @builtins.property
    @jsii.member(jsii_name="capacityReservationPreference")
    def capacity_reservation_preference(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "capacityReservationPreference"))

    @capacity_reservation_preference.setter
    def capacity_reservation_preference(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac105d6ff67050cf9de9ecbf358a927a692b40871983b4a0031dfab5b6a544b8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "capacityReservationPreference", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupCapacityReservationSpecification]:
        return typing.cast(typing.Optional[AutoscalingGroupCapacityReservationSpecification], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupCapacityReservationSpecification],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__23385ee061b8edc971ae0901935ea05912410de0ea0fd9c31abf0feb75e6e3c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "max_size": "maxSize",
        "min_size": "minSize",
        "availability_zone_distribution": "availabilityZoneDistribution",
        "availability_zones": "availabilityZones",
        "capacity_rebalance": "capacityRebalance",
        "capacity_reservation_specification": "capacityReservationSpecification",
        "context": "context",
        "default_cooldown": "defaultCooldown",
        "default_instance_warmup": "defaultInstanceWarmup",
        "desired_capacity": "desiredCapacity",
        "desired_capacity_type": "desiredCapacityType",
        "enabled_metrics": "enabledMetrics",
        "force_delete": "forceDelete",
        "force_delete_warm_pool": "forceDeleteWarmPool",
        "health_check_grace_period": "healthCheckGracePeriod",
        "health_check_type": "healthCheckType",
        "id": "id",
        "ignore_failed_scaling_activities": "ignoreFailedScalingActivities",
        "initial_lifecycle_hook": "initialLifecycleHook",
        "instance_maintenance_policy": "instanceMaintenancePolicy",
        "instance_refresh": "instanceRefresh",
        "launch_configuration": "launchConfiguration",
        "launch_template": "launchTemplate",
        "load_balancers": "loadBalancers",
        "max_instance_lifetime": "maxInstanceLifetime",
        "metrics_granularity": "metricsGranularity",
        "min_elb_capacity": "minElbCapacity",
        "mixed_instances_policy": "mixedInstancesPolicy",
        "name": "name",
        "name_prefix": "namePrefix",
        "placement_group": "placementGroup",
        "protect_from_scale_in": "protectFromScaleIn",
        "service_linked_role_arn": "serviceLinkedRoleArn",
        "suspended_processes": "suspendedProcesses",
        "tag": "tag",
        "target_group_arns": "targetGroupArns",
        "termination_policies": "terminationPolicies",
        "timeouts": "timeouts",
        "traffic_source": "trafficSource",
        "vpc_zone_identifier": "vpcZoneIdentifier",
        "wait_for_capacity_timeout": "waitForCapacityTimeout",
        "wait_for_elb_capacity": "waitForElbCapacity",
        "warm_pool": "warmPool",
    },
)
class AutoscalingGroupConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        max_size: jsii.Number,
        min_size: jsii.Number,
        availability_zone_distribution: typing.Optional[typing.Union[AutoscalingGroupAvailabilityZoneDistribution, typing.Dict[builtins.str, typing.Any]]] = None,
        availability_zones: typing.Optional[typing.Sequence[builtins.str]] = None,
        capacity_rebalance: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        capacity_reservation_specification: typing.Optional[typing.Union[AutoscalingGroupCapacityReservationSpecification, typing.Dict[builtins.str, typing.Any]]] = None,
        context: typing.Optional[builtins.str] = None,
        default_cooldown: typing.Optional[jsii.Number] = None,
        default_instance_warmup: typing.Optional[jsii.Number] = None,
        desired_capacity: typing.Optional[jsii.Number] = None,
        desired_capacity_type: typing.Optional[builtins.str] = None,
        enabled_metrics: typing.Optional[typing.Sequence[builtins.str]] = None,
        force_delete: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        force_delete_warm_pool: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        health_check_grace_period: typing.Optional[jsii.Number] = None,
        health_check_type: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        ignore_failed_scaling_activities: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        initial_lifecycle_hook: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AutoscalingGroupInitialLifecycleHook", typing.Dict[builtins.str, typing.Any]]]]] = None,
        instance_maintenance_policy: typing.Optional[typing.Union["AutoscalingGroupInstanceMaintenancePolicy", typing.Dict[builtins.str, typing.Any]]] = None,
        instance_refresh: typing.Optional[typing.Union["AutoscalingGroupInstanceRefresh", typing.Dict[builtins.str, typing.Any]]] = None,
        launch_configuration: typing.Optional[builtins.str] = None,
        launch_template: typing.Optional[typing.Union["AutoscalingGroupLaunchTemplate", typing.Dict[builtins.str, typing.Any]]] = None,
        load_balancers: typing.Optional[typing.Sequence[builtins.str]] = None,
        max_instance_lifetime: typing.Optional[jsii.Number] = None,
        metrics_granularity: typing.Optional[builtins.str] = None,
        min_elb_capacity: typing.Optional[jsii.Number] = None,
        mixed_instances_policy: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicy", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        placement_group: typing.Optional[builtins.str] = None,
        protect_from_scale_in: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        service_linked_role_arn: typing.Optional[builtins.str] = None,
        suspended_processes: typing.Optional[typing.Sequence[builtins.str]] = None,
        tag: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AutoscalingGroupTag", typing.Dict[builtins.str, typing.Any]]]]] = None,
        target_group_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
        termination_policies: typing.Optional[typing.Sequence[builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["AutoscalingGroupTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        traffic_source: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AutoscalingGroupTrafficSource", typing.Dict[builtins.str, typing.Any]]]]] = None,
        vpc_zone_identifier: typing.Optional[typing.Sequence[builtins.str]] = None,
        wait_for_capacity_timeout: typing.Optional[builtins.str] = None,
        wait_for_elb_capacity: typing.Optional[jsii.Number] = None,
        warm_pool: typing.Optional[typing.Union["AutoscalingGroupWarmPool", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param max_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_size AutoscalingGroup#max_size}.
        :param min_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_size AutoscalingGroup#min_size}.
        :param availability_zone_distribution: availability_zone_distribution block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zone_distribution AutoscalingGroup#availability_zone_distribution}
        :param availability_zones: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zones AutoscalingGroup#availability_zones}.
        :param capacity_rebalance: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_rebalance AutoscalingGroup#capacity_rebalance}.
        :param capacity_reservation_specification: capacity_reservation_specification block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_specification AutoscalingGroup#capacity_reservation_specification}
        :param context: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#context AutoscalingGroup#context}.
        :param default_cooldown: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_cooldown AutoscalingGroup#default_cooldown}.
        :param default_instance_warmup: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_instance_warmup AutoscalingGroup#default_instance_warmup}.
        :param desired_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity AutoscalingGroup#desired_capacity}.
        :param desired_capacity_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity_type AutoscalingGroup#desired_capacity_type}.
        :param enabled_metrics: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#enabled_metrics AutoscalingGroup#enabled_metrics}.
        :param force_delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete AutoscalingGroup#force_delete}.
        :param force_delete_warm_pool: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete_warm_pool AutoscalingGroup#force_delete_warm_pool}.
        :param health_check_grace_period: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_grace_period AutoscalingGroup#health_check_grace_period}.
        :param health_check_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_type AutoscalingGroup#health_check_type}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#id AutoscalingGroup#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param ignore_failed_scaling_activities: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#ignore_failed_scaling_activities AutoscalingGroup#ignore_failed_scaling_activities}.
        :param initial_lifecycle_hook: initial_lifecycle_hook block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#initial_lifecycle_hook AutoscalingGroup#initial_lifecycle_hook}
        :param instance_maintenance_policy: instance_maintenance_policy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_maintenance_policy AutoscalingGroup#instance_maintenance_policy}
        :param instance_refresh: instance_refresh block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_refresh AutoscalingGroup#instance_refresh}
        :param launch_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_configuration AutoscalingGroup#launch_configuration}.
        :param launch_template: launch_template block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template AutoscalingGroup#launch_template}
        :param load_balancers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#load_balancers AutoscalingGroup#load_balancers}.
        :param max_instance_lifetime: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_instance_lifetime AutoscalingGroup#max_instance_lifetime}.
        :param metrics_granularity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#metrics_granularity AutoscalingGroup#metrics_granularity}.
        :param min_elb_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_elb_capacity AutoscalingGroup#min_elb_capacity}.
        :param mixed_instances_policy: mixed_instances_policy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#mixed_instances_policy AutoscalingGroup#mixed_instances_policy}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name AutoscalingGroup#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name_prefix AutoscalingGroup#name_prefix}.
        :param placement_group: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#placement_group AutoscalingGroup#placement_group}.
        :param protect_from_scale_in: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#protect_from_scale_in AutoscalingGroup#protect_from_scale_in}.
        :param service_linked_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#service_linked_role_arn AutoscalingGroup#service_linked_role_arn}.
        :param suspended_processes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#suspended_processes AutoscalingGroup#suspended_processes}.
        :param tag: tag block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#tag AutoscalingGroup#tag}
        :param target_group_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#target_group_arns AutoscalingGroup#target_group_arns}.
        :param termination_policies: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#termination_policies AutoscalingGroup#termination_policies}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#timeouts AutoscalingGroup#timeouts}
        :param traffic_source: traffic_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#traffic_source AutoscalingGroup#traffic_source}
        :param vpc_zone_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#vpc_zone_identifier AutoscalingGroup#vpc_zone_identifier}.
        :param wait_for_capacity_timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_capacity_timeout AutoscalingGroup#wait_for_capacity_timeout}.
        :param wait_for_elb_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_elb_capacity AutoscalingGroup#wait_for_elb_capacity}.
        :param warm_pool: warm_pool block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#warm_pool AutoscalingGroup#warm_pool}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(availability_zone_distribution, dict):
            availability_zone_distribution = AutoscalingGroupAvailabilityZoneDistribution(**availability_zone_distribution)
        if isinstance(capacity_reservation_specification, dict):
            capacity_reservation_specification = AutoscalingGroupCapacityReservationSpecification(**capacity_reservation_specification)
        if isinstance(instance_maintenance_policy, dict):
            instance_maintenance_policy = AutoscalingGroupInstanceMaintenancePolicy(**instance_maintenance_policy)
        if isinstance(instance_refresh, dict):
            instance_refresh = AutoscalingGroupInstanceRefresh(**instance_refresh)
        if isinstance(launch_template, dict):
            launch_template = AutoscalingGroupLaunchTemplate(**launch_template)
        if isinstance(mixed_instances_policy, dict):
            mixed_instances_policy = AutoscalingGroupMixedInstancesPolicy(**mixed_instances_policy)
        if isinstance(timeouts, dict):
            timeouts = AutoscalingGroupTimeouts(**timeouts)
        if isinstance(warm_pool, dict):
            warm_pool = AutoscalingGroupWarmPool(**warm_pool)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d160886e1f5ffa51f26af05628a6a22b95f92e1ba716671376b94d477f95ed64)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument max_size", value=max_size, expected_type=type_hints["max_size"])
            check_type(argname="argument min_size", value=min_size, expected_type=type_hints["min_size"])
            check_type(argname="argument availability_zone_distribution", value=availability_zone_distribution, expected_type=type_hints["availability_zone_distribution"])
            check_type(argname="argument availability_zones", value=availability_zones, expected_type=type_hints["availability_zones"])
            check_type(argname="argument capacity_rebalance", value=capacity_rebalance, expected_type=type_hints["capacity_rebalance"])
            check_type(argname="argument capacity_reservation_specification", value=capacity_reservation_specification, expected_type=type_hints["capacity_reservation_specification"])
            check_type(argname="argument context", value=context, expected_type=type_hints["context"])
            check_type(argname="argument default_cooldown", value=default_cooldown, expected_type=type_hints["default_cooldown"])
            check_type(argname="argument default_instance_warmup", value=default_instance_warmup, expected_type=type_hints["default_instance_warmup"])
            check_type(argname="argument desired_capacity", value=desired_capacity, expected_type=type_hints["desired_capacity"])
            check_type(argname="argument desired_capacity_type", value=desired_capacity_type, expected_type=type_hints["desired_capacity_type"])
            check_type(argname="argument enabled_metrics", value=enabled_metrics, expected_type=type_hints["enabled_metrics"])
            check_type(argname="argument force_delete", value=force_delete, expected_type=type_hints["force_delete"])
            check_type(argname="argument force_delete_warm_pool", value=force_delete_warm_pool, expected_type=type_hints["force_delete_warm_pool"])
            check_type(argname="argument health_check_grace_period", value=health_check_grace_period, expected_type=type_hints["health_check_grace_period"])
            check_type(argname="argument health_check_type", value=health_check_type, expected_type=type_hints["health_check_type"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument ignore_failed_scaling_activities", value=ignore_failed_scaling_activities, expected_type=type_hints["ignore_failed_scaling_activities"])
            check_type(argname="argument initial_lifecycle_hook", value=initial_lifecycle_hook, expected_type=type_hints["initial_lifecycle_hook"])
            check_type(argname="argument instance_maintenance_policy", value=instance_maintenance_policy, expected_type=type_hints["instance_maintenance_policy"])
            check_type(argname="argument instance_refresh", value=instance_refresh, expected_type=type_hints["instance_refresh"])
            check_type(argname="argument launch_configuration", value=launch_configuration, expected_type=type_hints["launch_configuration"])
            check_type(argname="argument launch_template", value=launch_template, expected_type=type_hints["launch_template"])
            check_type(argname="argument load_balancers", value=load_balancers, expected_type=type_hints["load_balancers"])
            check_type(argname="argument max_instance_lifetime", value=max_instance_lifetime, expected_type=type_hints["max_instance_lifetime"])
            check_type(argname="argument metrics_granularity", value=metrics_granularity, expected_type=type_hints["metrics_granularity"])
            check_type(argname="argument min_elb_capacity", value=min_elb_capacity, expected_type=type_hints["min_elb_capacity"])
            check_type(argname="argument mixed_instances_policy", value=mixed_instances_policy, expected_type=type_hints["mixed_instances_policy"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument name_prefix", value=name_prefix, expected_type=type_hints["name_prefix"])
            check_type(argname="argument placement_group", value=placement_group, expected_type=type_hints["placement_group"])
            check_type(argname="argument protect_from_scale_in", value=protect_from_scale_in, expected_type=type_hints["protect_from_scale_in"])
            check_type(argname="argument service_linked_role_arn", value=service_linked_role_arn, expected_type=type_hints["service_linked_role_arn"])
            check_type(argname="argument suspended_processes", value=suspended_processes, expected_type=type_hints["suspended_processes"])
            check_type(argname="argument tag", value=tag, expected_type=type_hints["tag"])
            check_type(argname="argument target_group_arns", value=target_group_arns, expected_type=type_hints["target_group_arns"])
            check_type(argname="argument termination_policies", value=termination_policies, expected_type=type_hints["termination_policies"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
            check_type(argname="argument traffic_source", value=traffic_source, expected_type=type_hints["traffic_source"])
            check_type(argname="argument vpc_zone_identifier", value=vpc_zone_identifier, expected_type=type_hints["vpc_zone_identifier"])
            check_type(argname="argument wait_for_capacity_timeout", value=wait_for_capacity_timeout, expected_type=type_hints["wait_for_capacity_timeout"])
            check_type(argname="argument wait_for_elb_capacity", value=wait_for_elb_capacity, expected_type=type_hints["wait_for_elb_capacity"])
            check_type(argname="argument warm_pool", value=warm_pool, expected_type=type_hints["warm_pool"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "max_size": max_size,
            "min_size": min_size,
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
        if availability_zone_distribution is not None:
            self._values["availability_zone_distribution"] = availability_zone_distribution
        if availability_zones is not None:
            self._values["availability_zones"] = availability_zones
        if capacity_rebalance is not None:
            self._values["capacity_rebalance"] = capacity_rebalance
        if capacity_reservation_specification is not None:
            self._values["capacity_reservation_specification"] = capacity_reservation_specification
        if context is not None:
            self._values["context"] = context
        if default_cooldown is not None:
            self._values["default_cooldown"] = default_cooldown
        if default_instance_warmup is not None:
            self._values["default_instance_warmup"] = default_instance_warmup
        if desired_capacity is not None:
            self._values["desired_capacity"] = desired_capacity
        if desired_capacity_type is not None:
            self._values["desired_capacity_type"] = desired_capacity_type
        if enabled_metrics is not None:
            self._values["enabled_metrics"] = enabled_metrics
        if force_delete is not None:
            self._values["force_delete"] = force_delete
        if force_delete_warm_pool is not None:
            self._values["force_delete_warm_pool"] = force_delete_warm_pool
        if health_check_grace_period is not None:
            self._values["health_check_grace_period"] = health_check_grace_period
        if health_check_type is not None:
            self._values["health_check_type"] = health_check_type
        if id is not None:
            self._values["id"] = id
        if ignore_failed_scaling_activities is not None:
            self._values["ignore_failed_scaling_activities"] = ignore_failed_scaling_activities
        if initial_lifecycle_hook is not None:
            self._values["initial_lifecycle_hook"] = initial_lifecycle_hook
        if instance_maintenance_policy is not None:
            self._values["instance_maintenance_policy"] = instance_maintenance_policy
        if instance_refresh is not None:
            self._values["instance_refresh"] = instance_refresh
        if launch_configuration is not None:
            self._values["launch_configuration"] = launch_configuration
        if launch_template is not None:
            self._values["launch_template"] = launch_template
        if load_balancers is not None:
            self._values["load_balancers"] = load_balancers
        if max_instance_lifetime is not None:
            self._values["max_instance_lifetime"] = max_instance_lifetime
        if metrics_granularity is not None:
            self._values["metrics_granularity"] = metrics_granularity
        if min_elb_capacity is not None:
            self._values["min_elb_capacity"] = min_elb_capacity
        if mixed_instances_policy is not None:
            self._values["mixed_instances_policy"] = mixed_instances_policy
        if name is not None:
            self._values["name"] = name
        if name_prefix is not None:
            self._values["name_prefix"] = name_prefix
        if placement_group is not None:
            self._values["placement_group"] = placement_group
        if protect_from_scale_in is not None:
            self._values["protect_from_scale_in"] = protect_from_scale_in
        if service_linked_role_arn is not None:
            self._values["service_linked_role_arn"] = service_linked_role_arn
        if suspended_processes is not None:
            self._values["suspended_processes"] = suspended_processes
        if tag is not None:
            self._values["tag"] = tag
        if target_group_arns is not None:
            self._values["target_group_arns"] = target_group_arns
        if termination_policies is not None:
            self._values["termination_policies"] = termination_policies
        if timeouts is not None:
            self._values["timeouts"] = timeouts
        if traffic_source is not None:
            self._values["traffic_source"] = traffic_source
        if vpc_zone_identifier is not None:
            self._values["vpc_zone_identifier"] = vpc_zone_identifier
        if wait_for_capacity_timeout is not None:
            self._values["wait_for_capacity_timeout"] = wait_for_capacity_timeout
        if wait_for_elb_capacity is not None:
            self._values["wait_for_elb_capacity"] = wait_for_elb_capacity
        if warm_pool is not None:
            self._values["warm_pool"] = warm_pool

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
    def max_size(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_size AutoscalingGroup#max_size}.'''
        result = self._values.get("max_size")
        assert result is not None, "Required property 'max_size' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def min_size(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_size AutoscalingGroup#min_size}.'''
        result = self._values.get("min_size")
        assert result is not None, "Required property 'min_size' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def availability_zone_distribution(
        self,
    ) -> typing.Optional[AutoscalingGroupAvailabilityZoneDistribution]:
        '''availability_zone_distribution block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zone_distribution AutoscalingGroup#availability_zone_distribution}
        '''
        result = self._values.get("availability_zone_distribution")
        return typing.cast(typing.Optional[AutoscalingGroupAvailabilityZoneDistribution], result)

    @builtins.property
    def availability_zones(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#availability_zones AutoscalingGroup#availability_zones}.'''
        result = self._values.get("availability_zones")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def capacity_rebalance(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_rebalance AutoscalingGroup#capacity_rebalance}.'''
        result = self._values.get("capacity_rebalance")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def capacity_reservation_specification(
        self,
    ) -> typing.Optional[AutoscalingGroupCapacityReservationSpecification]:
        '''capacity_reservation_specification block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_specification AutoscalingGroup#capacity_reservation_specification}
        '''
        result = self._values.get("capacity_reservation_specification")
        return typing.cast(typing.Optional[AutoscalingGroupCapacityReservationSpecification], result)

    @builtins.property
    def context(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#context AutoscalingGroup#context}.'''
        result = self._values.get("context")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def default_cooldown(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_cooldown AutoscalingGroup#default_cooldown}.'''
        result = self._values.get("default_cooldown")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def default_instance_warmup(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_instance_warmup AutoscalingGroup#default_instance_warmup}.'''
        result = self._values.get("default_instance_warmup")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def desired_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity AutoscalingGroup#desired_capacity}.'''
        result = self._values.get("desired_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def desired_capacity_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#desired_capacity_type AutoscalingGroup#desired_capacity_type}.'''
        result = self._values.get("desired_capacity_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def enabled_metrics(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#enabled_metrics AutoscalingGroup#enabled_metrics}.'''
        result = self._values.get("enabled_metrics")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def force_delete(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete AutoscalingGroup#force_delete}.'''
        result = self._values.get("force_delete")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def force_delete_warm_pool(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#force_delete_warm_pool AutoscalingGroup#force_delete_warm_pool}.'''
        result = self._values.get("force_delete_warm_pool")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def health_check_grace_period(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_grace_period AutoscalingGroup#health_check_grace_period}.'''
        result = self._values.get("health_check_grace_period")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def health_check_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#health_check_type AutoscalingGroup#health_check_type}.'''
        result = self._values.get("health_check_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#id AutoscalingGroup#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ignore_failed_scaling_activities(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#ignore_failed_scaling_activities AutoscalingGroup#ignore_failed_scaling_activities}.'''
        result = self._values.get("ignore_failed_scaling_activities")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def initial_lifecycle_hook(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupInitialLifecycleHook"]]]:
        '''initial_lifecycle_hook block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#initial_lifecycle_hook AutoscalingGroup#initial_lifecycle_hook}
        '''
        result = self._values.get("initial_lifecycle_hook")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupInitialLifecycleHook"]]], result)

    @builtins.property
    def instance_maintenance_policy(
        self,
    ) -> typing.Optional["AutoscalingGroupInstanceMaintenancePolicy"]:
        '''instance_maintenance_policy block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_maintenance_policy AutoscalingGroup#instance_maintenance_policy}
        '''
        result = self._values.get("instance_maintenance_policy")
        return typing.cast(typing.Optional["AutoscalingGroupInstanceMaintenancePolicy"], result)

    @builtins.property
    def instance_refresh(self) -> typing.Optional["AutoscalingGroupInstanceRefresh"]:
        '''instance_refresh block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_refresh AutoscalingGroup#instance_refresh}
        '''
        result = self._values.get("instance_refresh")
        return typing.cast(typing.Optional["AutoscalingGroupInstanceRefresh"], result)

    @builtins.property
    def launch_configuration(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_configuration AutoscalingGroup#launch_configuration}.'''
        result = self._values.get("launch_configuration")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def launch_template(self) -> typing.Optional["AutoscalingGroupLaunchTemplate"]:
        '''launch_template block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template AutoscalingGroup#launch_template}
        '''
        result = self._values.get("launch_template")
        return typing.cast(typing.Optional["AutoscalingGroupLaunchTemplate"], result)

    @builtins.property
    def load_balancers(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#load_balancers AutoscalingGroup#load_balancers}.'''
        result = self._values.get("load_balancers")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def max_instance_lifetime(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_instance_lifetime AutoscalingGroup#max_instance_lifetime}.'''
        result = self._values.get("max_instance_lifetime")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def metrics_granularity(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#metrics_granularity AutoscalingGroup#metrics_granularity}.'''
        result = self._values.get("metrics_granularity")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def min_elb_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_elb_capacity AutoscalingGroup#min_elb_capacity}.'''
        result = self._values.get("min_elb_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def mixed_instances_policy(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicy"]:
        '''mixed_instances_policy block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#mixed_instances_policy AutoscalingGroup#mixed_instances_policy}
        '''
        result = self._values.get("mixed_instances_policy")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicy"], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name AutoscalingGroup#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name_prefix AutoscalingGroup#name_prefix}.'''
        result = self._values.get("name_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def placement_group(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#placement_group AutoscalingGroup#placement_group}.'''
        result = self._values.get("placement_group")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def protect_from_scale_in(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#protect_from_scale_in AutoscalingGroup#protect_from_scale_in}.'''
        result = self._values.get("protect_from_scale_in")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def service_linked_role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#service_linked_role_arn AutoscalingGroup#service_linked_role_arn}.'''
        result = self._values.get("service_linked_role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def suspended_processes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#suspended_processes AutoscalingGroup#suspended_processes}.'''
        result = self._values.get("suspended_processes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def tag(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupTag"]]]:
        '''tag block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#tag AutoscalingGroup#tag}
        '''
        result = self._values.get("tag")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupTag"]]], result)

    @builtins.property
    def target_group_arns(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#target_group_arns AutoscalingGroup#target_group_arns}.'''
        result = self._values.get("target_group_arns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def termination_policies(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#termination_policies AutoscalingGroup#termination_policies}.'''
        result = self._values.get("termination_policies")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["AutoscalingGroupTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#timeouts AutoscalingGroup#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["AutoscalingGroupTimeouts"], result)

    @builtins.property
    def traffic_source(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupTrafficSource"]]]:
        '''traffic_source block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#traffic_source AutoscalingGroup#traffic_source}
        '''
        result = self._values.get("traffic_source")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupTrafficSource"]]], result)

    @builtins.property
    def vpc_zone_identifier(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#vpc_zone_identifier AutoscalingGroup#vpc_zone_identifier}.'''
        result = self._values.get("vpc_zone_identifier")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def wait_for_capacity_timeout(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_capacity_timeout AutoscalingGroup#wait_for_capacity_timeout}.'''
        result = self._values.get("wait_for_capacity_timeout")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def wait_for_elb_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#wait_for_elb_capacity AutoscalingGroup#wait_for_elb_capacity}.'''
        result = self._values.get("wait_for_elb_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def warm_pool(self) -> typing.Optional["AutoscalingGroupWarmPool"]:
        '''warm_pool block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#warm_pool AutoscalingGroup#warm_pool}
        '''
        result = self._values.get("warm_pool")
        return typing.cast(typing.Optional["AutoscalingGroupWarmPool"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupInitialLifecycleHook",
    jsii_struct_bases=[],
    name_mapping={
        "lifecycle_transition": "lifecycleTransition",
        "name": "name",
        "default_result": "defaultResult",
        "heartbeat_timeout": "heartbeatTimeout",
        "notification_metadata": "notificationMetadata",
        "notification_target_arn": "notificationTargetArn",
        "role_arn": "roleArn",
    },
)
class AutoscalingGroupInitialLifecycleHook:
    def __init__(
        self,
        *,
        lifecycle_transition: builtins.str,
        name: builtins.str,
        default_result: typing.Optional[builtins.str] = None,
        heartbeat_timeout: typing.Optional[jsii.Number] = None,
        notification_metadata: typing.Optional[builtins.str] = None,
        notification_target_arn: typing.Optional[builtins.str] = None,
        role_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param lifecycle_transition: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#lifecycle_transition AutoscalingGroup#lifecycle_transition}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name AutoscalingGroup#name}.
        :param default_result: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_result AutoscalingGroup#default_result}.
        :param heartbeat_timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#heartbeat_timeout AutoscalingGroup#heartbeat_timeout}.
        :param notification_metadata: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#notification_metadata AutoscalingGroup#notification_metadata}.
        :param notification_target_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#notification_target_arn AutoscalingGroup#notification_target_arn}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#role_arn AutoscalingGroup#role_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__95cda0cce35aa0b728c1081f09f6672c97ebe5be85ddea9ea913361f4433b10e)
            check_type(argname="argument lifecycle_transition", value=lifecycle_transition, expected_type=type_hints["lifecycle_transition"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument default_result", value=default_result, expected_type=type_hints["default_result"])
            check_type(argname="argument heartbeat_timeout", value=heartbeat_timeout, expected_type=type_hints["heartbeat_timeout"])
            check_type(argname="argument notification_metadata", value=notification_metadata, expected_type=type_hints["notification_metadata"])
            check_type(argname="argument notification_target_arn", value=notification_target_arn, expected_type=type_hints["notification_target_arn"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "lifecycle_transition": lifecycle_transition,
            "name": name,
        }
        if default_result is not None:
            self._values["default_result"] = default_result
        if heartbeat_timeout is not None:
            self._values["heartbeat_timeout"] = heartbeat_timeout
        if notification_metadata is not None:
            self._values["notification_metadata"] = notification_metadata
        if notification_target_arn is not None:
            self._values["notification_target_arn"] = notification_target_arn
        if role_arn is not None:
            self._values["role_arn"] = role_arn

    @builtins.property
    def lifecycle_transition(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#lifecycle_transition AutoscalingGroup#lifecycle_transition}.'''
        result = self._values.get("lifecycle_transition")
        assert result is not None, "Required property 'lifecycle_transition' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name AutoscalingGroup#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def default_result(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#default_result AutoscalingGroup#default_result}.'''
        result = self._values.get("default_result")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def heartbeat_timeout(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#heartbeat_timeout AutoscalingGroup#heartbeat_timeout}.'''
        result = self._values.get("heartbeat_timeout")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def notification_metadata(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#notification_metadata AutoscalingGroup#notification_metadata}.'''
        result = self._values.get("notification_metadata")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def notification_target_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#notification_target_arn AutoscalingGroup#notification_target_arn}.'''
        result = self._values.get("notification_target_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#role_arn AutoscalingGroup#role_arn}.'''
        result = self._values.get("role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupInitialLifecycleHook(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupInitialLifecycleHookList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupInitialLifecycleHookList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4854486a2f700069483d4960d137ca30f1e21873d408d45cfde0d9478aa1bbf5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "AutoscalingGroupInitialLifecycleHookOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__308d32abc6cbcf0335682377c111fd629fe55473c6202e041c273985402ad468)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("AutoscalingGroupInitialLifecycleHookOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1dff6a488f14f600200845bc28def9a8320a3982857e80eeda50b853a68fcdf1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0aa512a62b1d760792269fcc517fe610a1fb02eb4e7cc8596fe71773dc50e973)
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
            type_hints = typing.get_type_hints(_typecheckingstub__907341431e8afeba48ecff7e66b0dee0a2a896e12abbc48db5a9b922993bbccc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupInitialLifecycleHook]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupInitialLifecycleHook]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupInitialLifecycleHook]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__123497ac4a21e7a956d50375b77f3900aff429b3121d73f1dc2c281321ce0949)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AutoscalingGroupInitialLifecycleHookOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupInitialLifecycleHookOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__720f76cd7e44d31ada31ea68cc23c99ab17596448e2a055dfcdc50c7e1af9637)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetDefaultResult")
    def reset_default_result(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultResult", []))

    @jsii.member(jsii_name="resetHeartbeatTimeout")
    def reset_heartbeat_timeout(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHeartbeatTimeout", []))

    @jsii.member(jsii_name="resetNotificationMetadata")
    def reset_notification_metadata(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNotificationMetadata", []))

    @jsii.member(jsii_name="resetNotificationTargetArn")
    def reset_notification_target_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNotificationTargetArn", []))

    @jsii.member(jsii_name="resetRoleArn")
    def reset_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoleArn", []))

    @builtins.property
    @jsii.member(jsii_name="defaultResultInput")
    def default_result_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultResultInput"))

    @builtins.property
    @jsii.member(jsii_name="heartbeatTimeoutInput")
    def heartbeat_timeout_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "heartbeatTimeoutInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleTransitionInput")
    def lifecycle_transition_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lifecycleTransitionInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="notificationMetadataInput")
    def notification_metadata_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "notificationMetadataInput"))

    @builtins.property
    @jsii.member(jsii_name="notificationTargetArnInput")
    def notification_target_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "notificationTargetArnInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultResult")
    def default_result(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultResult"))

    @default_result.setter
    def default_result(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a6b596a4e7da5567f68418abb704a34b6dbfb8c136920e1e4436e600638b504f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultResult", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="heartbeatTimeout")
    def heartbeat_timeout(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "heartbeatTimeout"))

    @heartbeat_timeout.setter
    def heartbeat_timeout(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__212aba3d617f507bf5f4559929f7201dd83a1144ebe543d3244a8919800b5867)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "heartbeatTimeout", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleTransition")
    def lifecycle_transition(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleTransition"))

    @lifecycle_transition.setter
    def lifecycle_transition(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__206344a10a326f319931ffcf4c035b747b5467b8e5dda2972bef5df905baa4a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleTransition", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dbe6957122679cf4f5c045e48b14d373692b389512af362a1498d917a4c6f4f7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="notificationMetadata")
    def notification_metadata(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "notificationMetadata"))

    @notification_metadata.setter
    def notification_metadata(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5dcec611a170ac90a62b708ac8cec651029ee3f34a679ffa5bc7eec817b2de50)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "notificationMetadata", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="notificationTargetArn")
    def notification_target_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "notificationTargetArn"))

    @notification_target_arn.setter
    def notification_target_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__977c1cd64c4e2e220ec06e30f29932d88784eaddceddecbf172bf140340c4109)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "notificationTargetArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c9d697dc3bf85879e17fb03020afbe0f29f741d5020b46c3f3311f7b1b6ff06)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupInitialLifecycleHook]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupInitialLifecycleHook]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupInitialLifecycleHook]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c360224d4fc3c6061fb2718edc6a2698c26ecd12efa8dc3e4ec0f8c328361115)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupInstanceMaintenancePolicy",
    jsii_struct_bases=[],
    name_mapping={
        "max_healthy_percentage": "maxHealthyPercentage",
        "min_healthy_percentage": "minHealthyPercentage",
    },
)
class AutoscalingGroupInstanceMaintenancePolicy:
    def __init__(
        self,
        *,
        max_healthy_percentage: jsii.Number,
        min_healthy_percentage: jsii.Number,
    ) -> None:
        '''
        :param max_healthy_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_healthy_percentage AutoscalingGroup#max_healthy_percentage}.
        :param min_healthy_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_healthy_percentage AutoscalingGroup#min_healthy_percentage}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__144a4385c25098beb0641290b3a32daa36ed92cef92907ec76ccb5d30e96d180)
            check_type(argname="argument max_healthy_percentage", value=max_healthy_percentage, expected_type=type_hints["max_healthy_percentage"])
            check_type(argname="argument min_healthy_percentage", value=min_healthy_percentage, expected_type=type_hints["min_healthy_percentage"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "max_healthy_percentage": max_healthy_percentage,
            "min_healthy_percentage": min_healthy_percentage,
        }

    @builtins.property
    def max_healthy_percentage(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_healthy_percentage AutoscalingGroup#max_healthy_percentage}.'''
        result = self._values.get("max_healthy_percentage")
        assert result is not None, "Required property 'max_healthy_percentage' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def min_healthy_percentage(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_healthy_percentage AutoscalingGroup#min_healthy_percentage}.'''
        result = self._values.get("min_healthy_percentage")
        assert result is not None, "Required property 'min_healthy_percentage' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupInstanceMaintenancePolicy(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupInstanceMaintenancePolicyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupInstanceMaintenancePolicyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__783a3ce8144d6362dd1edb44e125e85732f581d8c17421dbde6f3ece8e9fad9f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="maxHealthyPercentageInput")
    def max_healthy_percentage_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxHealthyPercentageInput"))

    @builtins.property
    @jsii.member(jsii_name="minHealthyPercentageInput")
    def min_healthy_percentage_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minHealthyPercentageInput"))

    @builtins.property
    @jsii.member(jsii_name="maxHealthyPercentage")
    def max_healthy_percentage(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxHealthyPercentage"))

    @max_healthy_percentage.setter
    def max_healthy_percentage(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c4cff067ebbcdbdf677dd2746df142aaeb7777e9a0ea264967e2ad2b3cf61e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxHealthyPercentage", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minHealthyPercentage")
    def min_healthy_percentage(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minHealthyPercentage"))

    @min_healthy_percentage.setter
    def min_healthy_percentage(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec6fbb5c482d1959ceaaaccdeeb5eda7a4959c4e86323f8fa33fad03fe12315b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minHealthyPercentage", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupInstanceMaintenancePolicy]:
        return typing.cast(typing.Optional[AutoscalingGroupInstanceMaintenancePolicy], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupInstanceMaintenancePolicy],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06207887a70467d39a3b90d8ef5371f53a15756914428276550e2711a2d42d34)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupInstanceRefresh",
    jsii_struct_bases=[],
    name_mapping={
        "strategy": "strategy",
        "preferences": "preferences",
        "triggers": "triggers",
    },
)
class AutoscalingGroupInstanceRefresh:
    def __init__(
        self,
        *,
        strategy: builtins.str,
        preferences: typing.Optional[typing.Union["AutoscalingGroupInstanceRefreshPreferences", typing.Dict[builtins.str, typing.Any]]] = None,
        triggers: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#strategy AutoscalingGroup#strategy}.
        :param preferences: preferences block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#preferences AutoscalingGroup#preferences}
        :param triggers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#triggers AutoscalingGroup#triggers}.
        '''
        if isinstance(preferences, dict):
            preferences = AutoscalingGroupInstanceRefreshPreferences(**preferences)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a88bff3974245747f4ab1dfff984ad56eea4b5678dea5554b53b7c4dc636c27)
            check_type(argname="argument strategy", value=strategy, expected_type=type_hints["strategy"])
            check_type(argname="argument preferences", value=preferences, expected_type=type_hints["preferences"])
            check_type(argname="argument triggers", value=triggers, expected_type=type_hints["triggers"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "strategy": strategy,
        }
        if preferences is not None:
            self._values["preferences"] = preferences
        if triggers is not None:
            self._values["triggers"] = triggers

    @builtins.property
    def strategy(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#strategy AutoscalingGroup#strategy}.'''
        result = self._values.get("strategy")
        assert result is not None, "Required property 'strategy' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def preferences(
        self,
    ) -> typing.Optional["AutoscalingGroupInstanceRefreshPreferences"]:
        '''preferences block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#preferences AutoscalingGroup#preferences}
        '''
        result = self._values.get("preferences")
        return typing.cast(typing.Optional["AutoscalingGroupInstanceRefreshPreferences"], result)

    @builtins.property
    def triggers(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#triggers AutoscalingGroup#triggers}.'''
        result = self._values.get("triggers")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupInstanceRefresh(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupInstanceRefreshOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupInstanceRefreshOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__024bba6547e607e18f0df709a83221b538d990caba3b575eb7b3702fae6e98ef)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putPreferences")
    def put_preferences(
        self,
        *,
        alarm_specification: typing.Optional[typing.Union["AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification", typing.Dict[builtins.str, typing.Any]]] = None,
        auto_rollback: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        checkpoint_delay: typing.Optional[builtins.str] = None,
        checkpoint_percentages: typing.Optional[typing.Sequence[jsii.Number]] = None,
        instance_warmup: typing.Optional[builtins.str] = None,
        max_healthy_percentage: typing.Optional[jsii.Number] = None,
        min_healthy_percentage: typing.Optional[jsii.Number] = None,
        scale_in_protected_instances: typing.Optional[builtins.str] = None,
        skip_matching: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        standby_instances: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param alarm_specification: alarm_specification block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#alarm_specification AutoscalingGroup#alarm_specification}
        :param auto_rollback: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#auto_rollback AutoscalingGroup#auto_rollback}.
        :param checkpoint_delay: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#checkpoint_delay AutoscalingGroup#checkpoint_delay}.
        :param checkpoint_percentages: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#checkpoint_percentages AutoscalingGroup#checkpoint_percentages}.
        :param instance_warmup: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_warmup AutoscalingGroup#instance_warmup}.
        :param max_healthy_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_healthy_percentage AutoscalingGroup#max_healthy_percentage}.
        :param min_healthy_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_healthy_percentage AutoscalingGroup#min_healthy_percentage}.
        :param scale_in_protected_instances: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#scale_in_protected_instances AutoscalingGroup#scale_in_protected_instances}.
        :param skip_matching: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#skip_matching AutoscalingGroup#skip_matching}.
        :param standby_instances: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#standby_instances AutoscalingGroup#standby_instances}.
        '''
        value = AutoscalingGroupInstanceRefreshPreferences(
            alarm_specification=alarm_specification,
            auto_rollback=auto_rollback,
            checkpoint_delay=checkpoint_delay,
            checkpoint_percentages=checkpoint_percentages,
            instance_warmup=instance_warmup,
            max_healthy_percentage=max_healthy_percentage,
            min_healthy_percentage=min_healthy_percentage,
            scale_in_protected_instances=scale_in_protected_instances,
            skip_matching=skip_matching,
            standby_instances=standby_instances,
        )

        return typing.cast(None, jsii.invoke(self, "putPreferences", [value]))

    @jsii.member(jsii_name="resetPreferences")
    def reset_preferences(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPreferences", []))

    @jsii.member(jsii_name="resetTriggers")
    def reset_triggers(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTriggers", []))

    @builtins.property
    @jsii.member(jsii_name="preferences")
    def preferences(
        self,
    ) -> "AutoscalingGroupInstanceRefreshPreferencesOutputReference":
        return typing.cast("AutoscalingGroupInstanceRefreshPreferencesOutputReference", jsii.get(self, "preferences"))

    @builtins.property
    @jsii.member(jsii_name="preferencesInput")
    def preferences_input(
        self,
    ) -> typing.Optional["AutoscalingGroupInstanceRefreshPreferences"]:
        return typing.cast(typing.Optional["AutoscalingGroupInstanceRefreshPreferences"], jsii.get(self, "preferencesInput"))

    @builtins.property
    @jsii.member(jsii_name="strategyInput")
    def strategy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "strategyInput"))

    @builtins.property
    @jsii.member(jsii_name="triggersInput")
    def triggers_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "triggersInput"))

    @builtins.property
    @jsii.member(jsii_name="strategy")
    def strategy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "strategy"))

    @strategy.setter
    def strategy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81a9a2fe27003b53bc298d558529793f127b57444aaf4d7e747043ff9136ab20)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "strategy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="triggers")
    def triggers(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "triggers"))

    @triggers.setter
    def triggers(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61589cb36b2b896985658371850db472dce157f2664b3fa0b2b59904e0b61345)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "triggers", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AutoscalingGroupInstanceRefresh]:
        return typing.cast(typing.Optional[AutoscalingGroupInstanceRefresh], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupInstanceRefresh],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15597e86a4765a980298e31bab2e78561e14ff5a194efa84e4999032b6be1b91)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupInstanceRefreshPreferences",
    jsii_struct_bases=[],
    name_mapping={
        "alarm_specification": "alarmSpecification",
        "auto_rollback": "autoRollback",
        "checkpoint_delay": "checkpointDelay",
        "checkpoint_percentages": "checkpointPercentages",
        "instance_warmup": "instanceWarmup",
        "max_healthy_percentage": "maxHealthyPercentage",
        "min_healthy_percentage": "minHealthyPercentage",
        "scale_in_protected_instances": "scaleInProtectedInstances",
        "skip_matching": "skipMatching",
        "standby_instances": "standbyInstances",
    },
)
class AutoscalingGroupInstanceRefreshPreferences:
    def __init__(
        self,
        *,
        alarm_specification: typing.Optional[typing.Union["AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification", typing.Dict[builtins.str, typing.Any]]] = None,
        auto_rollback: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        checkpoint_delay: typing.Optional[builtins.str] = None,
        checkpoint_percentages: typing.Optional[typing.Sequence[jsii.Number]] = None,
        instance_warmup: typing.Optional[builtins.str] = None,
        max_healthy_percentage: typing.Optional[jsii.Number] = None,
        min_healthy_percentage: typing.Optional[jsii.Number] = None,
        scale_in_protected_instances: typing.Optional[builtins.str] = None,
        skip_matching: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        standby_instances: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param alarm_specification: alarm_specification block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#alarm_specification AutoscalingGroup#alarm_specification}
        :param auto_rollback: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#auto_rollback AutoscalingGroup#auto_rollback}.
        :param checkpoint_delay: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#checkpoint_delay AutoscalingGroup#checkpoint_delay}.
        :param checkpoint_percentages: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#checkpoint_percentages AutoscalingGroup#checkpoint_percentages}.
        :param instance_warmup: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_warmup AutoscalingGroup#instance_warmup}.
        :param max_healthy_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_healthy_percentage AutoscalingGroup#max_healthy_percentage}.
        :param min_healthy_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_healthy_percentage AutoscalingGroup#min_healthy_percentage}.
        :param scale_in_protected_instances: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#scale_in_protected_instances AutoscalingGroup#scale_in_protected_instances}.
        :param skip_matching: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#skip_matching AutoscalingGroup#skip_matching}.
        :param standby_instances: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#standby_instances AutoscalingGroup#standby_instances}.
        '''
        if isinstance(alarm_specification, dict):
            alarm_specification = AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification(**alarm_specification)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__931a40a9eb1caac9008a47c07556d70d7b2174544feac5fcfe7e57fc2406361c)
            check_type(argname="argument alarm_specification", value=alarm_specification, expected_type=type_hints["alarm_specification"])
            check_type(argname="argument auto_rollback", value=auto_rollback, expected_type=type_hints["auto_rollback"])
            check_type(argname="argument checkpoint_delay", value=checkpoint_delay, expected_type=type_hints["checkpoint_delay"])
            check_type(argname="argument checkpoint_percentages", value=checkpoint_percentages, expected_type=type_hints["checkpoint_percentages"])
            check_type(argname="argument instance_warmup", value=instance_warmup, expected_type=type_hints["instance_warmup"])
            check_type(argname="argument max_healthy_percentage", value=max_healthy_percentage, expected_type=type_hints["max_healthy_percentage"])
            check_type(argname="argument min_healthy_percentage", value=min_healthy_percentage, expected_type=type_hints["min_healthy_percentage"])
            check_type(argname="argument scale_in_protected_instances", value=scale_in_protected_instances, expected_type=type_hints["scale_in_protected_instances"])
            check_type(argname="argument skip_matching", value=skip_matching, expected_type=type_hints["skip_matching"])
            check_type(argname="argument standby_instances", value=standby_instances, expected_type=type_hints["standby_instances"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if alarm_specification is not None:
            self._values["alarm_specification"] = alarm_specification
        if auto_rollback is not None:
            self._values["auto_rollback"] = auto_rollback
        if checkpoint_delay is not None:
            self._values["checkpoint_delay"] = checkpoint_delay
        if checkpoint_percentages is not None:
            self._values["checkpoint_percentages"] = checkpoint_percentages
        if instance_warmup is not None:
            self._values["instance_warmup"] = instance_warmup
        if max_healthy_percentage is not None:
            self._values["max_healthy_percentage"] = max_healthy_percentage
        if min_healthy_percentage is not None:
            self._values["min_healthy_percentage"] = min_healthy_percentage
        if scale_in_protected_instances is not None:
            self._values["scale_in_protected_instances"] = scale_in_protected_instances
        if skip_matching is not None:
            self._values["skip_matching"] = skip_matching
        if standby_instances is not None:
            self._values["standby_instances"] = standby_instances

    @builtins.property
    def alarm_specification(
        self,
    ) -> typing.Optional["AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification"]:
        '''alarm_specification block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#alarm_specification AutoscalingGroup#alarm_specification}
        '''
        result = self._values.get("alarm_specification")
        return typing.cast(typing.Optional["AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification"], result)

    @builtins.property
    def auto_rollback(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#auto_rollback AutoscalingGroup#auto_rollback}.'''
        result = self._values.get("auto_rollback")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def checkpoint_delay(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#checkpoint_delay AutoscalingGroup#checkpoint_delay}.'''
        result = self._values.get("checkpoint_delay")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def checkpoint_percentages(self) -> typing.Optional[typing.List[jsii.Number]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#checkpoint_percentages AutoscalingGroup#checkpoint_percentages}.'''
        result = self._values.get("checkpoint_percentages")
        return typing.cast(typing.Optional[typing.List[jsii.Number]], result)

    @builtins.property
    def instance_warmup(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_warmup AutoscalingGroup#instance_warmup}.'''
        result = self._values.get("instance_warmup")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def max_healthy_percentage(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_healthy_percentage AutoscalingGroup#max_healthy_percentage}.'''
        result = self._values.get("max_healthy_percentage")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min_healthy_percentage(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_healthy_percentage AutoscalingGroup#min_healthy_percentage}.'''
        result = self._values.get("min_healthy_percentage")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def scale_in_protected_instances(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#scale_in_protected_instances AutoscalingGroup#scale_in_protected_instances}.'''
        result = self._values.get("scale_in_protected_instances")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def skip_matching(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#skip_matching AutoscalingGroup#skip_matching}.'''
        result = self._values.get("skip_matching")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def standby_instances(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#standby_instances AutoscalingGroup#standby_instances}.'''
        result = self._values.get("standby_instances")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupInstanceRefreshPreferences(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification",
    jsii_struct_bases=[],
    name_mapping={"alarms": "alarms"},
)
class AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification:
    def __init__(
        self,
        *,
        alarms: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param alarms: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#alarms AutoscalingGroup#alarms}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8aeaafee1b2ac8f7bd6061ee29af8d6082793d5114ff2f06df8f8bc873a17b4)
            check_type(argname="argument alarms", value=alarms, expected_type=type_hints["alarms"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if alarms is not None:
            self._values["alarms"] = alarms

    @builtins.property
    def alarms(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#alarms AutoscalingGroup#alarms}.'''
        result = self._values.get("alarms")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupInstanceRefreshPreferencesAlarmSpecificationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecificationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__09a0892ba9748ffe28528c9ea60fc93b0dafc4bd74e730dfb65390c929a7c90a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAlarms")
    def reset_alarms(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAlarms", []))

    @builtins.property
    @jsii.member(jsii_name="alarmsInput")
    def alarms_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "alarmsInput"))

    @builtins.property
    @jsii.member(jsii_name="alarms")
    def alarms(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "alarms"))

    @alarms.setter
    def alarms(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7db26ab9490a17c88f7711cad693422d437dd4583d839e83d4f8978a4ba1065f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "alarms", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification]:
        return typing.cast(typing.Optional[AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1ef110973c9053072460e2d5529164bfa6a7ed0e6046f9c2546c38145d98382)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AutoscalingGroupInstanceRefreshPreferencesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupInstanceRefreshPreferencesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a23a1ac41bc9081457d8055cae96416cc61340a7f8a89d89c01209eecbfdbcc0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAlarmSpecification")
    def put_alarm_specification(
        self,
        *,
        alarms: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param alarms: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#alarms AutoscalingGroup#alarms}.
        '''
        value = AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification(
            alarms=alarms
        )

        return typing.cast(None, jsii.invoke(self, "putAlarmSpecification", [value]))

    @jsii.member(jsii_name="resetAlarmSpecification")
    def reset_alarm_specification(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAlarmSpecification", []))

    @jsii.member(jsii_name="resetAutoRollback")
    def reset_auto_rollback(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAutoRollback", []))

    @jsii.member(jsii_name="resetCheckpointDelay")
    def reset_checkpoint_delay(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCheckpointDelay", []))

    @jsii.member(jsii_name="resetCheckpointPercentages")
    def reset_checkpoint_percentages(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCheckpointPercentages", []))

    @jsii.member(jsii_name="resetInstanceWarmup")
    def reset_instance_warmup(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceWarmup", []))

    @jsii.member(jsii_name="resetMaxHealthyPercentage")
    def reset_max_healthy_percentage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxHealthyPercentage", []))

    @jsii.member(jsii_name="resetMinHealthyPercentage")
    def reset_min_healthy_percentage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinHealthyPercentage", []))

    @jsii.member(jsii_name="resetScaleInProtectedInstances")
    def reset_scale_in_protected_instances(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetScaleInProtectedInstances", []))

    @jsii.member(jsii_name="resetSkipMatching")
    def reset_skip_matching(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSkipMatching", []))

    @jsii.member(jsii_name="resetStandbyInstances")
    def reset_standby_instances(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStandbyInstances", []))

    @builtins.property
    @jsii.member(jsii_name="alarmSpecification")
    def alarm_specification(
        self,
    ) -> AutoscalingGroupInstanceRefreshPreferencesAlarmSpecificationOutputReference:
        return typing.cast(AutoscalingGroupInstanceRefreshPreferencesAlarmSpecificationOutputReference, jsii.get(self, "alarmSpecification"))

    @builtins.property
    @jsii.member(jsii_name="alarmSpecificationInput")
    def alarm_specification_input(
        self,
    ) -> typing.Optional[AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification]:
        return typing.cast(typing.Optional[AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification], jsii.get(self, "alarmSpecificationInput"))

    @builtins.property
    @jsii.member(jsii_name="autoRollbackInput")
    def auto_rollback_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "autoRollbackInput"))

    @builtins.property
    @jsii.member(jsii_name="checkpointDelayInput")
    def checkpoint_delay_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "checkpointDelayInput"))

    @builtins.property
    @jsii.member(jsii_name="checkpointPercentagesInput")
    def checkpoint_percentages_input(self) -> typing.Optional[typing.List[jsii.Number]]:
        return typing.cast(typing.Optional[typing.List[jsii.Number]], jsii.get(self, "checkpointPercentagesInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceWarmupInput")
    def instance_warmup_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "instanceWarmupInput"))

    @builtins.property
    @jsii.member(jsii_name="maxHealthyPercentageInput")
    def max_healthy_percentage_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxHealthyPercentageInput"))

    @builtins.property
    @jsii.member(jsii_name="minHealthyPercentageInput")
    def min_healthy_percentage_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minHealthyPercentageInput"))

    @builtins.property
    @jsii.member(jsii_name="scaleInProtectedInstancesInput")
    def scale_in_protected_instances_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "scaleInProtectedInstancesInput"))

    @builtins.property
    @jsii.member(jsii_name="skipMatchingInput")
    def skip_matching_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "skipMatchingInput"))

    @builtins.property
    @jsii.member(jsii_name="standbyInstancesInput")
    def standby_instances_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "standbyInstancesInput"))

    @builtins.property
    @jsii.member(jsii_name="autoRollback")
    def auto_rollback(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "autoRollback"))

    @auto_rollback.setter
    def auto_rollback(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9c133e3f6f42ef6c53a1d4350fa18301ff24fcc244018ac9039699d0ef37ec56)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "autoRollback", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="checkpointDelay")
    def checkpoint_delay(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "checkpointDelay"))

    @checkpoint_delay.setter
    def checkpoint_delay(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f39644a9952c2382e1309ec734595a13d617254ae6479b55e3651350c63b12b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "checkpointDelay", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="checkpointPercentages")
    def checkpoint_percentages(self) -> typing.List[jsii.Number]:
        return typing.cast(typing.List[jsii.Number], jsii.get(self, "checkpointPercentages"))

    @checkpoint_percentages.setter
    def checkpoint_percentages(self, value: typing.List[jsii.Number]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d25bc9604b01cec589bede06984727cc5231edeb73426fc14b2cd869e87bb6e1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "checkpointPercentages", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="instanceWarmup")
    def instance_warmup(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "instanceWarmup"))

    @instance_warmup.setter
    def instance_warmup(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd6ebac064c2968a4e67f4e981ce3a58de87b1ed2bab2fa40b01b733f734f722)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceWarmup", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxHealthyPercentage")
    def max_healthy_percentage(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxHealthyPercentage"))

    @max_healthy_percentage.setter
    def max_healthy_percentage(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2dcbd77b3158786a81a8a81811e5141e03499417576894b9b8e404294f070d81)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxHealthyPercentage", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minHealthyPercentage")
    def min_healthy_percentage(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minHealthyPercentage"))

    @min_healthy_percentage.setter
    def min_healthy_percentage(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d5164fccd944ce644bfbea1213b193319899c77eb443e9bcc9a14fa93fa004f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minHealthyPercentage", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="scaleInProtectedInstances")
    def scale_in_protected_instances(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "scaleInProtectedInstances"))

    @scale_in_protected_instances.setter
    def scale_in_protected_instances(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__69d66885017ced0e17e136cb77a99fc3db61feb42ebb0093da9fc58bf6c15e99)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "scaleInProtectedInstances", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="skipMatching")
    def skip_matching(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "skipMatching"))

    @skip_matching.setter
    def skip_matching(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e524f8b6d9ea2077beaefe4714eb4662bc7e8e3339aea7290e4d4bf71b226e2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "skipMatching", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="standbyInstances")
    def standby_instances(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "standbyInstances"))

    @standby_instances.setter
    def standby_instances(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b2ea4fbcbad6822de0bfb57744c9ac2a496e31fec358d653bd5b558c1e28ab9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "standbyInstances", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupInstanceRefreshPreferences]:
        return typing.cast(typing.Optional[AutoscalingGroupInstanceRefreshPreferences], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupInstanceRefreshPreferences],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eadde8c8030d9968433e4a1b8e77229148d5084fa1570f6dbeb91b844dd39eb4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupLaunchTemplate",
    jsii_struct_bases=[],
    name_mapping={"id": "id", "name": "name", "version": "version"},
)
class AutoscalingGroupLaunchTemplate:
    def __init__(
        self,
        *,
        id: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#id AutoscalingGroup#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name AutoscalingGroup#name}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#version AutoscalingGroup#version}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4cf41fe700f92091200b6330fc0db254fa1fd577d85fe68eda226b45a2d8ff40)
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument version", value=version, expected_type=type_hints["version"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if id is not None:
            self._values["id"] = id
        if name is not None:
            self._values["name"] = name
        if version is not None:
            self._values["version"] = version

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#id AutoscalingGroup#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#name AutoscalingGroup#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#version AutoscalingGroup#version}.'''
        result = self._values.get("version")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupLaunchTemplate(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupLaunchTemplateOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupLaunchTemplateOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bb41e1a94a0a06f70bf10455e98e8fb35fc3bffc1aeb9009bb65ff4f2b0d6f24)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetVersion")
    def reset_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVersion", []))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="versionInput")
    def version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "versionInput"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1886296f1689d1d7a54b0a2ecfc9c8c459ba9c87a9abb01cd57129fe9d269d88)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff5c9fc61198b5e2870b0710be0ac47ebdf2a422e0e5aad087f6a917474eb748)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="version")
    def version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "version"))

    @version.setter
    def version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6e2e0a274f8d9282e44c4673f164cc4e6b2bafb2811315b7517291cb3809090)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "version", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AutoscalingGroupLaunchTemplate]:
        return typing.cast(typing.Optional[AutoscalingGroupLaunchTemplate], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupLaunchTemplate],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9378d9956bf19fadb0df457e1061d6ed5620e5252b9526eac48e02af53660c2a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicy",
    jsii_struct_bases=[],
    name_mapping={
        "launch_template": "launchTemplate",
        "instances_distribution": "instancesDistribution",
    },
)
class AutoscalingGroupMixedInstancesPolicy:
    def __init__(
        self,
        *,
        launch_template: typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplate", typing.Dict[builtins.str, typing.Any]],
        instances_distribution: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyInstancesDistribution", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param launch_template: launch_template block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template AutoscalingGroup#launch_template}
        :param instances_distribution: instances_distribution block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instances_distribution AutoscalingGroup#instances_distribution}
        '''
        if isinstance(launch_template, dict):
            launch_template = AutoscalingGroupMixedInstancesPolicyLaunchTemplate(**launch_template)
        if isinstance(instances_distribution, dict):
            instances_distribution = AutoscalingGroupMixedInstancesPolicyInstancesDistribution(**instances_distribution)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7273b54d405cca1a68a8772f66e7fc881428ee0f2a76520da101dd1637481bc4)
            check_type(argname="argument launch_template", value=launch_template, expected_type=type_hints["launch_template"])
            check_type(argname="argument instances_distribution", value=instances_distribution, expected_type=type_hints["instances_distribution"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "launch_template": launch_template,
        }
        if instances_distribution is not None:
            self._values["instances_distribution"] = instances_distribution

    @builtins.property
    def launch_template(self) -> "AutoscalingGroupMixedInstancesPolicyLaunchTemplate":
        '''launch_template block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template AutoscalingGroup#launch_template}
        '''
        result = self._values.get("launch_template")
        assert result is not None, "Required property 'launch_template' is missing"
        return typing.cast("AutoscalingGroupMixedInstancesPolicyLaunchTemplate", result)

    @builtins.property
    def instances_distribution(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyInstancesDistribution"]:
        '''instances_distribution block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instances_distribution AutoscalingGroup#instances_distribution}
        '''
        result = self._values.get("instances_distribution")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyInstancesDistribution"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicy(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyInstancesDistribution",
    jsii_struct_bases=[],
    name_mapping={
        "on_demand_allocation_strategy": "onDemandAllocationStrategy",
        "on_demand_base_capacity": "onDemandBaseCapacity",
        "on_demand_percentage_above_base_capacity": "onDemandPercentageAboveBaseCapacity",
        "spot_allocation_strategy": "spotAllocationStrategy",
        "spot_instance_pools": "spotInstancePools",
        "spot_max_price": "spotMaxPrice",
    },
)
class AutoscalingGroupMixedInstancesPolicyInstancesDistribution:
    def __init__(
        self,
        *,
        on_demand_allocation_strategy: typing.Optional[builtins.str] = None,
        on_demand_base_capacity: typing.Optional[jsii.Number] = None,
        on_demand_percentage_above_base_capacity: typing.Optional[jsii.Number] = None,
        spot_allocation_strategy: typing.Optional[builtins.str] = None,
        spot_instance_pools: typing.Optional[jsii.Number] = None,
        spot_max_price: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param on_demand_allocation_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_allocation_strategy AutoscalingGroup#on_demand_allocation_strategy}.
        :param on_demand_base_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_base_capacity AutoscalingGroup#on_demand_base_capacity}.
        :param on_demand_percentage_above_base_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_percentage_above_base_capacity AutoscalingGroup#on_demand_percentage_above_base_capacity}.
        :param spot_allocation_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_allocation_strategy AutoscalingGroup#spot_allocation_strategy}.
        :param spot_instance_pools: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_instance_pools AutoscalingGroup#spot_instance_pools}.
        :param spot_max_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_max_price AutoscalingGroup#spot_max_price}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2016e30cf0c2102450c3e6300dfb54910b59ef88623b1412ea7051a977cc1e9d)
            check_type(argname="argument on_demand_allocation_strategy", value=on_demand_allocation_strategy, expected_type=type_hints["on_demand_allocation_strategy"])
            check_type(argname="argument on_demand_base_capacity", value=on_demand_base_capacity, expected_type=type_hints["on_demand_base_capacity"])
            check_type(argname="argument on_demand_percentage_above_base_capacity", value=on_demand_percentage_above_base_capacity, expected_type=type_hints["on_demand_percentage_above_base_capacity"])
            check_type(argname="argument spot_allocation_strategy", value=spot_allocation_strategy, expected_type=type_hints["spot_allocation_strategy"])
            check_type(argname="argument spot_instance_pools", value=spot_instance_pools, expected_type=type_hints["spot_instance_pools"])
            check_type(argname="argument spot_max_price", value=spot_max_price, expected_type=type_hints["spot_max_price"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if on_demand_allocation_strategy is not None:
            self._values["on_demand_allocation_strategy"] = on_demand_allocation_strategy
        if on_demand_base_capacity is not None:
            self._values["on_demand_base_capacity"] = on_demand_base_capacity
        if on_demand_percentage_above_base_capacity is not None:
            self._values["on_demand_percentage_above_base_capacity"] = on_demand_percentage_above_base_capacity
        if spot_allocation_strategy is not None:
            self._values["spot_allocation_strategy"] = spot_allocation_strategy
        if spot_instance_pools is not None:
            self._values["spot_instance_pools"] = spot_instance_pools
        if spot_max_price is not None:
            self._values["spot_max_price"] = spot_max_price

    @builtins.property
    def on_demand_allocation_strategy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_allocation_strategy AutoscalingGroup#on_demand_allocation_strategy}.'''
        result = self._values.get("on_demand_allocation_strategy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def on_demand_base_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_base_capacity AutoscalingGroup#on_demand_base_capacity}.'''
        result = self._values.get("on_demand_base_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def on_demand_percentage_above_base_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_percentage_above_base_capacity AutoscalingGroup#on_demand_percentage_above_base_capacity}.'''
        result = self._values.get("on_demand_percentage_above_base_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def spot_allocation_strategy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_allocation_strategy AutoscalingGroup#spot_allocation_strategy}.'''
        result = self._values.get("spot_allocation_strategy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def spot_instance_pools(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_instance_pools AutoscalingGroup#spot_instance_pools}.'''
        result = self._values.get("spot_instance_pools")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def spot_max_price(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_max_price AutoscalingGroup#spot_max_price}.'''
        result = self._values.get("spot_max_price")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyInstancesDistribution(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupMixedInstancesPolicyInstancesDistributionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyInstancesDistributionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a2279e84db944608af8afe8627770481d10ad724a6f55c77de8765bfb6ca9c32)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetOnDemandAllocationStrategy")
    def reset_on_demand_allocation_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnDemandAllocationStrategy", []))

    @jsii.member(jsii_name="resetOnDemandBaseCapacity")
    def reset_on_demand_base_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnDemandBaseCapacity", []))

    @jsii.member(jsii_name="resetOnDemandPercentageAboveBaseCapacity")
    def reset_on_demand_percentage_above_base_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnDemandPercentageAboveBaseCapacity", []))

    @jsii.member(jsii_name="resetSpotAllocationStrategy")
    def reset_spot_allocation_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSpotAllocationStrategy", []))

    @jsii.member(jsii_name="resetSpotInstancePools")
    def reset_spot_instance_pools(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSpotInstancePools", []))

    @jsii.member(jsii_name="resetSpotMaxPrice")
    def reset_spot_max_price(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSpotMaxPrice", []))

    @builtins.property
    @jsii.member(jsii_name="onDemandAllocationStrategyInput")
    def on_demand_allocation_strategy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "onDemandAllocationStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="onDemandBaseCapacityInput")
    def on_demand_base_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "onDemandBaseCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="onDemandPercentageAboveBaseCapacityInput")
    def on_demand_percentage_above_base_capacity_input(
        self,
    ) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "onDemandPercentageAboveBaseCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="spotAllocationStrategyInput")
    def spot_allocation_strategy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "spotAllocationStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="spotInstancePoolsInput")
    def spot_instance_pools_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "spotInstancePoolsInput"))

    @builtins.property
    @jsii.member(jsii_name="spotMaxPriceInput")
    def spot_max_price_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "spotMaxPriceInput"))

    @builtins.property
    @jsii.member(jsii_name="onDemandAllocationStrategy")
    def on_demand_allocation_strategy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "onDemandAllocationStrategy"))

    @on_demand_allocation_strategy.setter
    def on_demand_allocation_strategy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d9c8e8d0701d37e74c51456edf8ffb73b6020328641f3fbb7abea3ed5af950a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onDemandAllocationStrategy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onDemandBaseCapacity")
    def on_demand_base_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "onDemandBaseCapacity"))

    @on_demand_base_capacity.setter
    def on_demand_base_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4fd80508f37aaa5187ce8e8016309cd4a02daec6cd0320bb9dd1c596d4d1f2c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onDemandBaseCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onDemandPercentageAboveBaseCapacity")
    def on_demand_percentage_above_base_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "onDemandPercentageAboveBaseCapacity"))

    @on_demand_percentage_above_base_capacity.setter
    def on_demand_percentage_above_base_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f1575c5bde2a91a2fce87bb06ae0ea5c5172ca56d4e255dc3ebee02889e3814d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onDemandPercentageAboveBaseCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="spotAllocationStrategy")
    def spot_allocation_strategy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "spotAllocationStrategy"))

    @spot_allocation_strategy.setter
    def spot_allocation_strategy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efa17993945c972e4f817971a1f394d6a775cc1d4717600da113e2401eac7eaf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "spotAllocationStrategy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="spotInstancePools")
    def spot_instance_pools(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "spotInstancePools"))

    @spot_instance_pools.setter
    def spot_instance_pools(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ae404662e6ab11e0a0bd2f0e367c750240eb500549de9751e4027ef7ae57dd0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "spotInstancePools", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="spotMaxPrice")
    def spot_max_price(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "spotMaxPrice"))

    @spot_max_price.setter
    def spot_max_price(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b5093c8ba1217949b13fd8409c4b328e8a279c6db37394f4e7ae51be6efcd449)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "spotMaxPrice", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyInstancesDistribution]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyInstancesDistribution], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyInstancesDistribution],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6882a7545de143ce10d47d1e51acbf273dcfd78b1fd8129f734267c98485b0d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplate",
    jsii_struct_bases=[],
    name_mapping={
        "launch_template_specification": "launchTemplateSpecification",
        "override": "override",
    },
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplate:
    def __init__(
        self,
        *,
        launch_template_specification: typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification", typing.Dict[builtins.str, typing.Any]],
        override: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param launch_template_specification: launch_template_specification block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_specification AutoscalingGroup#launch_template_specification}
        :param override: override block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#override AutoscalingGroup#override}
        '''
        if isinstance(launch_template_specification, dict):
            launch_template_specification = AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification(**launch_template_specification)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__70c3e4bb505dfa3fb95c9da9c2ef6e7475593c5748506ff81604878010940bb5)
            check_type(argname="argument launch_template_specification", value=launch_template_specification, expected_type=type_hints["launch_template_specification"])
            check_type(argname="argument override", value=override, expected_type=type_hints["override"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "launch_template_specification": launch_template_specification,
        }
        if override is not None:
            self._values["override"] = override

    @builtins.property
    def launch_template_specification(
        self,
    ) -> "AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification":
        '''launch_template_specification block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_specification AutoscalingGroup#launch_template_specification}
        '''
        result = self._values.get("launch_template_specification")
        assert result is not None, "Required property 'launch_template_specification' is missing"
        return typing.cast("AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification", result)

    @builtins.property
    def override(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride"]]]:
        '''override block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#override AutoscalingGroup#override}
        '''
        result = self._values.get("override")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplate(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification",
    jsii_struct_bases=[],
    name_mapping={
        "launch_template_id": "launchTemplateId",
        "launch_template_name": "launchTemplateName",
        "version": "version",
    },
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification:
    def __init__(
        self,
        *,
        launch_template_id: typing.Optional[builtins.str] = None,
        launch_template_name: typing.Optional[builtins.str] = None,
        version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param launch_template_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_id AutoscalingGroup#launch_template_id}.
        :param launch_template_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_name AutoscalingGroup#launch_template_name}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#version AutoscalingGroup#version}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__962bc5614727dbff70eb2b75f5b04b58d038d0805c452e38dbf5e1e38ec497ee)
            check_type(argname="argument launch_template_id", value=launch_template_id, expected_type=type_hints["launch_template_id"])
            check_type(argname="argument launch_template_name", value=launch_template_name, expected_type=type_hints["launch_template_name"])
            check_type(argname="argument version", value=version, expected_type=type_hints["version"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if launch_template_id is not None:
            self._values["launch_template_id"] = launch_template_id
        if launch_template_name is not None:
            self._values["launch_template_name"] = launch_template_name
        if version is not None:
            self._values["version"] = version

    @builtins.property
    def launch_template_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_id AutoscalingGroup#launch_template_id}.'''
        result = self._values.get("launch_template_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def launch_template_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_name AutoscalingGroup#launch_template_name}.'''
        result = self._values.get("launch_template_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#version AutoscalingGroup#version}.'''
        result = self._values.get("version")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecificationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecificationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c984764ccf970926c6c93485d6cf03de7558912ab2ac0950562c2b8f6563e420)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetLaunchTemplateId")
    def reset_launch_template_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLaunchTemplateId", []))

    @jsii.member(jsii_name="resetLaunchTemplateName")
    def reset_launch_template_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLaunchTemplateName", []))

    @jsii.member(jsii_name="resetVersion")
    def reset_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVersion", []))

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
            type_hints = typing.get_type_hints(_typecheckingstub__f1f8118bfefab87b06324ab480db4f0e63769ccc9189ede681519a6a406b1d68)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "launchTemplateId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="launchTemplateName")
    def launch_template_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "launchTemplateName"))

    @launch_template_name.setter
    def launch_template_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__809506efc3cea5878d74e7996e37470fcc5a0fab4448192e840a5a8ca091cd9b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "launchTemplateName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="version")
    def version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "version"))

    @version.setter
    def version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2d3e93fecc1989d85327e86d19641d57ceae26800d7a5c976b41d53265d88195)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "version", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d40e6605655fd2e5d1631ba89ef2a2298be4957e0db232be6498664bc5b5596)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__49f0a91db6edcb85a399f9971d9bc646b43a88a74885de51cb4e0949ed5e75c5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putLaunchTemplateSpecification")
    def put_launch_template_specification(
        self,
        *,
        launch_template_id: typing.Optional[builtins.str] = None,
        launch_template_name: typing.Optional[builtins.str] = None,
        version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param launch_template_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_id AutoscalingGroup#launch_template_id}.
        :param launch_template_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_name AutoscalingGroup#launch_template_name}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#version AutoscalingGroup#version}.
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification(
            launch_template_id=launch_template_id,
            launch_template_name=launch_template_name,
            version=version,
        )

        return typing.cast(None, jsii.invoke(self, "putLaunchTemplateSpecification", [value]))

    @jsii.member(jsii_name="putOverride")
    def put_override(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b71153c24f0e87380e482d9c6a29ba91bcb17f03c3a22dacc3a9ff275bfb7d0b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putOverride", [value]))

    @jsii.member(jsii_name="resetOverride")
    def reset_override(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOverride", []))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateSpecification")
    def launch_template_specification(
        self,
    ) -> AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecificationOutputReference:
        return typing.cast(AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecificationOutputReference, jsii.get(self, "launchTemplateSpecification"))

    @builtins.property
    @jsii.member(jsii_name="override")
    def override(
        self,
    ) -> "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideList":
        return typing.cast("AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideList", jsii.get(self, "override"))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateSpecificationInput")
    def launch_template_specification_input(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification], jsii.get(self, "launchTemplateSpecificationInput"))

    @builtins.property
    @jsii.member(jsii_name="overrideInput")
    def override_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride"]]], jsii.get(self, "overrideInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplate]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplate], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplate],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c5bc9b6e61db0bc0a53d4a0b6667c25b92a21c45834c8efb12878f16d036cc8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride",
    jsii_struct_bases=[],
    name_mapping={
        "instance_requirements": "instanceRequirements",
        "instance_type": "instanceType",
        "launch_template_specification": "launchTemplateSpecification",
        "weighted_capacity": "weightedCapacity",
    },
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride:
    def __init__(
        self,
        *,
        instance_requirements: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements", typing.Dict[builtins.str, typing.Any]]] = None,
        instance_type: typing.Optional[builtins.str] = None,
        launch_template_specification: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification", typing.Dict[builtins.str, typing.Any]]] = None,
        weighted_capacity: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_requirements: instance_requirements block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_requirements AutoscalingGroup#instance_requirements}
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_type AutoscalingGroup#instance_type}.
        :param launch_template_specification: launch_template_specification block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_specification AutoscalingGroup#launch_template_specification}
        :param weighted_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#weighted_capacity AutoscalingGroup#weighted_capacity}.
        '''
        if isinstance(instance_requirements, dict):
            instance_requirements = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements(**instance_requirements)
        if isinstance(launch_template_specification, dict):
            launch_template_specification = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification(**launch_template_specification)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fde63c0c36fa1e41713ae98ed12d60c23369f0a2e7c081309ae68a2d1e219ada)
            check_type(argname="argument instance_requirements", value=instance_requirements, expected_type=type_hints["instance_requirements"])
            check_type(argname="argument instance_type", value=instance_type, expected_type=type_hints["instance_type"])
            check_type(argname="argument launch_template_specification", value=launch_template_specification, expected_type=type_hints["launch_template_specification"])
            check_type(argname="argument weighted_capacity", value=weighted_capacity, expected_type=type_hints["weighted_capacity"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if instance_requirements is not None:
            self._values["instance_requirements"] = instance_requirements
        if instance_type is not None:
            self._values["instance_type"] = instance_type
        if launch_template_specification is not None:
            self._values["launch_template_specification"] = launch_template_specification
        if weighted_capacity is not None:
            self._values["weighted_capacity"] = weighted_capacity

    @builtins.property
    def instance_requirements(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements"]:
        '''instance_requirements block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_requirements AutoscalingGroup#instance_requirements}
        '''
        result = self._values.get("instance_requirements")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements"], result)

    @builtins.property
    def instance_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_type AutoscalingGroup#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def launch_template_specification(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification"]:
        '''launch_template_specification block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_specification AutoscalingGroup#launch_template_specification}
        '''
        result = self._values.get("launch_template_specification")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification"], result)

    @builtins.property
    def weighted_capacity(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#weighted_capacity AutoscalingGroup#weighted_capacity}.'''
        result = self._values.get("weighted_capacity")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements",
    jsii_struct_bases=[],
    name_mapping={
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
        "memory_mib": "memoryMib",
        "network_bandwidth_gbps": "networkBandwidthGbps",
        "network_interface_count": "networkInterfaceCount",
        "on_demand_max_price_percentage_over_lowest_price": "onDemandMaxPricePercentageOverLowestPrice",
        "require_hibernate_support": "requireHibernateSupport",
        "spot_max_price_percentage_over_lowest_price": "spotMaxPricePercentageOverLowestPrice",
        "total_local_storage_gb": "totalLocalStorageGb",
        "vcpu_count": "vcpuCount",
    },
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements:
    def __init__(
        self,
        *,
        accelerator_count: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount", typing.Dict[builtins.str, typing.Any]]] = None,
        accelerator_manufacturers: typing.Optional[typing.Sequence[builtins.str]] = None,
        accelerator_names: typing.Optional[typing.Sequence[builtins.str]] = None,
        accelerator_total_memory_mib: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib", typing.Dict[builtins.str, typing.Any]]] = None,
        accelerator_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        allowed_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        bare_metal: typing.Optional[builtins.str] = None,
        baseline_ebs_bandwidth_mbps: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps", typing.Dict[builtins.str, typing.Any]]] = None,
        burstable_performance: typing.Optional[builtins.str] = None,
        cpu_manufacturers: typing.Optional[typing.Sequence[builtins.str]] = None,
        excluded_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        instance_generations: typing.Optional[typing.Sequence[builtins.str]] = None,
        local_storage: typing.Optional[builtins.str] = None,
        local_storage_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        max_spot_price_as_percentage_of_optimal_on_demand_price: typing.Optional[jsii.Number] = None,
        memory_gib_per_vcpu: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu", typing.Dict[builtins.str, typing.Any]]] = None,
        memory_mib: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib", typing.Dict[builtins.str, typing.Any]]] = None,
        network_bandwidth_gbps: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps", typing.Dict[builtins.str, typing.Any]]] = None,
        network_interface_count: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount", typing.Dict[builtins.str, typing.Any]]] = None,
        on_demand_max_price_percentage_over_lowest_price: typing.Optional[jsii.Number] = None,
        require_hibernate_support: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        spot_max_price_percentage_over_lowest_price: typing.Optional[jsii.Number] = None,
        total_local_storage_gb: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb", typing.Dict[builtins.str, typing.Any]]] = None,
        vcpu_count: typing.Optional[typing.Union["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param accelerator_count: accelerator_count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_count AutoscalingGroup#accelerator_count}
        :param accelerator_manufacturers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_manufacturers AutoscalingGroup#accelerator_manufacturers}.
        :param accelerator_names: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_names AutoscalingGroup#accelerator_names}.
        :param accelerator_total_memory_mib: accelerator_total_memory_mib block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_total_memory_mib AutoscalingGroup#accelerator_total_memory_mib}
        :param accelerator_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_types AutoscalingGroup#accelerator_types}.
        :param allowed_instance_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#allowed_instance_types AutoscalingGroup#allowed_instance_types}.
        :param bare_metal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#bare_metal AutoscalingGroup#bare_metal}.
        :param baseline_ebs_bandwidth_mbps: baseline_ebs_bandwidth_mbps block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#baseline_ebs_bandwidth_mbps AutoscalingGroup#baseline_ebs_bandwidth_mbps}
        :param burstable_performance: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#burstable_performance AutoscalingGroup#burstable_performance}.
        :param cpu_manufacturers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#cpu_manufacturers AutoscalingGroup#cpu_manufacturers}.
        :param excluded_instance_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#excluded_instance_types AutoscalingGroup#excluded_instance_types}.
        :param instance_generations: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_generations AutoscalingGroup#instance_generations}.
        :param local_storage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#local_storage AutoscalingGroup#local_storage}.
        :param local_storage_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#local_storage_types AutoscalingGroup#local_storage_types}.
        :param max_spot_price_as_percentage_of_optimal_on_demand_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_spot_price_as_percentage_of_optimal_on_demand_price AutoscalingGroup#max_spot_price_as_percentage_of_optimal_on_demand_price}.
        :param memory_gib_per_vcpu: memory_gib_per_vcpu block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#memory_gib_per_vcpu AutoscalingGroup#memory_gib_per_vcpu}
        :param memory_mib: memory_mib block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#memory_mib AutoscalingGroup#memory_mib}
        :param network_bandwidth_gbps: network_bandwidth_gbps block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#network_bandwidth_gbps AutoscalingGroup#network_bandwidth_gbps}
        :param network_interface_count: network_interface_count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#network_interface_count AutoscalingGroup#network_interface_count}
        :param on_demand_max_price_percentage_over_lowest_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_max_price_percentage_over_lowest_price AutoscalingGroup#on_demand_max_price_percentage_over_lowest_price}.
        :param require_hibernate_support: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#require_hibernate_support AutoscalingGroup#require_hibernate_support}.
        :param spot_max_price_percentage_over_lowest_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_max_price_percentage_over_lowest_price AutoscalingGroup#spot_max_price_percentage_over_lowest_price}.
        :param total_local_storage_gb: total_local_storage_gb block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#total_local_storage_gb AutoscalingGroup#total_local_storage_gb}
        :param vcpu_count: vcpu_count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#vcpu_count AutoscalingGroup#vcpu_count}
        '''
        if isinstance(accelerator_count, dict):
            accelerator_count = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount(**accelerator_count)
        if isinstance(accelerator_total_memory_mib, dict):
            accelerator_total_memory_mib = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib(**accelerator_total_memory_mib)
        if isinstance(baseline_ebs_bandwidth_mbps, dict):
            baseline_ebs_bandwidth_mbps = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps(**baseline_ebs_bandwidth_mbps)
        if isinstance(memory_gib_per_vcpu, dict):
            memory_gib_per_vcpu = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu(**memory_gib_per_vcpu)
        if isinstance(memory_mib, dict):
            memory_mib = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib(**memory_mib)
        if isinstance(network_bandwidth_gbps, dict):
            network_bandwidth_gbps = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps(**network_bandwidth_gbps)
        if isinstance(network_interface_count, dict):
            network_interface_count = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount(**network_interface_count)
        if isinstance(total_local_storage_gb, dict):
            total_local_storage_gb = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb(**total_local_storage_gb)
        if isinstance(vcpu_count, dict):
            vcpu_count = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount(**vcpu_count)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2dcf954255b80d4c69f4c7acb1d0adb1c65c109178855efa4ceb4a238093d147)
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
            check_type(argname="argument memory_mib", value=memory_mib, expected_type=type_hints["memory_mib"])
            check_type(argname="argument network_bandwidth_gbps", value=network_bandwidth_gbps, expected_type=type_hints["network_bandwidth_gbps"])
            check_type(argname="argument network_interface_count", value=network_interface_count, expected_type=type_hints["network_interface_count"])
            check_type(argname="argument on_demand_max_price_percentage_over_lowest_price", value=on_demand_max_price_percentage_over_lowest_price, expected_type=type_hints["on_demand_max_price_percentage_over_lowest_price"])
            check_type(argname="argument require_hibernate_support", value=require_hibernate_support, expected_type=type_hints["require_hibernate_support"])
            check_type(argname="argument spot_max_price_percentage_over_lowest_price", value=spot_max_price_percentage_over_lowest_price, expected_type=type_hints["spot_max_price_percentage_over_lowest_price"])
            check_type(argname="argument total_local_storage_gb", value=total_local_storage_gb, expected_type=type_hints["total_local_storage_gb"])
            check_type(argname="argument vcpu_count", value=vcpu_count, expected_type=type_hints["vcpu_count"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
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
        if memory_mib is not None:
            self._values["memory_mib"] = memory_mib
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
        if vcpu_count is not None:
            self._values["vcpu_count"] = vcpu_count

    @builtins.property
    def accelerator_count(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount"]:
        '''accelerator_count block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_count AutoscalingGroup#accelerator_count}
        '''
        result = self._values.get("accelerator_count")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount"], result)

    @builtins.property
    def accelerator_manufacturers(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_manufacturers AutoscalingGroup#accelerator_manufacturers}.'''
        result = self._values.get("accelerator_manufacturers")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def accelerator_names(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_names AutoscalingGroup#accelerator_names}.'''
        result = self._values.get("accelerator_names")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def accelerator_total_memory_mib(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib"]:
        '''accelerator_total_memory_mib block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_total_memory_mib AutoscalingGroup#accelerator_total_memory_mib}
        '''
        result = self._values.get("accelerator_total_memory_mib")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib"], result)

    @builtins.property
    def accelerator_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_types AutoscalingGroup#accelerator_types}.'''
        result = self._values.get("accelerator_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def allowed_instance_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#allowed_instance_types AutoscalingGroup#allowed_instance_types}.'''
        result = self._values.get("allowed_instance_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def bare_metal(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#bare_metal AutoscalingGroup#bare_metal}.'''
        result = self._values.get("bare_metal")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def baseline_ebs_bandwidth_mbps(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps"]:
        '''baseline_ebs_bandwidth_mbps block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#baseline_ebs_bandwidth_mbps AutoscalingGroup#baseline_ebs_bandwidth_mbps}
        '''
        result = self._values.get("baseline_ebs_bandwidth_mbps")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps"], result)

    @builtins.property
    def burstable_performance(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#burstable_performance AutoscalingGroup#burstable_performance}.'''
        result = self._values.get("burstable_performance")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def cpu_manufacturers(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#cpu_manufacturers AutoscalingGroup#cpu_manufacturers}.'''
        result = self._values.get("cpu_manufacturers")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def excluded_instance_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#excluded_instance_types AutoscalingGroup#excluded_instance_types}.'''
        result = self._values.get("excluded_instance_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def instance_generations(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_generations AutoscalingGroup#instance_generations}.'''
        result = self._values.get("instance_generations")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def local_storage(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#local_storage AutoscalingGroup#local_storage}.'''
        result = self._values.get("local_storage")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def local_storage_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#local_storage_types AutoscalingGroup#local_storage_types}.'''
        result = self._values.get("local_storage_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def max_spot_price_as_percentage_of_optimal_on_demand_price(
        self,
    ) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_spot_price_as_percentage_of_optimal_on_demand_price AutoscalingGroup#max_spot_price_as_percentage_of_optimal_on_demand_price}.'''
        result = self._values.get("max_spot_price_as_percentage_of_optimal_on_demand_price")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def memory_gib_per_vcpu(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu"]:
        '''memory_gib_per_vcpu block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#memory_gib_per_vcpu AutoscalingGroup#memory_gib_per_vcpu}
        '''
        result = self._values.get("memory_gib_per_vcpu")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu"], result)

    @builtins.property
    def memory_mib(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib"]:
        '''memory_mib block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#memory_mib AutoscalingGroup#memory_mib}
        '''
        result = self._values.get("memory_mib")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib"], result)

    @builtins.property
    def network_bandwidth_gbps(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps"]:
        '''network_bandwidth_gbps block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#network_bandwidth_gbps AutoscalingGroup#network_bandwidth_gbps}
        '''
        result = self._values.get("network_bandwidth_gbps")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps"], result)

    @builtins.property
    def network_interface_count(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount"]:
        '''network_interface_count block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#network_interface_count AutoscalingGroup#network_interface_count}
        '''
        result = self._values.get("network_interface_count")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount"], result)

    @builtins.property
    def on_demand_max_price_percentage_over_lowest_price(
        self,
    ) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_max_price_percentage_over_lowest_price AutoscalingGroup#on_demand_max_price_percentage_over_lowest_price}.'''
        result = self._values.get("on_demand_max_price_percentage_over_lowest_price")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def require_hibernate_support(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#require_hibernate_support AutoscalingGroup#require_hibernate_support}.'''
        result = self._values.get("require_hibernate_support")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def spot_max_price_percentage_over_lowest_price(
        self,
    ) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_max_price_percentage_over_lowest_price AutoscalingGroup#spot_max_price_percentage_over_lowest_price}.'''
        result = self._values.get("spot_max_price_percentage_over_lowest_price")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def total_local_storage_gb(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb"]:
        '''total_local_storage_gb block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#total_local_storage_gb AutoscalingGroup#total_local_storage_gb}
        '''
        result = self._values.get("total_local_storage_gb")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb"], result)

    @builtins.property
    def vcpu_count(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount"]:
        '''vcpu_count block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#vcpu_count AutoscalingGroup#vcpu_count}
        '''
        result = self._values.get("vcpu_count")
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__724554780831f289972ecf058d147cbbddccd431f360deb61eda731a7aa50cce)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCountOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCountOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__df24fddf2c8ec377a1a5216f15fdcfe599192c7380a644a7e58133d4fdb2b2eb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0739abff710a5e4df06746b1f0113c664574b0743ed292bce33a9a4ec165e17b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d8fc22e44ffcb9503b4983474baf761081517b350e8d574c97198f81381917c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5473026304dc9b505b86d86cf315e3cf55f801a6c2a69c1ad1b31bfa5e3483d1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__520d62c65836e03937be5d3f2143cc5be0460483941e347c049fb684236e6e01)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMibOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMibOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__40fb4217cb3abaf598798a1b72b93158e8761c21fbdf084dae537687f74d2ec6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__826f93c0d9a75c7854304dc6bb941536b2fa3b684d76769631be4f22ea046bcb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d8676ec0fa12b41bbf0d6f9787965b4480f9d873deba9c94fd25896c87acb3d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cdd94b45c13467b788bb0b1f43acbe85158f2e58f43b6ac7e8403a0e95730a21)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__354c5ecdf38b32157179a9611db103b982784e29ad3cd5735a29e062b87af44f)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4aa2de94a2cd2edb10877263d77e0f51f2eb73c490be220fc7b7cdd7044c02c4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__702e03c1791400ba0f3c2101dc1766b1682e0b93a08eebeae6fa2642da0cc635)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__47507b7a727cc75d4cd857fd1b7736589debec9343252be6f56c7ed49e1bacd0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__292b9963adaba04a2ed5c80b708122c9efdb828a5086c30e0d1c72aa35d7a78e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4b665840da3f9ded676cfd86241d9b985bf58b31a2c5c236bf8f5c4cf562fa42)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpuOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpuOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__067c6295b3bf51fc82a835dbd3e0bf642ac9a156e182110329ce861c34d942e3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__22966c82a35be80e7b9ad7f9f7a052c9e207696da9d3ff4f643e60d84e4aff22)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__077995ae804b0c8ef9b6d1cb5992fd000743ef2436b0165037bedaa30cf6a34a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b73bc250cc38a2525e9a03ac0b0a5a9e53b5310bb97c9a4b1f16f1b3ef0fae73)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__58d54095b0bbc8f32cf040e812c49c750975580edad52be6dfc35a21a7b9cad1)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMibOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMibOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ef1ec37f03cb7e326024662bca7e00c27a41f3468a724886b6274341c96a86a4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__fdca0c5cb659c6bbc9383e679d2eb68be9451f6871e18cda4fde9788857735b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c3f7778e3af850077005672be5004f0b43cd22dc138a4155fea01ca663492e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__562ba05a115f83b9242594914f32ea5e44869333937eea39da0f0d0ac9cb01f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0bc7740a31e3f3133fd24e891d24d3f317d42af7d3b9e28150366a3376f9cb6d)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbpsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbpsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__732662bd35318e0aaf0b9c5e062117260c3f82d8d95fd7ced9d77a35d72c6266)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8709dabc1bede9729ed176a231991df26ca2dd2d6b82c291f0c9c113f8013047)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__703a1d821b73d47419a5f96ea6c291945624ea8fa326bba36e65073e92b77c65)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b9d48bf2022f63997933cb7676de4eb97c36443521e0fedddf19a7c02189553a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a2e56b2ce7299003d9acd4a869058b88910f439901b2c3c3512dd5bfff01b3d)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCountOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCountOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__36465b0ff1b2eb5f685bff9a62f0e9cb2116dfd04971cb3ffb135ccf989bb2be)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2c253a78967ecd06058373f173e09200c114f6427c5f89d6988846aa4c58cf31)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d7473523f4b4a1e1559c866592ee327a39b177411cc947a30a4673f9960211c2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__551311a9e30a06cfe8911c446fe5989c24d3329815b9664a425325064fc7e7f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6e766a1ae823da189a00099a7599f434916ef01af5cd22305285ff07e0eed4bb)
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
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount(
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
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib(
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
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps(
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
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu(
            max=max, min=min
        )

        return typing.cast(None, jsii.invoke(self, "putMemoryGibPerVcpu", [value]))

    @jsii.member(jsii_name="putMemoryMib")
    def put_memory_mib(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib(
            max=max, min=min
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
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps(
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
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount(
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
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb(
            max=max, min=min
        )

        return typing.cast(None, jsii.invoke(self, "putTotalLocalStorageGb", [value]))

    @jsii.member(jsii_name="putVcpuCount")
    def put_vcpu_count(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount(
            max=max, min=min
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

    @jsii.member(jsii_name="resetMemoryMib")
    def reset_memory_mib(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMemoryMib", []))

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

    @jsii.member(jsii_name="resetVcpuCount")
    def reset_vcpu_count(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVcpuCount", []))

    @builtins.property
    @jsii.member(jsii_name="acceleratorCount")
    def accelerator_count(
        self,
    ) -> AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCountOutputReference:
        return typing.cast(AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCountOutputReference, jsii.get(self, "acceleratorCount"))

    @builtins.property
    @jsii.member(jsii_name="acceleratorTotalMemoryMib")
    def accelerator_total_memory_mib(
        self,
    ) -> AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMibOutputReference:
        return typing.cast(AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMibOutputReference, jsii.get(self, "acceleratorTotalMemoryMib"))

    @builtins.property
    @jsii.member(jsii_name="baselineEbsBandwidthMbps")
    def baseline_ebs_bandwidth_mbps(
        self,
    ) -> AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference:
        return typing.cast(AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference, jsii.get(self, "baselineEbsBandwidthMbps"))

    @builtins.property
    @jsii.member(jsii_name="memoryGibPerVcpu")
    def memory_gib_per_vcpu(
        self,
    ) -> AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpuOutputReference:
        return typing.cast(AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpuOutputReference, jsii.get(self, "memoryGibPerVcpu"))

    @builtins.property
    @jsii.member(jsii_name="memoryMib")
    def memory_mib(
        self,
    ) -> AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMibOutputReference:
        return typing.cast(AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMibOutputReference, jsii.get(self, "memoryMib"))

    @builtins.property
    @jsii.member(jsii_name="networkBandwidthGbps")
    def network_bandwidth_gbps(
        self,
    ) -> AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbpsOutputReference:
        return typing.cast(AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbpsOutputReference, jsii.get(self, "networkBandwidthGbps"))

    @builtins.property
    @jsii.member(jsii_name="networkInterfaceCount")
    def network_interface_count(
        self,
    ) -> AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCountOutputReference:
        return typing.cast(AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCountOutputReference, jsii.get(self, "networkInterfaceCount"))

    @builtins.property
    @jsii.member(jsii_name="totalLocalStorageGb")
    def total_local_storage_gb(
        self,
    ) -> "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGbOutputReference":
        return typing.cast("AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGbOutputReference", jsii.get(self, "totalLocalStorageGb"))

    @builtins.property
    @jsii.member(jsii_name="vcpuCount")
    def vcpu_count(
        self,
    ) -> "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCountOutputReference":
        return typing.cast("AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCountOutputReference", jsii.get(self, "vcpuCount"))

    @builtins.property
    @jsii.member(jsii_name="acceleratorCountInput")
    def accelerator_count_input(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount], jsii.get(self, "acceleratorCountInput"))

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
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib], jsii.get(self, "acceleratorTotalMemoryMibInput"))

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
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps], jsii.get(self, "baselineEbsBandwidthMbpsInput"))

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
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu], jsii.get(self, "memoryGibPerVcpuInput"))

    @builtins.property
    @jsii.member(jsii_name="memoryMibInput")
    def memory_mib_input(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib], jsii.get(self, "memoryMibInput"))

    @builtins.property
    @jsii.member(jsii_name="networkBandwidthGbpsInput")
    def network_bandwidth_gbps_input(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps], jsii.get(self, "networkBandwidthGbpsInput"))

    @builtins.property
    @jsii.member(jsii_name="networkInterfaceCountInput")
    def network_interface_count_input(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount], jsii.get(self, "networkInterfaceCountInput"))

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
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb"]:
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb"], jsii.get(self, "totalLocalStorageGbInput"))

    @builtins.property
    @jsii.member(jsii_name="vcpuCountInput")
    def vcpu_count_input(
        self,
    ) -> typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount"]:
        return typing.cast(typing.Optional["AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount"], jsii.get(self, "vcpuCountInput"))

    @builtins.property
    @jsii.member(jsii_name="acceleratorManufacturers")
    def accelerator_manufacturers(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "acceleratorManufacturers"))

    @accelerator_manufacturers.setter
    def accelerator_manufacturers(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3733f2da5fe4c032830a2fd323ac8d9e0b7d576b965b33597bd056c16478130a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "acceleratorManufacturers", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="acceleratorNames")
    def accelerator_names(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "acceleratorNames"))

    @accelerator_names.setter
    def accelerator_names(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__064704dc371d24b6914d8b39fc185b5e7029cabb6b349491e57748ba9bd69a1f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "acceleratorNames", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="acceleratorTypes")
    def accelerator_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "acceleratorTypes"))

    @accelerator_types.setter
    def accelerator_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a3db537327e2064bf0fc7f0455e32a37ba5e0c7d53e42a32f33fd3138a3c5b5e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "acceleratorTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="allowedInstanceTypes")
    def allowed_instance_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "allowedInstanceTypes"))

    @allowed_instance_types.setter
    def allowed_instance_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a24fec702068a1f570236a48788a448dd624c290814a8594b90a1831c8180668)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "allowedInstanceTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="bareMetal")
    def bare_metal(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bareMetal"))

    @bare_metal.setter
    def bare_metal(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e8e4941582cef491484cef9748f25cf5518bd4e5e550a361d11b285549913ae)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bareMetal", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="burstablePerformance")
    def burstable_performance(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "burstablePerformance"))

    @burstable_performance.setter
    def burstable_performance(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e16e6b95823a0254b314c29b31dbc66854f92b9d0ab6f7c034c6495fbdc1cfbd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "burstablePerformance", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="cpuManufacturers")
    def cpu_manufacturers(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "cpuManufacturers"))

    @cpu_manufacturers.setter
    def cpu_manufacturers(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1379dedda613b2ac28cb4a23c88b35c85deb060dd97b591b81294e15d8133857)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cpuManufacturers", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="excludedInstanceTypes")
    def excluded_instance_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "excludedInstanceTypes"))

    @excluded_instance_types.setter
    def excluded_instance_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32bf4bb636a9b8ecdad3f2ed1ee7467d0b4e3f69093bcbdd68c48d381d08840b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "excludedInstanceTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="instanceGenerations")
    def instance_generations(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "instanceGenerations"))

    @instance_generations.setter
    def instance_generations(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75c0a1e0a68ad3778d0952373e2e7e22e5454261a62838b299cf832946cab695)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceGenerations", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="localStorage")
    def local_storage(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "localStorage"))

    @local_storage.setter
    def local_storage(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d1871afa8b5238fe334c92bedabb0af8fcd6d62a07ece1a2bd7af3a78f79558)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "localStorage", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="localStorageTypes")
    def local_storage_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "localStorageTypes"))

    @local_storage_types.setter
    def local_storage_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40a26a51beb90a8757986a7e5c6d07d3c57f13a659fe03a68cae3c212ae51941)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d8df2fed054589d66e6f0f757f312bd1bbcdd5788db7ffa7cf521d2bddd1246d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1f952d28d07ad9ad510b90d1c4a59111c847cdcd5c129e2859d67e48e81356af)
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
            type_hints = typing.get_type_hints(_typecheckingstub__590ef2f35265a1e50f19dc28074a985991c7c812c6b594f69f9263935f1e4cf7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "requireHibernateSupport", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="spotMaxPricePercentageOverLowestPrice")
    def spot_max_price_percentage_over_lowest_price(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "spotMaxPricePercentageOverLowestPrice"))

    @spot_max_price_percentage_over_lowest_price.setter
    def spot_max_price_percentage_over_lowest_price(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e62bc9167569e7a882ac20dff79243ef0c75a0d098ec495f486092318a87c77)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "spotMaxPricePercentageOverLowestPrice", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b0e44e93bd990ccaf0ae30a55f7468322843550651779d7ffe931fcc0110c4b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06aab2f5ff1f1b5ee99d0ef262e2896e9d8d586273985384be317813140eb82a)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGbOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGbOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7f1a55d10e23a4948152e23e8594d745e8c97582041795db53c71086c661980a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__204004559430a67eb10367457de8f19130eaa3cab1a4f2529a36b18f653ec16e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__10265242bbf92a4d79c4ee0c73e219f0f3ffae3f53812cfc245005adf17a8d4f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c591d9fcf51995adf642ffc4912e95b96736aa8face56d99112f50f41cb265b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount",
    jsii_struct_bases=[],
    name_mapping={"max": "max", "min": "min"},
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount:
    def __init__(
        self,
        *,
        max: typing.Optional[jsii.Number] = None,
        min: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.
        :param min: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1f06feff8f93a3663bd42c2e79686b86fd28c456b460498d2186714b9a904c70)
            check_type(argname="argument max", value=max, expected_type=type_hints["max"])
            check_type(argname="argument min", value=min, expected_type=type_hints["min"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max is not None:
            self._values["max"] = max
        if min is not None:
            self._values["min"] = min

    @builtins.property
    def max(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max AutoscalingGroup#max}.'''
        result = self._values.get("max")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min AutoscalingGroup#min}.'''
        result = self._values.get("min")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCountOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCountOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d668b55e91a3fc96de44abcab8ec5c1b85a47ce48201c1fcf4f257b295baf96b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2a2c965965f8ff557aa9812c708f4d939be59d0bfa32b92199f494f56b0e217c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "max", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="min")
    def min(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "min"))

    @min.setter
    def min(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__17d528ca1ca3c6a2cd6bcf179152dbd3cd029b5ed2aa4242f2831746f9147872)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "min", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__235148d601a7d949f9d877b6bf683792c6ea76267096e4621656bce9774584dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification",
    jsii_struct_bases=[],
    name_mapping={
        "launch_template_id": "launchTemplateId",
        "launch_template_name": "launchTemplateName",
        "version": "version",
    },
)
class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification:
    def __init__(
        self,
        *,
        launch_template_id: typing.Optional[builtins.str] = None,
        launch_template_name: typing.Optional[builtins.str] = None,
        version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param launch_template_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_id AutoscalingGroup#launch_template_id}.
        :param launch_template_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_name AutoscalingGroup#launch_template_name}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#version AutoscalingGroup#version}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9bb8abff4ac95e737fab1861ef5ee94b88bc948d9f2399fefac8d475ea974398)
            check_type(argname="argument launch_template_id", value=launch_template_id, expected_type=type_hints["launch_template_id"])
            check_type(argname="argument launch_template_name", value=launch_template_name, expected_type=type_hints["launch_template_name"])
            check_type(argname="argument version", value=version, expected_type=type_hints["version"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if launch_template_id is not None:
            self._values["launch_template_id"] = launch_template_id
        if launch_template_name is not None:
            self._values["launch_template_name"] = launch_template_name
        if version is not None:
            self._values["version"] = version

    @builtins.property
    def launch_template_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_id AutoscalingGroup#launch_template_id}.'''
        result = self._values.get("launch_template_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def launch_template_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_name AutoscalingGroup#launch_template_name}.'''
        result = self._values.get("launch_template_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#version AutoscalingGroup#version}.'''
        result = self._values.get("version")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecificationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecificationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4a77e2bc026321f20e8e08a960a9e209f6e1370f0ad0079baa482ae68e49cb52)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetLaunchTemplateId")
    def reset_launch_template_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLaunchTemplateId", []))

    @jsii.member(jsii_name="resetLaunchTemplateName")
    def reset_launch_template_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLaunchTemplateName", []))

    @jsii.member(jsii_name="resetVersion")
    def reset_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVersion", []))

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
            type_hints = typing.get_type_hints(_typecheckingstub__da9f67690e0e3d716f383bc8a91754c6219cf37bb1fe029bc4b37451a6311365)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "launchTemplateId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="launchTemplateName")
    def launch_template_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "launchTemplateName"))

    @launch_template_name.setter
    def launch_template_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__976c6202bc15a35998a43b318e0aafc77628f6c515123ac8b00419265258877f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "launchTemplateName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="version")
    def version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "version"))

    @version.setter
    def version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5e300ad5dad47553104b855071a42c50c4cb7c0a3b0e8790d497e62595cc409)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "version", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3559922adf027a93550966365c9fe07965377fb02954941691abd53668f3a828)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6807a8df902439c7d2ef2f74ce8c4594cdb18a1994675bfab9ea07547b0029df)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__131dd48d76050a1b8e05547d4a9f1e5b1fa2b63f8e80690fb8d1f2a8832ff1e9)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__57c9368bacac6cbe2da05255e512d9df4668b03e3ab29f7283c626f4b021b6f9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d8b29f2359df27b6658e6fd2f8659e66cbd300ca5d4e5434c574e44a2b3bb87e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2cb8033bcf3afad2040493175daff8c7d65b2e6c8993815eb13d6a4b604cf017)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__73d0bcaeadf04cedce6bff970467785e770eecfac4ecf04ec6e208fa765ec6de)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__84524084c2915b7bb43e43c08550ff88173973349d722fdb1cae7abc32b792e1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putInstanceRequirements")
    def put_instance_requirements(
        self,
        *,
        accelerator_count: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount, typing.Dict[builtins.str, typing.Any]]] = None,
        accelerator_manufacturers: typing.Optional[typing.Sequence[builtins.str]] = None,
        accelerator_names: typing.Optional[typing.Sequence[builtins.str]] = None,
        accelerator_total_memory_mib: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib, typing.Dict[builtins.str, typing.Any]]] = None,
        accelerator_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        allowed_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        bare_metal: typing.Optional[builtins.str] = None,
        baseline_ebs_bandwidth_mbps: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps, typing.Dict[builtins.str, typing.Any]]] = None,
        burstable_performance: typing.Optional[builtins.str] = None,
        cpu_manufacturers: typing.Optional[typing.Sequence[builtins.str]] = None,
        excluded_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        instance_generations: typing.Optional[typing.Sequence[builtins.str]] = None,
        local_storage: typing.Optional[builtins.str] = None,
        local_storage_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        max_spot_price_as_percentage_of_optimal_on_demand_price: typing.Optional[jsii.Number] = None,
        memory_gib_per_vcpu: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu, typing.Dict[builtins.str, typing.Any]]] = None,
        memory_mib: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib, typing.Dict[builtins.str, typing.Any]]] = None,
        network_bandwidth_gbps: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps, typing.Dict[builtins.str, typing.Any]]] = None,
        network_interface_count: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount, typing.Dict[builtins.str, typing.Any]]] = None,
        on_demand_max_price_percentage_over_lowest_price: typing.Optional[jsii.Number] = None,
        require_hibernate_support: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        spot_max_price_percentage_over_lowest_price: typing.Optional[jsii.Number] = None,
        total_local_storage_gb: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb, typing.Dict[builtins.str, typing.Any]]] = None,
        vcpu_count: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param accelerator_count: accelerator_count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_count AutoscalingGroup#accelerator_count}
        :param accelerator_manufacturers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_manufacturers AutoscalingGroup#accelerator_manufacturers}.
        :param accelerator_names: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_names AutoscalingGroup#accelerator_names}.
        :param accelerator_total_memory_mib: accelerator_total_memory_mib block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_total_memory_mib AutoscalingGroup#accelerator_total_memory_mib}
        :param accelerator_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_types AutoscalingGroup#accelerator_types}.
        :param allowed_instance_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#allowed_instance_types AutoscalingGroup#allowed_instance_types}.
        :param bare_metal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#bare_metal AutoscalingGroup#bare_metal}.
        :param baseline_ebs_bandwidth_mbps: baseline_ebs_bandwidth_mbps block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#baseline_ebs_bandwidth_mbps AutoscalingGroup#baseline_ebs_bandwidth_mbps}
        :param burstable_performance: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#burstable_performance AutoscalingGroup#burstable_performance}.
        :param cpu_manufacturers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#cpu_manufacturers AutoscalingGroup#cpu_manufacturers}.
        :param excluded_instance_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#excluded_instance_types AutoscalingGroup#excluded_instance_types}.
        :param instance_generations: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_generations AutoscalingGroup#instance_generations}.
        :param local_storage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#local_storage AutoscalingGroup#local_storage}.
        :param local_storage_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#local_storage_types AutoscalingGroup#local_storage_types}.
        :param max_spot_price_as_percentage_of_optimal_on_demand_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_spot_price_as_percentage_of_optimal_on_demand_price AutoscalingGroup#max_spot_price_as_percentage_of_optimal_on_demand_price}.
        :param memory_gib_per_vcpu: memory_gib_per_vcpu block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#memory_gib_per_vcpu AutoscalingGroup#memory_gib_per_vcpu}
        :param memory_mib: memory_mib block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#memory_mib AutoscalingGroup#memory_mib}
        :param network_bandwidth_gbps: network_bandwidth_gbps block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#network_bandwidth_gbps AutoscalingGroup#network_bandwidth_gbps}
        :param network_interface_count: network_interface_count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#network_interface_count AutoscalingGroup#network_interface_count}
        :param on_demand_max_price_percentage_over_lowest_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_max_price_percentage_over_lowest_price AutoscalingGroup#on_demand_max_price_percentage_over_lowest_price}.
        :param require_hibernate_support: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#require_hibernate_support AutoscalingGroup#require_hibernate_support}.
        :param spot_max_price_percentage_over_lowest_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_max_price_percentage_over_lowest_price AutoscalingGroup#spot_max_price_percentage_over_lowest_price}.
        :param total_local_storage_gb: total_local_storage_gb block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#total_local_storage_gb AutoscalingGroup#total_local_storage_gb}
        :param vcpu_count: vcpu_count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#vcpu_count AutoscalingGroup#vcpu_count}
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements(
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
            memory_mib=memory_mib,
            network_bandwidth_gbps=network_bandwidth_gbps,
            network_interface_count=network_interface_count,
            on_demand_max_price_percentage_over_lowest_price=on_demand_max_price_percentage_over_lowest_price,
            require_hibernate_support=require_hibernate_support,
            spot_max_price_percentage_over_lowest_price=spot_max_price_percentage_over_lowest_price,
            total_local_storage_gb=total_local_storage_gb,
            vcpu_count=vcpu_count,
        )

        return typing.cast(None, jsii.invoke(self, "putInstanceRequirements", [value]))

    @jsii.member(jsii_name="putLaunchTemplateSpecification")
    def put_launch_template_specification(
        self,
        *,
        launch_template_id: typing.Optional[builtins.str] = None,
        launch_template_name: typing.Optional[builtins.str] = None,
        version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param launch_template_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_id AutoscalingGroup#launch_template_id}.
        :param launch_template_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_name AutoscalingGroup#launch_template_name}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#version AutoscalingGroup#version}.
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification(
            launch_template_id=launch_template_id,
            launch_template_name=launch_template_name,
            version=version,
        )

        return typing.cast(None, jsii.invoke(self, "putLaunchTemplateSpecification", [value]))

    @jsii.member(jsii_name="resetInstanceRequirements")
    def reset_instance_requirements(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceRequirements", []))

    @jsii.member(jsii_name="resetInstanceType")
    def reset_instance_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceType", []))

    @jsii.member(jsii_name="resetLaunchTemplateSpecification")
    def reset_launch_template_specification(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLaunchTemplateSpecification", []))

    @jsii.member(jsii_name="resetWeightedCapacity")
    def reset_weighted_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWeightedCapacity", []))

    @builtins.property
    @jsii.member(jsii_name="instanceRequirements")
    def instance_requirements(
        self,
    ) -> AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsOutputReference:
        return typing.cast(AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsOutputReference, jsii.get(self, "instanceRequirements"))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateSpecification")
    def launch_template_specification(
        self,
    ) -> AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecificationOutputReference:
        return typing.cast(AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecificationOutputReference, jsii.get(self, "launchTemplateSpecification"))

    @builtins.property
    @jsii.member(jsii_name="instanceRequirementsInput")
    def instance_requirements_input(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements], jsii.get(self, "instanceRequirementsInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceTypeInput")
    def instance_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "instanceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateSpecificationInput")
    def launch_template_specification_input(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification], jsii.get(self, "launchTemplateSpecificationInput"))

    @builtins.property
    @jsii.member(jsii_name="weightedCapacityInput")
    def weighted_capacity_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "weightedCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceType")
    def instance_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "instanceType"))

    @instance_type.setter
    def instance_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bdea1c87cd7f9427b73084b6df5859e3ea5c7297d32460d902178aaaac46675a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="weightedCapacity")
    def weighted_capacity(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "weightedCapacity"))

    @weighted_capacity.setter
    def weighted_capacity(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4695233ca4338ef81634067448a277ba916d6e56fb499878ea711457b033b504)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "weightedCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__95ad448b85ab379a4751b69c053c944596e5bd6d09842d5280ddd81a9f60c475)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AutoscalingGroupMixedInstancesPolicyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5d9eb6225fea75912e6401c7e1a06159c1764ea3aeeefe2d93e4c1425f3e9f44)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInstancesDistribution")
    def put_instances_distribution(
        self,
        *,
        on_demand_allocation_strategy: typing.Optional[builtins.str] = None,
        on_demand_base_capacity: typing.Optional[jsii.Number] = None,
        on_demand_percentage_above_base_capacity: typing.Optional[jsii.Number] = None,
        spot_allocation_strategy: typing.Optional[builtins.str] = None,
        spot_instance_pools: typing.Optional[jsii.Number] = None,
        spot_max_price: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param on_demand_allocation_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_allocation_strategy AutoscalingGroup#on_demand_allocation_strategy}.
        :param on_demand_base_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_base_capacity AutoscalingGroup#on_demand_base_capacity}.
        :param on_demand_percentage_above_base_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_percentage_above_base_capacity AutoscalingGroup#on_demand_percentage_above_base_capacity}.
        :param spot_allocation_strategy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_allocation_strategy AutoscalingGroup#spot_allocation_strategy}.
        :param spot_instance_pools: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_instance_pools AutoscalingGroup#spot_instance_pools}.
        :param spot_max_price: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_max_price AutoscalingGroup#spot_max_price}.
        '''
        value = AutoscalingGroupMixedInstancesPolicyInstancesDistribution(
            on_demand_allocation_strategy=on_demand_allocation_strategy,
            on_demand_base_capacity=on_demand_base_capacity,
            on_demand_percentage_above_base_capacity=on_demand_percentage_above_base_capacity,
            spot_allocation_strategy=spot_allocation_strategy,
            spot_instance_pools=spot_instance_pools,
            spot_max_price=spot_max_price,
        )

        return typing.cast(None, jsii.invoke(self, "putInstancesDistribution", [value]))

    @jsii.member(jsii_name="putLaunchTemplate")
    def put_launch_template(
        self,
        *,
        launch_template_specification: typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification, typing.Dict[builtins.str, typing.Any]],
        override: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param launch_template_specification: launch_template_specification block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_specification AutoscalingGroup#launch_template_specification}
        :param override: override block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#override AutoscalingGroup#override}
        '''
        value = AutoscalingGroupMixedInstancesPolicyLaunchTemplate(
            launch_template_specification=launch_template_specification,
            override=override,
        )

        return typing.cast(None, jsii.invoke(self, "putLaunchTemplate", [value]))

    @jsii.member(jsii_name="resetInstancesDistribution")
    def reset_instances_distribution(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstancesDistribution", []))

    @builtins.property
    @jsii.member(jsii_name="instancesDistribution")
    def instances_distribution(
        self,
    ) -> AutoscalingGroupMixedInstancesPolicyInstancesDistributionOutputReference:
        return typing.cast(AutoscalingGroupMixedInstancesPolicyInstancesDistributionOutputReference, jsii.get(self, "instancesDistribution"))

    @builtins.property
    @jsii.member(jsii_name="launchTemplate")
    def launch_template(
        self,
    ) -> AutoscalingGroupMixedInstancesPolicyLaunchTemplateOutputReference:
        return typing.cast(AutoscalingGroupMixedInstancesPolicyLaunchTemplateOutputReference, jsii.get(self, "launchTemplate"))

    @builtins.property
    @jsii.member(jsii_name="instancesDistributionInput")
    def instances_distribution_input(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyInstancesDistribution]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyInstancesDistribution], jsii.get(self, "instancesDistributionInput"))

    @builtins.property
    @jsii.member(jsii_name="launchTemplateInput")
    def launch_template_input(
        self,
    ) -> typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplate]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplate], jsii.get(self, "launchTemplateInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AutoscalingGroupMixedInstancesPolicy]:
        return typing.cast(typing.Optional[AutoscalingGroupMixedInstancesPolicy], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupMixedInstancesPolicy],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b733a1656067e1fa29828f802701eea847ccdac6cfd883bbc3e5af9ae85f146)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupTag",
    jsii_struct_bases=[],
    name_mapping={
        "key": "key",
        "propagate_at_launch": "propagateAtLaunch",
        "value": "value",
    },
)
class AutoscalingGroupTag:
    def __init__(
        self,
        *,
        key: builtins.str,
        propagate_at_launch: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        value: builtins.str,
    ) -> None:
        '''
        :param key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#key AutoscalingGroup#key}.
        :param propagate_at_launch: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#propagate_at_launch AutoscalingGroup#propagate_at_launch}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#value AutoscalingGroup#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33921d9f387697d55af83cd6d5efb1f28ec83c94b4ca4943a06bef8ac3a8db8a)
            check_type(argname="argument key", value=key, expected_type=type_hints["key"])
            check_type(argname="argument propagate_at_launch", value=propagate_at_launch, expected_type=type_hints["propagate_at_launch"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "key": key,
            "propagate_at_launch": propagate_at_launch,
            "value": value,
        }

    @builtins.property
    def key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#key AutoscalingGroup#key}.'''
        result = self._values.get("key")
        assert result is not None, "Required property 'key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def propagate_at_launch(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#propagate_at_launch AutoscalingGroup#propagate_at_launch}.'''
        result = self._values.get("propagate_at_launch")
        assert result is not None, "Required property 'propagate_at_launch' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#value AutoscalingGroup#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupTag(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupTagList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupTagList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6c55ebbb6531e3ef322c2715b56770f399f012902007f1105c495b434bc4364a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "AutoscalingGroupTagOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b89847ca35fdeb9d415a93ff9e7dead139ffbe038cefa5abf35d52c374f64a3b)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("AutoscalingGroupTagOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0221236d92a35a0441b05ec45816f2da988a25efac41856fa9974defd8fcff20)
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
            type_hints = typing.get_type_hints(_typecheckingstub__aebe75458c0e56ec395bd51d7d96515d61eb05d67ad4db39773f4fad0872728d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1bdc243a279014c9b2d18d15376d85ac8b63c4630d2713b46c5588e083a887a9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupTag]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupTag]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupTag]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d2245a6aad693374563eb5370c55a01f815541687748a278a4c1ef5c1f0d0d2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AutoscalingGroupTagOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupTagOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c6517c218bfbdbcdd866580e5be6c58ba6d46bb6e538890cb6eacd4e06e7e2c9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="keyInput")
    def key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "keyInput"))

    @builtins.property
    @jsii.member(jsii_name="propagateAtLaunchInput")
    def propagate_at_launch_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "propagateAtLaunchInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="key")
    def key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "key"))

    @key.setter
    def key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c0d17c6fb836f8a6684aad3935ed985e79227e9280f2c6401e63037f6f1ec71)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "key", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="propagateAtLaunch")
    def propagate_at_launch(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "propagateAtLaunch"))

    @propagate_at_launch.setter
    def propagate_at_launch(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3674b0c69b8dd7c4a8ed9eb1d7c29aa59668a2ef36d1a3d49ac5b9ea7968ce4e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "propagateAtLaunch", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__71d9a6fe2befcd72123a9068daa82862a63bd87d61013a4cdebacef790b5cd8e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupTag]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupTag]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupTag]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2bf8de8c6bf21aadf746f482eda0cb2a5445b9c9e9c65e30bc9e420f92469538)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupTimeouts",
    jsii_struct_bases=[],
    name_mapping={"delete": "delete", "update": "update"},
)
class AutoscalingGroupTimeouts:
    def __init__(
        self,
        *,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#delete AutoscalingGroup#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#update AutoscalingGroup#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5bc24fc6384be4b6857f593617a518e5e9626fb5ca7ffb7a87e835922fe30220)
            check_type(argname="argument delete", value=delete, expected_type=type_hints["delete"])
            check_type(argname="argument update", value=update, expected_type=type_hints["update"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if delete is not None:
            self._values["delete"] = delete
        if update is not None:
            self._values["update"] = update

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#delete AutoscalingGroup#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#update AutoscalingGroup#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9e98a4b624ae643ecf2ad7b32a7ee2457b5a3ce4cfdff5b0e4c535704f0612ff)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDelete")
    def reset_delete(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDelete", []))

    @jsii.member(jsii_name="resetUpdate")
    def reset_update(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUpdate", []))

    @builtins.property
    @jsii.member(jsii_name="deleteInput")
    def delete_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deleteInput"))

    @builtins.property
    @jsii.member(jsii_name="updateInput")
    def update_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "updateInput"))

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86d5b06ee7e7bfbf3ba78d31274b8dc0a25e661ca600f4842f602d026332d46d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e18b42dcd21b59f0ee7c07779cef2ffc2a41acf8f2b2beae7de39a5e8847c873)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1fdbfe0791dc1a6a18625a73619f916c4e48f305e968478c941e81f6f2cce63a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupTrafficSource",
    jsii_struct_bases=[],
    name_mapping={"identifier": "identifier", "type": "type"},
)
class AutoscalingGroupTrafficSource:
    def __init__(
        self,
        *,
        identifier: builtins.str,
        type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#identifier AutoscalingGroup#identifier}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#type AutoscalingGroup#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a264468a9252133cb8c69bef2d968754666ed2d2802724b0f5ba984c64cd2fd)
            check_type(argname="argument identifier", value=identifier, expected_type=type_hints["identifier"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "identifier": identifier,
        }
        if type is not None:
            self._values["type"] = type

    @builtins.property
    def identifier(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#identifier AutoscalingGroup#identifier}.'''
        result = self._values.get("identifier")
        assert result is not None, "Required property 'identifier' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#type AutoscalingGroup#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupTrafficSource(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupTrafficSourceList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupTrafficSourceList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__74abb32218dacdf05d4613c2c9c1ddf1f4f4a5dcaece17959d72483f27ef71ab)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "AutoscalingGroupTrafficSourceOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a05fd13eeca5e22b95a394044b8267f7eb77902c612178b1b66c33637f43e5ab)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("AutoscalingGroupTrafficSourceOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d1e73179daf2737c3201e5edb2692889d79edafcd8514d4f0f72955b99ac4383)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b5fc9a5e1269d3a7ca666b63ad09219bc4b977555fef7917061c7b2489d1f17b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1b81cb4923ec5de8129bd42e1f33939145835bd12fad036c61b2c471dbfe28b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupTrafficSource]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupTrafficSource]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupTrafficSource]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7697ca5c661ed01ae30ccab579ee2b0423ce65da73fc6cb5aec69d0d171a3ae4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AutoscalingGroupTrafficSourceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupTrafficSourceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__88567404dcc4f0b9507a85fefc0e84361f9fd50584862803b9122cb869b559e3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @builtins.property
    @jsii.member(jsii_name="identifierInput")
    def identifier_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "identifierInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="identifier")
    def identifier(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "identifier"))

    @identifier.setter
    def identifier(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__be10d941b5a12047fa27f8230dd1576b865f969567c1aed9cbcf0909038b3640)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "identifier", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fdfec1750473aae4101dd9b5e1529f85fd4a7b296e23bcc8c4cc9cb80c616573)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupTrafficSource]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupTrafficSource]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupTrafficSource]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__53ecce1ef80edaee3c3f3b41dbd22accc326e0328dc9256a068e03be2fdfa28b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupWarmPool",
    jsii_struct_bases=[],
    name_mapping={
        "instance_reuse_policy": "instanceReusePolicy",
        "max_group_prepared_capacity": "maxGroupPreparedCapacity",
        "min_size": "minSize",
        "pool_state": "poolState",
    },
)
class AutoscalingGroupWarmPool:
    def __init__(
        self,
        *,
        instance_reuse_policy: typing.Optional[typing.Union["AutoscalingGroupWarmPoolInstanceReusePolicy", typing.Dict[builtins.str, typing.Any]]] = None,
        max_group_prepared_capacity: typing.Optional[jsii.Number] = None,
        min_size: typing.Optional[jsii.Number] = None,
        pool_state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_reuse_policy: instance_reuse_policy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_reuse_policy AutoscalingGroup#instance_reuse_policy}
        :param max_group_prepared_capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_group_prepared_capacity AutoscalingGroup#max_group_prepared_capacity}.
        :param min_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_size AutoscalingGroup#min_size}.
        :param pool_state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#pool_state AutoscalingGroup#pool_state}.
        '''
        if isinstance(instance_reuse_policy, dict):
            instance_reuse_policy = AutoscalingGroupWarmPoolInstanceReusePolicy(**instance_reuse_policy)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efc261a784f287ad43e3b5aa91a57c486357bdf599dec56ad679129a173bfb3b)
            check_type(argname="argument instance_reuse_policy", value=instance_reuse_policy, expected_type=type_hints["instance_reuse_policy"])
            check_type(argname="argument max_group_prepared_capacity", value=max_group_prepared_capacity, expected_type=type_hints["max_group_prepared_capacity"])
            check_type(argname="argument min_size", value=min_size, expected_type=type_hints["min_size"])
            check_type(argname="argument pool_state", value=pool_state, expected_type=type_hints["pool_state"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if instance_reuse_policy is not None:
            self._values["instance_reuse_policy"] = instance_reuse_policy
        if max_group_prepared_capacity is not None:
            self._values["max_group_prepared_capacity"] = max_group_prepared_capacity
        if min_size is not None:
            self._values["min_size"] = min_size
        if pool_state is not None:
            self._values["pool_state"] = pool_state

    @builtins.property
    def instance_reuse_policy(
        self,
    ) -> typing.Optional["AutoscalingGroupWarmPoolInstanceReusePolicy"]:
        '''instance_reuse_policy block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_reuse_policy AutoscalingGroup#instance_reuse_policy}
        '''
        result = self._values.get("instance_reuse_policy")
        return typing.cast(typing.Optional["AutoscalingGroupWarmPoolInstanceReusePolicy"], result)

    @builtins.property
    def max_group_prepared_capacity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_group_prepared_capacity AutoscalingGroup#max_group_prepared_capacity}.'''
        result = self._values.get("max_group_prepared_capacity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min_size(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_size AutoscalingGroup#min_size}.'''
        result = self._values.get("min_size")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def pool_state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#pool_state AutoscalingGroup#pool_state}.'''
        result = self._values.get("pool_state")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupWarmPool(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.autoscalingGroup.AutoscalingGroupWarmPoolInstanceReusePolicy",
    jsii_struct_bases=[],
    name_mapping={"reuse_on_scale_in": "reuseOnScaleIn"},
)
class AutoscalingGroupWarmPoolInstanceReusePolicy:
    def __init__(
        self,
        *,
        reuse_on_scale_in: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param reuse_on_scale_in: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#reuse_on_scale_in AutoscalingGroup#reuse_on_scale_in}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f5cb7b70b7ba5768fa0e30df2f694ddaaa331fd23ed7a90070c83126ad6f57a4)
            check_type(argname="argument reuse_on_scale_in", value=reuse_on_scale_in, expected_type=type_hints["reuse_on_scale_in"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if reuse_on_scale_in is not None:
            self._values["reuse_on_scale_in"] = reuse_on_scale_in

    @builtins.property
    def reuse_on_scale_in(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#reuse_on_scale_in AutoscalingGroup#reuse_on_scale_in}.'''
        result = self._values.get("reuse_on_scale_in")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AutoscalingGroupWarmPoolInstanceReusePolicy(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AutoscalingGroupWarmPoolInstanceReusePolicyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupWarmPoolInstanceReusePolicyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4acb7ae3be94f490a7d8c455ad6609fe7068014fa0186a306544540704b48d1e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetReuseOnScaleIn")
    def reset_reuse_on_scale_in(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReuseOnScaleIn", []))

    @builtins.property
    @jsii.member(jsii_name="reuseOnScaleInInput")
    def reuse_on_scale_in_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "reuseOnScaleInInput"))

    @builtins.property
    @jsii.member(jsii_name="reuseOnScaleIn")
    def reuse_on_scale_in(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "reuseOnScaleIn"))

    @reuse_on_scale_in.setter
    def reuse_on_scale_in(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__23d12e350603daa576fbb2458c76000af2346372fcfc2c3c81b3732d07356b83)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "reuseOnScaleIn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AutoscalingGroupWarmPoolInstanceReusePolicy]:
        return typing.cast(typing.Optional[AutoscalingGroupWarmPoolInstanceReusePolicy], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AutoscalingGroupWarmPoolInstanceReusePolicy],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87aca93a69aca11d621454ba7191773a78bbb1bd186fdd7592980c00590fffa8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AutoscalingGroupWarmPoolOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.autoscalingGroup.AutoscalingGroupWarmPoolOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__68eef489342008415937883ce99d678d4cb20c27fb0b5add9d2fc07ebaccd3c0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInstanceReusePolicy")
    def put_instance_reuse_policy(
        self,
        *,
        reuse_on_scale_in: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param reuse_on_scale_in: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#reuse_on_scale_in AutoscalingGroup#reuse_on_scale_in}.
        '''
        value = AutoscalingGroupWarmPoolInstanceReusePolicy(
            reuse_on_scale_in=reuse_on_scale_in
        )

        return typing.cast(None, jsii.invoke(self, "putInstanceReusePolicy", [value]))

    @jsii.member(jsii_name="resetInstanceReusePolicy")
    def reset_instance_reuse_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceReusePolicy", []))

    @jsii.member(jsii_name="resetMaxGroupPreparedCapacity")
    def reset_max_group_prepared_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxGroupPreparedCapacity", []))

    @jsii.member(jsii_name="resetMinSize")
    def reset_min_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinSize", []))

    @jsii.member(jsii_name="resetPoolState")
    def reset_pool_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPoolState", []))

    @builtins.property
    @jsii.member(jsii_name="instanceReusePolicy")
    def instance_reuse_policy(
        self,
    ) -> AutoscalingGroupWarmPoolInstanceReusePolicyOutputReference:
        return typing.cast(AutoscalingGroupWarmPoolInstanceReusePolicyOutputReference, jsii.get(self, "instanceReusePolicy"))

    @builtins.property
    @jsii.member(jsii_name="instanceReusePolicyInput")
    def instance_reuse_policy_input(
        self,
    ) -> typing.Optional[AutoscalingGroupWarmPoolInstanceReusePolicy]:
        return typing.cast(typing.Optional[AutoscalingGroupWarmPoolInstanceReusePolicy], jsii.get(self, "instanceReusePolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="maxGroupPreparedCapacityInput")
    def max_group_prepared_capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxGroupPreparedCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="minSizeInput")
    def min_size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minSizeInput"))

    @builtins.property
    @jsii.member(jsii_name="poolStateInput")
    def pool_state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "poolStateInput"))

    @builtins.property
    @jsii.member(jsii_name="maxGroupPreparedCapacity")
    def max_group_prepared_capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxGroupPreparedCapacity"))

    @max_group_prepared_capacity.setter
    def max_group_prepared_capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e9957277228ea7b8509dc3cdf8106e64fc42f4b895143f7191d5c75fe0f78e3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxGroupPreparedCapacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minSize")
    def min_size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minSize"))

    @min_size.setter
    def min_size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__796cb9a797892cfe447a833687134a818386132893b2b5ea101f1f4b1624488b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minSize", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="poolState")
    def pool_state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "poolState"))

    @pool_state.setter
    def pool_state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__538c1beb70a59eb45d29b015612fed7bc38a46bf0bf65ae7c846442e5122488a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "poolState", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AutoscalingGroupWarmPool]:
        return typing.cast(typing.Optional[AutoscalingGroupWarmPool], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[AutoscalingGroupWarmPool]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d28099c87c35857f49b2b9816116e726f34de4a4161cac1962b395a335dc2b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "AutoscalingGroup",
    "AutoscalingGroupAvailabilityZoneDistribution",
    "AutoscalingGroupAvailabilityZoneDistributionOutputReference",
    "AutoscalingGroupCapacityReservationSpecification",
    "AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget",
    "AutoscalingGroupCapacityReservationSpecificationCapacityReservationTargetOutputReference",
    "AutoscalingGroupCapacityReservationSpecificationOutputReference",
    "AutoscalingGroupConfig",
    "AutoscalingGroupInitialLifecycleHook",
    "AutoscalingGroupInitialLifecycleHookList",
    "AutoscalingGroupInitialLifecycleHookOutputReference",
    "AutoscalingGroupInstanceMaintenancePolicy",
    "AutoscalingGroupInstanceMaintenancePolicyOutputReference",
    "AutoscalingGroupInstanceRefresh",
    "AutoscalingGroupInstanceRefreshOutputReference",
    "AutoscalingGroupInstanceRefreshPreferences",
    "AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification",
    "AutoscalingGroupInstanceRefreshPreferencesAlarmSpecificationOutputReference",
    "AutoscalingGroupInstanceRefreshPreferencesOutputReference",
    "AutoscalingGroupLaunchTemplate",
    "AutoscalingGroupLaunchTemplateOutputReference",
    "AutoscalingGroupMixedInstancesPolicy",
    "AutoscalingGroupMixedInstancesPolicyInstancesDistribution",
    "AutoscalingGroupMixedInstancesPolicyInstancesDistributionOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplate",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecificationOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCountOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMibOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpuOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMibOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbpsOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCountOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGbOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCountOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecificationOutputReference",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideList",
    "AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideOutputReference",
    "AutoscalingGroupMixedInstancesPolicyOutputReference",
    "AutoscalingGroupTag",
    "AutoscalingGroupTagList",
    "AutoscalingGroupTagOutputReference",
    "AutoscalingGroupTimeouts",
    "AutoscalingGroupTimeoutsOutputReference",
    "AutoscalingGroupTrafficSource",
    "AutoscalingGroupTrafficSourceList",
    "AutoscalingGroupTrafficSourceOutputReference",
    "AutoscalingGroupWarmPool",
    "AutoscalingGroupWarmPoolInstanceReusePolicy",
    "AutoscalingGroupWarmPoolInstanceReusePolicyOutputReference",
    "AutoscalingGroupWarmPoolOutputReference",
]

publication.publish()

def _typecheckingstub__cc60a750015678917ef7bc59a6c6c70568e9808733949153f65dfb7d9a7effa0(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    max_size: jsii.Number,
    min_size: jsii.Number,
    availability_zone_distribution: typing.Optional[typing.Union[AutoscalingGroupAvailabilityZoneDistribution, typing.Dict[builtins.str, typing.Any]]] = None,
    availability_zones: typing.Optional[typing.Sequence[builtins.str]] = None,
    capacity_rebalance: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    capacity_reservation_specification: typing.Optional[typing.Union[AutoscalingGroupCapacityReservationSpecification, typing.Dict[builtins.str, typing.Any]]] = None,
    context: typing.Optional[builtins.str] = None,
    default_cooldown: typing.Optional[jsii.Number] = None,
    default_instance_warmup: typing.Optional[jsii.Number] = None,
    desired_capacity: typing.Optional[jsii.Number] = None,
    desired_capacity_type: typing.Optional[builtins.str] = None,
    enabled_metrics: typing.Optional[typing.Sequence[builtins.str]] = None,
    force_delete: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    force_delete_warm_pool: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    health_check_grace_period: typing.Optional[jsii.Number] = None,
    health_check_type: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    ignore_failed_scaling_activities: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    initial_lifecycle_hook: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AutoscalingGroupInitialLifecycleHook, typing.Dict[builtins.str, typing.Any]]]]] = None,
    instance_maintenance_policy: typing.Optional[typing.Union[AutoscalingGroupInstanceMaintenancePolicy, typing.Dict[builtins.str, typing.Any]]] = None,
    instance_refresh: typing.Optional[typing.Union[AutoscalingGroupInstanceRefresh, typing.Dict[builtins.str, typing.Any]]] = None,
    launch_configuration: typing.Optional[builtins.str] = None,
    launch_template: typing.Optional[typing.Union[AutoscalingGroupLaunchTemplate, typing.Dict[builtins.str, typing.Any]]] = None,
    load_balancers: typing.Optional[typing.Sequence[builtins.str]] = None,
    max_instance_lifetime: typing.Optional[jsii.Number] = None,
    metrics_granularity: typing.Optional[builtins.str] = None,
    min_elb_capacity: typing.Optional[jsii.Number] = None,
    mixed_instances_policy: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicy, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    placement_group: typing.Optional[builtins.str] = None,
    protect_from_scale_in: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    service_linked_role_arn: typing.Optional[builtins.str] = None,
    suspended_processes: typing.Optional[typing.Sequence[builtins.str]] = None,
    tag: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AutoscalingGroupTag, typing.Dict[builtins.str, typing.Any]]]]] = None,
    target_group_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    termination_policies: typing.Optional[typing.Sequence[builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[AutoscalingGroupTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    traffic_source: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AutoscalingGroupTrafficSource, typing.Dict[builtins.str, typing.Any]]]]] = None,
    vpc_zone_identifier: typing.Optional[typing.Sequence[builtins.str]] = None,
    wait_for_capacity_timeout: typing.Optional[builtins.str] = None,
    wait_for_elb_capacity: typing.Optional[jsii.Number] = None,
    warm_pool: typing.Optional[typing.Union[AutoscalingGroupWarmPool, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__4d8015046ddb611b1463b4f084c1906504556e6bd8f2418b2b9826905c8fcb75(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96acacd3efd24f62b07182f9ef6f0bfcf452e0927038031a8728a8630fb5e906(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AutoscalingGroupInitialLifecycleHook, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f013eddc2efca7832526ad4539c62f7ebb69667002beacb47f3f8e0e26f58965(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AutoscalingGroupTag, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0c8e1b7cae37f7c5b998c93a650387169d372f6c9eeeaeef6e464300d1d566d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AutoscalingGroupTrafficSource, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5366fd23f5a754b230e7799a228718e27f37d42bfd2b772d1adf6d68fe180943(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8fcbe25b9defc4ebe682db2a0ac7d9c6c2279ab47e5252cb0753a1f03cc8e33(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6906919755407ff5e1c1f55c4e3096c5c7c7db9c9ffff7724aceaaa9556b749(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__894d9bf1782c16c74ad3083d97ab3de767ed864a75c5b058ea34088f2c47c250(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6726893d1e789753bb6a03cad79e6db60153161503bee3cf3afd5ec3796f2a6e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab952b2d4e8dea42d3a065983ad3e826da1b94c1e303a74eefe6173c403661c2(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2390fc22c6c8143d2525fd3b9b76dc63618de29eb5c9148890a43d2176aca628(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__809fc9f9e78be5319309c9f70f26cd66885d2218a7aea86d4e5a40c3d373542e(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ade7e41f54d7c2c5f849439cf5a69cec6410991c05b47a34795fd45755933d8e(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ed016bbc155c7cdcdf1034b30a65078f4bfe9ed7dd654029110f81c165025d3(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__250eeb23b4a4c44317148a24b511cb3c55df45732a03603c58bb9a600520c6b9(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b1a1dc35d20328873e0f9d567d19e69dab18f074e5e7e1a3b1686489118b747(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cadf5dca8d512e40831e831b4107c66e01e21599d3879a5e78bd3f733f446b47(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e4f6a00e49d412482d44c0311794a4856dff638389b3185f55bbe3f58a03d20(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7195d09867dcbb507ce445938f1428eede1560c5de2b020fed5e83f679f41bc6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__998118813b10fd3c06a86bc6304addf847c8db68dba799f7c94bfa7a8370f4fc(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e70c4a8d3ccfc2a467ed95d3bd92d18e9f2b79afbc1c79c56a0bda5b5f84b5e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__196d5ae0c23b6ac2a92d9d5255c0284aa7d29ce3be59c9d1c4d96b9437a9d978(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3aaec2b7d4e5185ff19e111ee8a504d18f1da14a7251486f2cf62bece7b4528c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9aa55452ad44136b8cc3724b89432a7f7464f70e625e69f3f34859d6bc456ce5(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7a0798cc516adc98e8fd728f0833b2bd8df672257cfa1d56ef24c3c5a16ceecb(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__992ffec32464f123c17eace68e92c66aea8052c133f213aa1c8bff4a8844f71c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4075057685879b58be88e97fd066d1f371d52f6b22eab83319d3fcb9e1368a3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35781dcf56586fee98dfded5942e1f8f99318e736b5eb9af77b211f95a59427e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b37a8cdb990aff91fa5a8a08f70c1dc16f7e7ecbf33af3a799d44aefdc1e397(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dccfd8c3e7cc7d6cb79c4c5fa0deb221f90e40a1faca0dfb75bedaa1853cc681(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a937c73874d69a134180958e85911dab44a47aa3191abad53d365dbffc2bb311(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c88d518aacf921c79772f525acd4efc400fc9538e298d92639da705a9b1419c4(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d29d511c33f3eff2f1e48801d587dc534ca8dbd8f7ad0ab530b2fd56c9e3c5ba(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c510b2791cbedd762a72775b0d0c7b2cddeeef2c9659b537fc851dccffc35786(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__92b7638c3b322882530c00c205751371c49b9646f237c3e972672098a4c9b5d4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6a5d1af2feeb437a918baf0203c27dcc89f0cee5e08e051d05b127a177103e26(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f4bbccd1e20a86dd59e8b8cc8ad8dd138d75ca5d7bd5153f4c09b66d38556ba(
    *,
    capacity_distribution_strategy: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4cefbfcc4fa7d2b0c325d5e8a25e5b5a2bd794fe0bcbd3004371b53ce714ca57(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9fadbcab0f5b76b5051ec9d25fe80d8330e660014b65960285c105a3191840a5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__55f03ac7fc847cc0fd0b8a7bd6c321eae9a6ace36831f162a5f0bc8156a81bad(
    value: typing.Optional[AutoscalingGroupAvailabilityZoneDistribution],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__58e1ad7b34b05a91bcfa57bb69b27395e6d8c75211f75eb0964bbaea5a8a6d5c(
    *,
    capacity_reservation_preference: typing.Optional[builtins.str] = None,
    capacity_reservation_target: typing.Optional[typing.Union[AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b6849998174d7cb686aeeba15e42c3710906516fb50fe9462916cd5d23da8c9(
    *,
    capacity_reservation_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    capacity_reservation_resource_group_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f69d88751898d31c077933cc875e47507b45f565e6a4a0ae561a27aeb0ec1d65(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b420f2a9fe93057794b82f58cf2aad778132522a47bd2e93dc4919a26d4901b(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00c3886f87357038aeb093d8d7140bbb3ef21d96a7872479227c2502b0b0d0b1(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b34a459cd9011cf3c338b48bb11639d730fd9e61b278ed0b81365e29e91dd3d(
    value: typing.Optional[AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c48e32fc249b9d5adee83e5cbb09ff52bc4db19cf1b97cc274c15d8d043c47c7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac105d6ff67050cf9de9ecbf358a927a692b40871983b4a0031dfab5b6a544b8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23385ee061b8edc971ae0901935ea05912410de0ea0fd9c31abf0feb75e6e3c1(
    value: typing.Optional[AutoscalingGroupCapacityReservationSpecification],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d160886e1f5ffa51f26af05628a6a22b95f92e1ba716671376b94d477f95ed64(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    max_size: jsii.Number,
    min_size: jsii.Number,
    availability_zone_distribution: typing.Optional[typing.Union[AutoscalingGroupAvailabilityZoneDistribution, typing.Dict[builtins.str, typing.Any]]] = None,
    availability_zones: typing.Optional[typing.Sequence[builtins.str]] = None,
    capacity_rebalance: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    capacity_reservation_specification: typing.Optional[typing.Union[AutoscalingGroupCapacityReservationSpecification, typing.Dict[builtins.str, typing.Any]]] = None,
    context: typing.Optional[builtins.str] = None,
    default_cooldown: typing.Optional[jsii.Number] = None,
    default_instance_warmup: typing.Optional[jsii.Number] = None,
    desired_capacity: typing.Optional[jsii.Number] = None,
    desired_capacity_type: typing.Optional[builtins.str] = None,
    enabled_metrics: typing.Optional[typing.Sequence[builtins.str]] = None,
    force_delete: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    force_delete_warm_pool: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    health_check_grace_period: typing.Optional[jsii.Number] = None,
    health_check_type: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    ignore_failed_scaling_activities: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    initial_lifecycle_hook: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AutoscalingGroupInitialLifecycleHook, typing.Dict[builtins.str, typing.Any]]]]] = None,
    instance_maintenance_policy: typing.Optional[typing.Union[AutoscalingGroupInstanceMaintenancePolicy, typing.Dict[builtins.str, typing.Any]]] = None,
    instance_refresh: typing.Optional[typing.Union[AutoscalingGroupInstanceRefresh, typing.Dict[builtins.str, typing.Any]]] = None,
    launch_configuration: typing.Optional[builtins.str] = None,
    launch_template: typing.Optional[typing.Union[AutoscalingGroupLaunchTemplate, typing.Dict[builtins.str, typing.Any]]] = None,
    load_balancers: typing.Optional[typing.Sequence[builtins.str]] = None,
    max_instance_lifetime: typing.Optional[jsii.Number] = None,
    metrics_granularity: typing.Optional[builtins.str] = None,
    min_elb_capacity: typing.Optional[jsii.Number] = None,
    mixed_instances_policy: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicy, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    placement_group: typing.Optional[builtins.str] = None,
    protect_from_scale_in: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    service_linked_role_arn: typing.Optional[builtins.str] = None,
    suspended_processes: typing.Optional[typing.Sequence[builtins.str]] = None,
    tag: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AutoscalingGroupTag, typing.Dict[builtins.str, typing.Any]]]]] = None,
    target_group_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    termination_policies: typing.Optional[typing.Sequence[builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[AutoscalingGroupTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    traffic_source: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AutoscalingGroupTrafficSource, typing.Dict[builtins.str, typing.Any]]]]] = None,
    vpc_zone_identifier: typing.Optional[typing.Sequence[builtins.str]] = None,
    wait_for_capacity_timeout: typing.Optional[builtins.str] = None,
    wait_for_elb_capacity: typing.Optional[jsii.Number] = None,
    warm_pool: typing.Optional[typing.Union[AutoscalingGroupWarmPool, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__95cda0cce35aa0b728c1081f09f6672c97ebe5be85ddea9ea913361f4433b10e(
    *,
    lifecycle_transition: builtins.str,
    name: builtins.str,
    default_result: typing.Optional[builtins.str] = None,
    heartbeat_timeout: typing.Optional[jsii.Number] = None,
    notification_metadata: typing.Optional[builtins.str] = None,
    notification_target_arn: typing.Optional[builtins.str] = None,
    role_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4854486a2f700069483d4960d137ca30f1e21873d408d45cfde0d9478aa1bbf5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__308d32abc6cbcf0335682377c111fd629fe55473c6202e041c273985402ad468(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1dff6a488f14f600200845bc28def9a8320a3982857e80eeda50b853a68fcdf1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0aa512a62b1d760792269fcc517fe610a1fb02eb4e7cc8596fe71773dc50e973(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__907341431e8afeba48ecff7e66b0dee0a2a896e12abbc48db5a9b922993bbccc(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__123497ac4a21e7a956d50375b77f3900aff429b3121d73f1dc2c281321ce0949(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupInitialLifecycleHook]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__720f76cd7e44d31ada31ea68cc23c99ab17596448e2a055dfcdc50c7e1af9637(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6b596a4e7da5567f68418abb704a34b6dbfb8c136920e1e4436e600638b504f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__212aba3d617f507bf5f4559929f7201dd83a1144ebe543d3244a8919800b5867(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__206344a10a326f319931ffcf4c035b747b5467b8e5dda2972bef5df905baa4a4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dbe6957122679cf4f5c045e48b14d373692b389512af362a1498d917a4c6f4f7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5dcec611a170ac90a62b708ac8cec651029ee3f34a679ffa5bc7eec817b2de50(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__977c1cd64c4e2e220ec06e30f29932d88784eaddceddecbf172bf140340c4109(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c9d697dc3bf85879e17fb03020afbe0f29f741d5020b46c3f3311f7b1b6ff06(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c360224d4fc3c6061fb2718edc6a2698c26ecd12efa8dc3e4ec0f8c328361115(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupInitialLifecycleHook]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__144a4385c25098beb0641290b3a32daa36ed92cef92907ec76ccb5d30e96d180(
    *,
    max_healthy_percentage: jsii.Number,
    min_healthy_percentage: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__783a3ce8144d6362dd1edb44e125e85732f581d8c17421dbde6f3ece8e9fad9f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c4cff067ebbcdbdf677dd2746df142aaeb7777e9a0ea264967e2ad2b3cf61e7(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec6fbb5c482d1959ceaaaccdeeb5eda7a4959c4e86323f8fa33fad03fe12315b(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06207887a70467d39a3b90d8ef5371f53a15756914428276550e2711a2d42d34(
    value: typing.Optional[AutoscalingGroupInstanceMaintenancePolicy],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a88bff3974245747f4ab1dfff984ad56eea4b5678dea5554b53b7c4dc636c27(
    *,
    strategy: builtins.str,
    preferences: typing.Optional[typing.Union[AutoscalingGroupInstanceRefreshPreferences, typing.Dict[builtins.str, typing.Any]]] = None,
    triggers: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__024bba6547e607e18f0df709a83221b538d990caba3b575eb7b3702fae6e98ef(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81a9a2fe27003b53bc298d558529793f127b57444aaf4d7e747043ff9136ab20(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61589cb36b2b896985658371850db472dce157f2664b3fa0b2b59904e0b61345(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15597e86a4765a980298e31bab2e78561e14ff5a194efa84e4999032b6be1b91(
    value: typing.Optional[AutoscalingGroupInstanceRefresh],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__931a40a9eb1caac9008a47c07556d70d7b2174544feac5fcfe7e57fc2406361c(
    *,
    alarm_specification: typing.Optional[typing.Union[AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification, typing.Dict[builtins.str, typing.Any]]] = None,
    auto_rollback: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    checkpoint_delay: typing.Optional[builtins.str] = None,
    checkpoint_percentages: typing.Optional[typing.Sequence[jsii.Number]] = None,
    instance_warmup: typing.Optional[builtins.str] = None,
    max_healthy_percentage: typing.Optional[jsii.Number] = None,
    min_healthy_percentage: typing.Optional[jsii.Number] = None,
    scale_in_protected_instances: typing.Optional[builtins.str] = None,
    skip_matching: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    standby_instances: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8aeaafee1b2ac8f7bd6061ee29af8d6082793d5114ff2f06df8f8bc873a17b4(
    *,
    alarms: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09a0892ba9748ffe28528c9ea60fc93b0dafc4bd74e730dfb65390c929a7c90a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7db26ab9490a17c88f7711cad693422d437dd4583d839e83d4f8978a4ba1065f(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1ef110973c9053072460e2d5529164bfa6a7ed0e6046f9c2546c38145d98382(
    value: typing.Optional[AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a23a1ac41bc9081457d8055cae96416cc61340a7f8a89d89c01209eecbfdbcc0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c133e3f6f42ef6c53a1d4350fa18301ff24fcc244018ac9039699d0ef37ec56(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f39644a9952c2382e1309ec734595a13d617254ae6479b55e3651350c63b12b4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d25bc9604b01cec589bede06984727cc5231edeb73426fc14b2cd869e87bb6e1(
    value: typing.List[jsii.Number],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd6ebac064c2968a4e67f4e981ce3a58de87b1ed2bab2fa40b01b733f734f722(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2dcbd77b3158786a81a8a81811e5141e03499417576894b9b8e404294f070d81(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d5164fccd944ce644bfbea1213b193319899c77eb443e9bcc9a14fa93fa004f(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__69d66885017ced0e17e136cb77a99fc3db61feb42ebb0093da9fc58bf6c15e99(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e524f8b6d9ea2077beaefe4714eb4662bc7e8e3339aea7290e4d4bf71b226e2(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b2ea4fbcbad6822de0bfb57744c9ac2a496e31fec358d653bd5b558c1e28ab9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eadde8c8030d9968433e4a1b8e77229148d5084fa1570f6dbeb91b844dd39eb4(
    value: typing.Optional[AutoscalingGroupInstanceRefreshPreferences],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4cf41fe700f92091200b6330fc0db254fa1fd577d85fe68eda226b45a2d8ff40(
    *,
    id: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    version: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb41e1a94a0a06f70bf10455e98e8fb35fc3bffc1aeb9009bb65ff4f2b0d6f24(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1886296f1689d1d7a54b0a2ecfc9c8c459ba9c87a9abb01cd57129fe9d269d88(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff5c9fc61198b5e2870b0710be0ac47ebdf2a422e0e5aad087f6a917474eb748(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6e2e0a274f8d9282e44c4673f164cc4e6b2bafb2811315b7517291cb3809090(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9378d9956bf19fadb0df457e1061d6ed5620e5252b9526eac48e02af53660c2a(
    value: typing.Optional[AutoscalingGroupLaunchTemplate],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7273b54d405cca1a68a8772f66e7fc881428ee0f2a76520da101dd1637481bc4(
    *,
    launch_template: typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplate, typing.Dict[builtins.str, typing.Any]],
    instances_distribution: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyInstancesDistribution, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2016e30cf0c2102450c3e6300dfb54910b59ef88623b1412ea7051a977cc1e9d(
    *,
    on_demand_allocation_strategy: typing.Optional[builtins.str] = None,
    on_demand_base_capacity: typing.Optional[jsii.Number] = None,
    on_demand_percentage_above_base_capacity: typing.Optional[jsii.Number] = None,
    spot_allocation_strategy: typing.Optional[builtins.str] = None,
    spot_instance_pools: typing.Optional[jsii.Number] = None,
    spot_max_price: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2279e84db944608af8afe8627770481d10ad724a6f55c77de8765bfb6ca9c32(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d9c8e8d0701d37e74c51456edf8ffb73b6020328641f3fbb7abea3ed5af950a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4fd80508f37aaa5187ce8e8016309cd4a02daec6cd0320bb9dd1c596d4d1f2c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1575c5bde2a91a2fce87bb06ae0ea5c5172ca56d4e255dc3ebee02889e3814d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efa17993945c972e4f817971a1f394d6a775cc1d4717600da113e2401eac7eaf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ae404662e6ab11e0a0bd2f0e367c750240eb500549de9751e4027ef7ae57dd0(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5093c8ba1217949b13fd8409c4b328e8a279c6db37394f4e7ae51be6efcd449(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6882a7545de143ce10d47d1e51acbf273dcfd78b1fd8129f734267c98485b0d0(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyInstancesDistribution],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__70c3e4bb505dfa3fb95c9da9c2ef6e7475593c5748506ff81604878010940bb5(
    *,
    launch_template_specification: typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification, typing.Dict[builtins.str, typing.Any]],
    override: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__962bc5614727dbff70eb2b75f5b04b58d038d0805c452e38dbf5e1e38ec497ee(
    *,
    launch_template_id: typing.Optional[builtins.str] = None,
    launch_template_name: typing.Optional[builtins.str] = None,
    version: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c984764ccf970926c6c93485d6cf03de7558912ab2ac0950562c2b8f6563e420(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1f8118bfefab87b06324ab480db4f0e63769ccc9189ede681519a6a406b1d68(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__809506efc3cea5878d74e7996e37470fcc5a0fab4448192e840a5a8ca091cd9b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d3e93fecc1989d85327e86d19641d57ceae26800d7a5c976b41d53265d88195(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d40e6605655fd2e5d1631ba89ef2a2298be4957e0db232be6498664bc5b5596(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49f0a91db6edcb85a399f9971d9bc646b43a88a74885de51cb4e0949ed5e75c5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b71153c24f0e87380e482d9c6a29ba91bcb17f03c3a22dacc3a9ff275bfb7d0b(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c5bc9b6e61db0bc0a53d4a0b6667c25b92a21c45834c8efb12878f16d036cc8(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplate],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fde63c0c36fa1e41713ae98ed12d60c23369f0a2e7c081309ae68a2d1e219ada(
    *,
    instance_requirements: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements, typing.Dict[builtins.str, typing.Any]]] = None,
    instance_type: typing.Optional[builtins.str] = None,
    launch_template_specification: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification, typing.Dict[builtins.str, typing.Any]]] = None,
    weighted_capacity: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2dcf954255b80d4c69f4c7acb1d0adb1c65c109178855efa4ceb4a238093d147(
    *,
    accelerator_count: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount, typing.Dict[builtins.str, typing.Any]]] = None,
    accelerator_manufacturers: typing.Optional[typing.Sequence[builtins.str]] = None,
    accelerator_names: typing.Optional[typing.Sequence[builtins.str]] = None,
    accelerator_total_memory_mib: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib, typing.Dict[builtins.str, typing.Any]]] = None,
    accelerator_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    allowed_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    bare_metal: typing.Optional[builtins.str] = None,
    baseline_ebs_bandwidth_mbps: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps, typing.Dict[builtins.str, typing.Any]]] = None,
    burstable_performance: typing.Optional[builtins.str] = None,
    cpu_manufacturers: typing.Optional[typing.Sequence[builtins.str]] = None,
    excluded_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    instance_generations: typing.Optional[typing.Sequence[builtins.str]] = None,
    local_storage: typing.Optional[builtins.str] = None,
    local_storage_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    max_spot_price_as_percentage_of_optimal_on_demand_price: typing.Optional[jsii.Number] = None,
    memory_gib_per_vcpu: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu, typing.Dict[builtins.str, typing.Any]]] = None,
    memory_mib: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib, typing.Dict[builtins.str, typing.Any]]] = None,
    network_bandwidth_gbps: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps, typing.Dict[builtins.str, typing.Any]]] = None,
    network_interface_count: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount, typing.Dict[builtins.str, typing.Any]]] = None,
    on_demand_max_price_percentage_over_lowest_price: typing.Optional[jsii.Number] = None,
    require_hibernate_support: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    spot_max_price_percentage_over_lowest_price: typing.Optional[jsii.Number] = None,
    total_local_storage_gb: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb, typing.Dict[builtins.str, typing.Any]]] = None,
    vcpu_count: typing.Optional[typing.Union[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__724554780831f289972ecf058d147cbbddccd431f360deb61eda731a7aa50cce(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df24fddf2c8ec377a1a5216f15fdcfe599192c7380a644a7e58133d4fdb2b2eb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0739abff710a5e4df06746b1f0113c664574b0743ed292bce33a9a4ec165e17b(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d8fc22e44ffcb9503b4983474baf761081517b350e8d574c97198f81381917c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5473026304dc9b505b86d86cf315e3cf55f801a6c2a69c1ad1b31bfa5e3483d1(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__520d62c65836e03937be5d3f2143cc5be0460483941e347c049fb684236e6e01(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40fb4217cb3abaf598798a1b72b93158e8761c21fbdf084dae537687f74d2ec6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__826f93c0d9a75c7854304dc6bb941536b2fa3b684d76769631be4f22ea046bcb(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d8676ec0fa12b41bbf0d6f9787965b4480f9d873deba9c94fd25896c87acb3d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cdd94b45c13467b788bb0b1f43acbe85158f2e58f43b6ac7e8403a0e95730a21(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__354c5ecdf38b32157179a9611db103b982784e29ad3cd5735a29e062b87af44f(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4aa2de94a2cd2edb10877263d77e0f51f2eb73c490be220fc7b7cdd7044c02c4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__702e03c1791400ba0f3c2101dc1766b1682e0b93a08eebeae6fa2642da0cc635(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__47507b7a727cc75d4cd857fd1b7736589debec9343252be6f56c7ed49e1bacd0(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__292b9963adaba04a2ed5c80b708122c9efdb828a5086c30e0d1c72aa35d7a78e(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b665840da3f9ded676cfd86241d9b985bf58b31a2c5c236bf8f5c4cf562fa42(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__067c6295b3bf51fc82a835dbd3e0bf642ac9a156e182110329ce861c34d942e3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22966c82a35be80e7b9ad7f9f7a052c9e207696da9d3ff4f643e60d84e4aff22(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__077995ae804b0c8ef9b6d1cb5992fd000743ef2436b0165037bedaa30cf6a34a(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b73bc250cc38a2525e9a03ac0b0a5a9e53b5310bb97c9a4b1f16f1b3ef0fae73(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__58d54095b0bbc8f32cf040e812c49c750975580edad52be6dfc35a21a7b9cad1(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef1ec37f03cb7e326024662bca7e00c27a41f3468a724886b6274341c96a86a4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdca0c5cb659c6bbc9383e679d2eb68be9451f6871e18cda4fde9788857735b5(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c3f7778e3af850077005672be5004f0b43cd22dc138a4155fea01ca663492e6(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__562ba05a115f83b9242594914f32ea5e44869333937eea39da0f0d0ac9cb01f1(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0bc7740a31e3f3133fd24e891d24d3f317d42af7d3b9e28150366a3376f9cb6d(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__732662bd35318e0aaf0b9c5e062117260c3f82d8d95fd7ced9d77a35d72c6266(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8709dabc1bede9729ed176a231991df26ca2dd2d6b82c291f0c9c113f8013047(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__703a1d821b73d47419a5f96ea6c291945624ea8fa326bba36e65073e92b77c65(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9d48bf2022f63997933cb7676de4eb97c36443521e0fedddf19a7c02189553a(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a2e56b2ce7299003d9acd4a869058b88910f439901b2c3c3512dd5bfff01b3d(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__36465b0ff1b2eb5f685bff9a62f0e9cb2116dfd04971cb3ffb135ccf989bb2be(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c253a78967ecd06058373f173e09200c114f6427c5f89d6988846aa4c58cf31(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7473523f4b4a1e1559c866592ee327a39b177411cc947a30a4673f9960211c2(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__551311a9e30a06cfe8911c446fe5989c24d3329815b9664a425325064fc7e7f1(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e766a1ae823da189a00099a7599f434916ef01af5cd22305285ff07e0eed4bb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3733f2da5fe4c032830a2fd323ac8d9e0b7d576b965b33597bd056c16478130a(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__064704dc371d24b6914d8b39fc185b5e7029cabb6b349491e57748ba9bd69a1f(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a3db537327e2064bf0fc7f0455e32a37ba5e0c7d53e42a32f33fd3138a3c5b5e(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a24fec702068a1f570236a48788a448dd624c290814a8594b90a1831c8180668(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e8e4941582cef491484cef9748f25cf5518bd4e5e550a361d11b285549913ae(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e16e6b95823a0254b314c29b31dbc66854f92b9d0ab6f7c034c6495fbdc1cfbd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1379dedda613b2ac28cb4a23c88b35c85deb060dd97b591b81294e15d8133857(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32bf4bb636a9b8ecdad3f2ed1ee7467d0b4e3f69093bcbdd68c48d381d08840b(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75c0a1e0a68ad3778d0952373e2e7e22e5454261a62838b299cf832946cab695(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d1871afa8b5238fe334c92bedabb0af8fcd6d62a07ece1a2bd7af3a78f79558(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40a26a51beb90a8757986a7e5c6d07d3c57f13a659fe03a68cae3c212ae51941(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8df2fed054589d66e6f0f757f312bd1bbcdd5788db7ffa7cf521d2bddd1246d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f952d28d07ad9ad510b90d1c4a59111c847cdcd5c129e2859d67e48e81356af(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__590ef2f35265a1e50f19dc28074a985991c7c812c6b594f69f9263935f1e4cf7(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e62bc9167569e7a882ac20dff79243ef0c75a0d098ec495f486092318a87c77(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b0e44e93bd990ccaf0ae30a55f7468322843550651779d7ffe931fcc0110c4b(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06aab2f5ff1f1b5ee99d0ef262e2896e9d8d586273985384be317813140eb82a(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f1a55d10e23a4948152e23e8594d745e8c97582041795db53c71086c661980a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__204004559430a67eb10367457de8f19130eaa3cab1a4f2529a36b18f653ec16e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10265242bbf92a4d79c4ee0c73e219f0f3ffae3f53812cfc245005adf17a8d4f(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c591d9fcf51995adf642ffc4912e95b96736aa8face56d99112f50f41cb265b(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f06feff8f93a3663bd42c2e79686b86fd28c456b460498d2186714b9a904c70(
    *,
    max: typing.Optional[jsii.Number] = None,
    min: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d668b55e91a3fc96de44abcab8ec5c1b85a47ce48201c1fcf4f257b295baf96b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a2c965965f8ff557aa9812c708f4d939be59d0bfa32b92199f494f56b0e217c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__17d528ca1ca3c6a2cd6bcf179152dbd3cd029b5ed2aa4242f2831746f9147872(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__235148d601a7d949f9d877b6bf683792c6ea76267096e4621656bce9774584dd(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9bb8abff4ac95e737fab1861ef5ee94b88bc948d9f2399fefac8d475ea974398(
    *,
    launch_template_id: typing.Optional[builtins.str] = None,
    launch_template_name: typing.Optional[builtins.str] = None,
    version: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a77e2bc026321f20e8e08a960a9e209f6e1370f0ad0079baa482ae68e49cb52(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da9f67690e0e3d716f383bc8a91754c6219cf37bb1fe029bc4b37451a6311365(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__976c6202bc15a35998a43b318e0aafc77628f6c515123ac8b00419265258877f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5e300ad5dad47553104b855071a42c50c4cb7c0a3b0e8790d497e62595cc409(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3559922adf027a93550966365c9fe07965377fb02954941691abd53668f3a828(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6807a8df902439c7d2ef2f74ce8c4594cdb18a1994675bfab9ea07547b0029df(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__131dd48d76050a1b8e05547d4a9f1e5b1fa2b63f8e80690fb8d1f2a8832ff1e9(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__57c9368bacac6cbe2da05255e512d9df4668b03e3ab29f7283c626f4b021b6f9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8b29f2359df27b6658e6fd2f8659e66cbd300ca5d4e5434c574e44a2b3bb87e(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2cb8033bcf3afad2040493175daff8c7d65b2e6c8993815eb13d6a4b604cf017(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73d0bcaeadf04cedce6bff970467785e770eecfac4ecf04ec6e208fa765ec6de(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84524084c2915b7bb43e43c08550ff88173973349d722fdb1cae7abc32b792e1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdea1c87cd7f9427b73084b6df5859e3ea5c7297d32460d902178aaaac46675a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4695233ca4338ef81634067448a277ba916d6e56fb499878ea711457b033b504(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__95ad448b85ab379a4751b69c053c944596e5bd6d09842d5280ddd81a9f60c475(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d9eb6225fea75912e6401c7e1a06159c1764ea3aeeefe2d93e4c1425f3e9f44(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b733a1656067e1fa29828f802701eea847ccdac6cfd883bbc3e5af9ae85f146(
    value: typing.Optional[AutoscalingGroupMixedInstancesPolicy],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33921d9f387697d55af83cd6d5efb1f28ec83c94b4ca4943a06bef8ac3a8db8a(
    *,
    key: builtins.str,
    propagate_at_launch: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c55ebbb6531e3ef322c2715b56770f399f012902007f1105c495b434bc4364a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b89847ca35fdeb9d415a93ff9e7dead139ffbe038cefa5abf35d52c374f64a3b(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0221236d92a35a0441b05ec45816f2da988a25efac41856fa9974defd8fcff20(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aebe75458c0e56ec395bd51d7d96515d61eb05d67ad4db39773f4fad0872728d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1bdc243a279014c9b2d18d15376d85ac8b63c4630d2713b46c5588e083a887a9(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d2245a6aad693374563eb5370c55a01f815541687748a278a4c1ef5c1f0d0d2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupTag]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6517c218bfbdbcdd866580e5be6c58ba6d46bb6e538890cb6eacd4e06e7e2c9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c0d17c6fb836f8a6684aad3935ed985e79227e9280f2c6401e63037f6f1ec71(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3674b0c69b8dd7c4a8ed9eb1d7c29aa59668a2ef36d1a3d49ac5b9ea7968ce4e(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__71d9a6fe2befcd72123a9068daa82862a63bd87d61013a4cdebacef790b5cd8e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2bf8de8c6bf21aadf746f482eda0cb2a5445b9c9e9c65e30bc9e420f92469538(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupTag]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5bc24fc6384be4b6857f593617a518e5e9626fb5ca7ffb7a87e835922fe30220(
    *,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e98a4b624ae643ecf2ad7b32a7ee2457b5a3ce4cfdff5b0e4c535704f0612ff(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86d5b06ee7e7bfbf3ba78d31274b8dc0a25e661ca600f4842f602d026332d46d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e18b42dcd21b59f0ee7c07779cef2ffc2a41acf8f2b2beae7de39a5e8847c873(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1fdbfe0791dc1a6a18625a73619f916c4e48f305e968478c941e81f6f2cce63a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupTimeouts]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a264468a9252133cb8c69bef2d968754666ed2d2802724b0f5ba984c64cd2fd(
    *,
    identifier: builtins.str,
    type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__74abb32218dacdf05d4613c2c9c1ddf1f4f4a5dcaece17959d72483f27ef71ab(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a05fd13eeca5e22b95a394044b8267f7eb77902c612178b1b66c33637f43e5ab(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1e73179daf2737c3201e5edb2692889d79edafcd8514d4f0f72955b99ac4383(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5fc9a5e1269d3a7ca666b63ad09219bc4b977555fef7917061c7b2489d1f17b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b81cb4923ec5de8129bd42e1f33939145835bd12fad036c61b2c471dbfe28b4(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7697ca5c661ed01ae30ccab579ee2b0423ce65da73fc6cb5aec69d0d171a3ae4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AutoscalingGroupTrafficSource]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88567404dcc4f0b9507a85fefc0e84361f9fd50584862803b9122cb869b559e3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be10d941b5a12047fa27f8230dd1576b865f969567c1aed9cbcf0909038b3640(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdfec1750473aae4101dd9b5e1529f85fd4a7b296e23bcc8c4cc9cb80c616573(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53ecce1ef80edaee3c3f3b41dbd22accc326e0328dc9256a068e03be2fdfa28b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AutoscalingGroupTrafficSource]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efc261a784f287ad43e3b5aa91a57c486357bdf599dec56ad679129a173bfb3b(
    *,
    instance_reuse_policy: typing.Optional[typing.Union[AutoscalingGroupWarmPoolInstanceReusePolicy, typing.Dict[builtins.str, typing.Any]]] = None,
    max_group_prepared_capacity: typing.Optional[jsii.Number] = None,
    min_size: typing.Optional[jsii.Number] = None,
    pool_state: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5cb7b70b7ba5768fa0e30df2f694ddaaa331fd23ed7a90070c83126ad6f57a4(
    *,
    reuse_on_scale_in: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4acb7ae3be94f490a7d8c455ad6609fe7068014fa0186a306544540704b48d1e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23d12e350603daa576fbb2458c76000af2346372fcfc2c3c81b3732d07356b83(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87aca93a69aca11d621454ba7191773a78bbb1bd186fdd7592980c00590fffa8(
    value: typing.Optional[AutoscalingGroupWarmPoolInstanceReusePolicy],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68eef489342008415937883ce99d678d4cb20c27fb0b5add9d2fc07ebaccd3c0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e9957277228ea7b8509dc3cdf8106e64fc42f4b895143f7191d5c75fe0f78e3(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__796cb9a797892cfe447a833687134a818386132893b2b5ea101f1f4b1624488b(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__538c1beb70a59eb45d29b015612fed7bc38a46bf0bf65ae7c846442e5122488a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d28099c87c35857f49b2b9816116e726f34de4a4161cac1962b395a335dc2b0(
    value: typing.Optional[AutoscalingGroupWarmPool],
) -> None:
    """Type checking stubs"""
    pass
