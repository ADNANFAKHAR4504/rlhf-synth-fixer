r'''
# `aws_alb_target_group`

Refer to the Terraform Registry for docs: [`aws_alb_target_group`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group).
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


class AlbTargetGroup(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.albTargetGroup.AlbTargetGroup",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group aws_alb_target_group}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        connection_termination: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        deregistration_delay: typing.Optional[builtins.str] = None,
        health_check: typing.Optional[typing.Union["AlbTargetGroupHealthCheck", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        ip_address_type: typing.Optional[builtins.str] = None,
        lambda_multi_value_headers_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        load_balancing_algorithm_type: typing.Optional[builtins.str] = None,
        load_balancing_anomaly_mitigation: typing.Optional[builtins.str] = None,
        load_balancing_cross_zone_enabled: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        port: typing.Optional[jsii.Number] = None,
        preserve_client_ip: typing.Optional[builtins.str] = None,
        protocol: typing.Optional[builtins.str] = None,
        protocol_version: typing.Optional[builtins.str] = None,
        proxy_protocol_v2: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        slow_start: typing.Optional[jsii.Number] = None,
        stickiness: typing.Optional[typing.Union["AlbTargetGroupStickiness", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        target_failover: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AlbTargetGroupTargetFailover", typing.Dict[builtins.str, typing.Any]]]]] = None,
        target_group_health: typing.Optional[typing.Union["AlbTargetGroupTargetGroupHealth", typing.Dict[builtins.str, typing.Any]]] = None,
        target_health_state: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AlbTargetGroupTargetHealthState", typing.Dict[builtins.str, typing.Any]]]]] = None,
        target_type: typing.Optional[builtins.str] = None,
        vpc_id: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group aws_alb_target_group} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param connection_termination: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#connection_termination AlbTargetGroup#connection_termination}.
        :param deregistration_delay: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#deregistration_delay AlbTargetGroup#deregistration_delay}.
        :param health_check: health_check block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#health_check AlbTargetGroup#health_check}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#id AlbTargetGroup#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param ip_address_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#ip_address_type AlbTargetGroup#ip_address_type}.
        :param lambda_multi_value_headers_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#lambda_multi_value_headers_enabled AlbTargetGroup#lambda_multi_value_headers_enabled}.
        :param load_balancing_algorithm_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#load_balancing_algorithm_type AlbTargetGroup#load_balancing_algorithm_type}.
        :param load_balancing_anomaly_mitigation: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#load_balancing_anomaly_mitigation AlbTargetGroup#load_balancing_anomaly_mitigation}.
        :param load_balancing_cross_zone_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#load_balancing_cross_zone_enabled AlbTargetGroup#load_balancing_cross_zone_enabled}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#name AlbTargetGroup#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#name_prefix AlbTargetGroup#name_prefix}.
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#port AlbTargetGroup#port}.
        :param preserve_client_ip: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#preserve_client_ip AlbTargetGroup#preserve_client_ip}.
        :param protocol: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#protocol AlbTargetGroup#protocol}.
        :param protocol_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#protocol_version AlbTargetGroup#protocol_version}.
        :param proxy_protocol_v2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#proxy_protocol_v2 AlbTargetGroup#proxy_protocol_v2}.
        :param slow_start: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#slow_start AlbTargetGroup#slow_start}.
        :param stickiness: stickiness block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#stickiness AlbTargetGroup#stickiness}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#tags AlbTargetGroup#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#tags_all AlbTargetGroup#tags_all}.
        :param target_failover: target_failover block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#target_failover AlbTargetGroup#target_failover}
        :param target_group_health: target_group_health block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#target_group_health AlbTargetGroup#target_group_health}
        :param target_health_state: target_health_state block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#target_health_state AlbTargetGroup#target_health_state}
        :param target_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#target_type AlbTargetGroup#target_type}.
        :param vpc_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#vpc_id AlbTargetGroup#vpc_id}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__560d03d7e69d811f9971fe3108b75c76a29015203041b794499d7ea34bfb6014)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = AlbTargetGroupConfig(
            connection_termination=connection_termination,
            deregistration_delay=deregistration_delay,
            health_check=health_check,
            id=id,
            ip_address_type=ip_address_type,
            lambda_multi_value_headers_enabled=lambda_multi_value_headers_enabled,
            load_balancing_algorithm_type=load_balancing_algorithm_type,
            load_balancing_anomaly_mitigation=load_balancing_anomaly_mitigation,
            load_balancing_cross_zone_enabled=load_balancing_cross_zone_enabled,
            name=name,
            name_prefix=name_prefix,
            port=port,
            preserve_client_ip=preserve_client_ip,
            protocol=protocol,
            protocol_version=protocol_version,
            proxy_protocol_v2=proxy_protocol_v2,
            slow_start=slow_start,
            stickiness=stickiness,
            tags=tags,
            tags_all=tags_all,
            target_failover=target_failover,
            target_group_health=target_group_health,
            target_health_state=target_health_state,
            target_type=target_type,
            vpc_id=vpc_id,
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
        '''Generates CDKTF code for importing a AlbTargetGroup resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the AlbTargetGroup to import.
        :param import_from_id: The id of the existing AlbTargetGroup that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the AlbTargetGroup to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e9d933ac129b18af99ac89c683c5a361c0d2b499a0e75d902e51e21ad0c8c99)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putHealthCheck")
    def put_health_check(
        self,
        *,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        healthy_threshold: typing.Optional[jsii.Number] = None,
        interval: typing.Optional[jsii.Number] = None,
        matcher: typing.Optional[builtins.str] = None,
        path: typing.Optional[builtins.str] = None,
        port: typing.Optional[builtins.str] = None,
        protocol: typing.Optional[builtins.str] = None,
        timeout: typing.Optional[jsii.Number] = None,
        unhealthy_threshold: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#enabled AlbTargetGroup#enabled}.
        :param healthy_threshold: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#healthy_threshold AlbTargetGroup#healthy_threshold}.
        :param interval: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#interval AlbTargetGroup#interval}.
        :param matcher: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#matcher AlbTargetGroup#matcher}.
        :param path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#path AlbTargetGroup#path}.
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#port AlbTargetGroup#port}.
        :param protocol: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#protocol AlbTargetGroup#protocol}.
        :param timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#timeout AlbTargetGroup#timeout}.
        :param unhealthy_threshold: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#unhealthy_threshold AlbTargetGroup#unhealthy_threshold}.
        '''
        value = AlbTargetGroupHealthCheck(
            enabled=enabled,
            healthy_threshold=healthy_threshold,
            interval=interval,
            matcher=matcher,
            path=path,
            port=port,
            protocol=protocol,
            timeout=timeout,
            unhealthy_threshold=unhealthy_threshold,
        )

        return typing.cast(None, jsii.invoke(self, "putHealthCheck", [value]))

    @jsii.member(jsii_name="putStickiness")
    def put_stickiness(
        self,
        *,
        type: builtins.str,
        cookie_duration: typing.Optional[jsii.Number] = None,
        cookie_name: typing.Optional[builtins.str] = None,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#type AlbTargetGroup#type}.
        :param cookie_duration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#cookie_duration AlbTargetGroup#cookie_duration}.
        :param cookie_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#cookie_name AlbTargetGroup#cookie_name}.
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#enabled AlbTargetGroup#enabled}.
        '''
        value = AlbTargetGroupStickiness(
            type=type,
            cookie_duration=cookie_duration,
            cookie_name=cookie_name,
            enabled=enabled,
        )

        return typing.cast(None, jsii.invoke(self, "putStickiness", [value]))

    @jsii.member(jsii_name="putTargetFailover")
    def put_target_failover(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AlbTargetGroupTargetFailover", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__446fe511c19bf7891bb1c7262b21098f12b24d24e85a44972c34b535c9fc1944)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTargetFailover", [value]))

    @jsii.member(jsii_name="putTargetGroupHealth")
    def put_target_group_health(
        self,
        *,
        dns_failover: typing.Optional[typing.Union["AlbTargetGroupTargetGroupHealthDnsFailover", typing.Dict[builtins.str, typing.Any]]] = None,
        unhealthy_state_routing: typing.Optional[typing.Union["AlbTargetGroupTargetGroupHealthUnhealthyStateRouting", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param dns_failover: dns_failover block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#dns_failover AlbTargetGroup#dns_failover}
        :param unhealthy_state_routing: unhealthy_state_routing block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#unhealthy_state_routing AlbTargetGroup#unhealthy_state_routing}
        '''
        value = AlbTargetGroupTargetGroupHealth(
            dns_failover=dns_failover, unhealthy_state_routing=unhealthy_state_routing
        )

        return typing.cast(None, jsii.invoke(self, "putTargetGroupHealth", [value]))

    @jsii.member(jsii_name="putTargetHealthState")
    def put_target_health_state(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AlbTargetGroupTargetHealthState", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d42fe12e4f9ff8f9a08a1aa7fef884d0efebee29c9974d9bf24daea7f517d8f2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTargetHealthState", [value]))

    @jsii.member(jsii_name="resetConnectionTermination")
    def reset_connection_termination(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConnectionTermination", []))

    @jsii.member(jsii_name="resetDeregistrationDelay")
    def reset_deregistration_delay(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeregistrationDelay", []))

    @jsii.member(jsii_name="resetHealthCheck")
    def reset_health_check(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHealthCheck", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetIpAddressType")
    def reset_ip_address_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIpAddressType", []))

    @jsii.member(jsii_name="resetLambdaMultiValueHeadersEnabled")
    def reset_lambda_multi_value_headers_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLambdaMultiValueHeadersEnabled", []))

    @jsii.member(jsii_name="resetLoadBalancingAlgorithmType")
    def reset_load_balancing_algorithm_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLoadBalancingAlgorithmType", []))

    @jsii.member(jsii_name="resetLoadBalancingAnomalyMitigation")
    def reset_load_balancing_anomaly_mitigation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLoadBalancingAnomalyMitigation", []))

    @jsii.member(jsii_name="resetLoadBalancingCrossZoneEnabled")
    def reset_load_balancing_cross_zone_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLoadBalancingCrossZoneEnabled", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetNamePrefix")
    def reset_name_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNamePrefix", []))

    @jsii.member(jsii_name="resetPort")
    def reset_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPort", []))

    @jsii.member(jsii_name="resetPreserveClientIp")
    def reset_preserve_client_ip(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPreserveClientIp", []))

    @jsii.member(jsii_name="resetProtocol")
    def reset_protocol(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProtocol", []))

    @jsii.member(jsii_name="resetProtocolVersion")
    def reset_protocol_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProtocolVersion", []))

    @jsii.member(jsii_name="resetProxyProtocolV2")
    def reset_proxy_protocol_v2(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProxyProtocolV2", []))

    @jsii.member(jsii_name="resetSlowStart")
    def reset_slow_start(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSlowStart", []))

    @jsii.member(jsii_name="resetStickiness")
    def reset_stickiness(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStickiness", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTargetFailover")
    def reset_target_failover(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetFailover", []))

    @jsii.member(jsii_name="resetTargetGroupHealth")
    def reset_target_group_health(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetGroupHealth", []))

    @jsii.member(jsii_name="resetTargetHealthState")
    def reset_target_health_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetHealthState", []))

    @jsii.member(jsii_name="resetTargetType")
    def reset_target_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetType", []))

    @jsii.member(jsii_name="resetVpcId")
    def reset_vpc_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVpcId", []))

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
    @jsii.member(jsii_name="arnSuffix")
    def arn_suffix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arnSuffix"))

    @builtins.property
    @jsii.member(jsii_name="healthCheck")
    def health_check(self) -> "AlbTargetGroupHealthCheckOutputReference":
        return typing.cast("AlbTargetGroupHealthCheckOutputReference", jsii.get(self, "healthCheck"))

    @builtins.property
    @jsii.member(jsii_name="loadBalancerArns")
    def load_balancer_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "loadBalancerArns"))

    @builtins.property
    @jsii.member(jsii_name="stickiness")
    def stickiness(self) -> "AlbTargetGroupStickinessOutputReference":
        return typing.cast("AlbTargetGroupStickinessOutputReference", jsii.get(self, "stickiness"))

    @builtins.property
    @jsii.member(jsii_name="targetFailover")
    def target_failover(self) -> "AlbTargetGroupTargetFailoverList":
        return typing.cast("AlbTargetGroupTargetFailoverList", jsii.get(self, "targetFailover"))

    @builtins.property
    @jsii.member(jsii_name="targetGroupHealth")
    def target_group_health(self) -> "AlbTargetGroupTargetGroupHealthOutputReference":
        return typing.cast("AlbTargetGroupTargetGroupHealthOutputReference", jsii.get(self, "targetGroupHealth"))

    @builtins.property
    @jsii.member(jsii_name="targetHealthState")
    def target_health_state(self) -> "AlbTargetGroupTargetHealthStateList":
        return typing.cast("AlbTargetGroupTargetHealthStateList", jsii.get(self, "targetHealthState"))

    @builtins.property
    @jsii.member(jsii_name="connectionTerminationInput")
    def connection_termination_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "connectionTerminationInput"))

    @builtins.property
    @jsii.member(jsii_name="deregistrationDelayInput")
    def deregistration_delay_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deregistrationDelayInput"))

    @builtins.property
    @jsii.member(jsii_name="healthCheckInput")
    def health_check_input(self) -> typing.Optional["AlbTargetGroupHealthCheck"]:
        return typing.cast(typing.Optional["AlbTargetGroupHealthCheck"], jsii.get(self, "healthCheckInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="ipAddressTypeInput")
    def ip_address_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ipAddressTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="lambdaMultiValueHeadersEnabledInput")
    def lambda_multi_value_headers_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "lambdaMultiValueHeadersEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="loadBalancingAlgorithmTypeInput")
    def load_balancing_algorithm_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "loadBalancingAlgorithmTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="loadBalancingAnomalyMitigationInput")
    def load_balancing_anomaly_mitigation_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "loadBalancingAnomalyMitigationInput"))

    @builtins.property
    @jsii.member(jsii_name="loadBalancingCrossZoneEnabledInput")
    def load_balancing_cross_zone_enabled_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "loadBalancingCrossZoneEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="namePrefixInput")
    def name_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "namePrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="portInput")
    def port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "portInput"))

    @builtins.property
    @jsii.member(jsii_name="preserveClientIpInput")
    def preserve_client_ip_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "preserveClientIpInput"))

    @builtins.property
    @jsii.member(jsii_name="protocolInput")
    def protocol_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "protocolInput"))

    @builtins.property
    @jsii.member(jsii_name="protocolVersionInput")
    def protocol_version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "protocolVersionInput"))

    @builtins.property
    @jsii.member(jsii_name="proxyProtocolV2Input")
    def proxy_protocol_v2_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "proxyProtocolV2Input"))

    @builtins.property
    @jsii.member(jsii_name="slowStartInput")
    def slow_start_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "slowStartInput"))

    @builtins.property
    @jsii.member(jsii_name="stickinessInput")
    def stickiness_input(self) -> typing.Optional["AlbTargetGroupStickiness"]:
        return typing.cast(typing.Optional["AlbTargetGroupStickiness"], jsii.get(self, "stickinessInput"))

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
    @jsii.member(jsii_name="targetFailoverInput")
    def target_failover_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AlbTargetGroupTargetFailover"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AlbTargetGroupTargetFailover"]]], jsii.get(self, "targetFailoverInput"))

    @builtins.property
    @jsii.member(jsii_name="targetGroupHealthInput")
    def target_group_health_input(
        self,
    ) -> typing.Optional["AlbTargetGroupTargetGroupHealth"]:
        return typing.cast(typing.Optional["AlbTargetGroupTargetGroupHealth"], jsii.get(self, "targetGroupHealthInput"))

    @builtins.property
    @jsii.member(jsii_name="targetHealthStateInput")
    def target_health_state_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AlbTargetGroupTargetHealthState"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AlbTargetGroupTargetHealthState"]]], jsii.get(self, "targetHealthStateInput"))

    @builtins.property
    @jsii.member(jsii_name="targetTypeInput")
    def target_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "targetTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="vpcIdInput")
    def vpc_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "vpcIdInput"))

    @builtins.property
    @jsii.member(jsii_name="connectionTermination")
    def connection_termination(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "connectionTermination"))

    @connection_termination.setter
    def connection_termination(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41e2de4718507db1f6b7a504fb77305c358abb75f1a5b4818c4ebbe90be08b6c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "connectionTermination", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deregistrationDelay")
    def deregistration_delay(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deregistrationDelay"))

    @deregistration_delay.setter
    def deregistration_delay(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2e843e73e477662c8d70a0fd89d347cec1d3d8418ea6aa4b14256b3712100535)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deregistrationDelay", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f18eebbf6916bed8fe4e7b50451dfe724bc043381d1c38b298f9e4e63bcb43e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ipAddressType")
    def ip_address_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ipAddressType"))

    @ip_address_type.setter
    def ip_address_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12560f58f0aa43c956bf43b37d382f9c2c54d0f835a3ac969a859ef49d3b6ac9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ipAddressType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lambdaMultiValueHeadersEnabled")
    def lambda_multi_value_headers_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "lambdaMultiValueHeadersEnabled"))

    @lambda_multi_value_headers_enabled.setter
    def lambda_multi_value_headers_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e0e6d23e2f7ab2033bc093fd23f7a0284d006eb669dc1b266643a125726620ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lambdaMultiValueHeadersEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="loadBalancingAlgorithmType")
    def load_balancing_algorithm_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "loadBalancingAlgorithmType"))

    @load_balancing_algorithm_type.setter
    def load_balancing_algorithm_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a5d0d9d9ce374fde6c52d8c635855008deaee8d1520876a2f593962b77c34cc2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "loadBalancingAlgorithmType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="loadBalancingAnomalyMitigation")
    def load_balancing_anomaly_mitigation(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "loadBalancingAnomalyMitigation"))

    @load_balancing_anomaly_mitigation.setter
    def load_balancing_anomaly_mitigation(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d529c51c0765743648aa21e8c8f52543ffcffda0df2889609eecddebb60252b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "loadBalancingAnomalyMitigation", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="loadBalancingCrossZoneEnabled")
    def load_balancing_cross_zone_enabled(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "loadBalancingCrossZoneEnabled"))

    @load_balancing_cross_zone_enabled.setter
    def load_balancing_cross_zone_enabled(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__762c3d1670750c0030b872ce6cd52635bb88d5a4ad78d07327d80e2e0879d21e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "loadBalancingCrossZoneEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b2c637301473d405ee390de3aca32444c98b517b0425926e78bff33913be33b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="namePrefix")
    def name_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "namePrefix"))

    @name_prefix.setter
    def name_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ed639ed3371c21fd1bb7ff22b089ec18bcc80d15f80181c6e8981bb65ef9f44)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "namePrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="port")
    def port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "port"))

    @port.setter
    def port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e06b0ca3041312918f9428b8b697d6358fee44601add7515508ce498ae49d172)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "port", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="preserveClientIp")
    def preserve_client_ip(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "preserveClientIp"))

    @preserve_client_ip.setter
    def preserve_client_ip(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0570eb89f0924a9196e74b7afc23c5dcb5c55572a0c679b375e19a28267e13a7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "preserveClientIp", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="protocol")
    def protocol(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "protocol"))

    @protocol.setter
    def protocol(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__faff35c2df4e2cb531cade94ed390c76c098872b3a496ef10dfe3f3d4f121c25)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "protocol", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="protocolVersion")
    def protocol_version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "protocolVersion"))

    @protocol_version.setter
    def protocol_version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a8bc272151d5a52ed3313cd0117de2246e2128ece3640289012107dc6f142ba6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "protocolVersion", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="proxyProtocolV2")
    def proxy_protocol_v2(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "proxyProtocolV2"))

    @proxy_protocol_v2.setter
    def proxy_protocol_v2(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56c3ff084c837e142d62b04254eae2e0e0f53a29caa51f79bae08f28dfae1583)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "proxyProtocolV2", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="slowStart")
    def slow_start(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "slowStart"))

    @slow_start.setter
    def slow_start(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83803fce3701bda3107f914afbe684c61a8a2a5154affc18553544451e47a3cb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "slowStart", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__58e9c0accca4f348163ac7591449d5653d09e8d4ddae860e6813cfe389dd4d54)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__72807f3d0a4c89cc0564237bc3ae0f479e1c5115b62bf259b196f30e7c60a5eb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="targetType")
    def target_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "targetType"))

    @target_type.setter
    def target_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__494b1cd819b06464b3c4b0f2334cf4d06984ea0528fb8a12b337045b590ba37a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="vpcId")
    def vpc_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vpcId"))

    @vpc_id.setter
    def vpc_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f191ad1cbe006fdfa9d48773ad7ab31de49c6605af52c591e563268a6d9bb6a3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "vpcId", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.albTargetGroup.AlbTargetGroupConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "connection_termination": "connectionTermination",
        "deregistration_delay": "deregistrationDelay",
        "health_check": "healthCheck",
        "id": "id",
        "ip_address_type": "ipAddressType",
        "lambda_multi_value_headers_enabled": "lambdaMultiValueHeadersEnabled",
        "load_balancing_algorithm_type": "loadBalancingAlgorithmType",
        "load_balancing_anomaly_mitigation": "loadBalancingAnomalyMitigation",
        "load_balancing_cross_zone_enabled": "loadBalancingCrossZoneEnabled",
        "name": "name",
        "name_prefix": "namePrefix",
        "port": "port",
        "preserve_client_ip": "preserveClientIp",
        "protocol": "protocol",
        "protocol_version": "protocolVersion",
        "proxy_protocol_v2": "proxyProtocolV2",
        "slow_start": "slowStart",
        "stickiness": "stickiness",
        "tags": "tags",
        "tags_all": "tagsAll",
        "target_failover": "targetFailover",
        "target_group_health": "targetGroupHealth",
        "target_health_state": "targetHealthState",
        "target_type": "targetType",
        "vpc_id": "vpcId",
    },
)
class AlbTargetGroupConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        connection_termination: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        deregistration_delay: typing.Optional[builtins.str] = None,
        health_check: typing.Optional[typing.Union["AlbTargetGroupHealthCheck", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        ip_address_type: typing.Optional[builtins.str] = None,
        lambda_multi_value_headers_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        load_balancing_algorithm_type: typing.Optional[builtins.str] = None,
        load_balancing_anomaly_mitigation: typing.Optional[builtins.str] = None,
        load_balancing_cross_zone_enabled: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        port: typing.Optional[jsii.Number] = None,
        preserve_client_ip: typing.Optional[builtins.str] = None,
        protocol: typing.Optional[builtins.str] = None,
        protocol_version: typing.Optional[builtins.str] = None,
        proxy_protocol_v2: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        slow_start: typing.Optional[jsii.Number] = None,
        stickiness: typing.Optional[typing.Union["AlbTargetGroupStickiness", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        target_failover: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AlbTargetGroupTargetFailover", typing.Dict[builtins.str, typing.Any]]]]] = None,
        target_group_health: typing.Optional[typing.Union["AlbTargetGroupTargetGroupHealth", typing.Dict[builtins.str, typing.Any]]] = None,
        target_health_state: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AlbTargetGroupTargetHealthState", typing.Dict[builtins.str, typing.Any]]]]] = None,
        target_type: typing.Optional[builtins.str] = None,
        vpc_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param connection_termination: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#connection_termination AlbTargetGroup#connection_termination}.
        :param deregistration_delay: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#deregistration_delay AlbTargetGroup#deregistration_delay}.
        :param health_check: health_check block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#health_check AlbTargetGroup#health_check}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#id AlbTargetGroup#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param ip_address_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#ip_address_type AlbTargetGroup#ip_address_type}.
        :param lambda_multi_value_headers_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#lambda_multi_value_headers_enabled AlbTargetGroup#lambda_multi_value_headers_enabled}.
        :param load_balancing_algorithm_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#load_balancing_algorithm_type AlbTargetGroup#load_balancing_algorithm_type}.
        :param load_balancing_anomaly_mitigation: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#load_balancing_anomaly_mitigation AlbTargetGroup#load_balancing_anomaly_mitigation}.
        :param load_balancing_cross_zone_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#load_balancing_cross_zone_enabled AlbTargetGroup#load_balancing_cross_zone_enabled}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#name AlbTargetGroup#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#name_prefix AlbTargetGroup#name_prefix}.
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#port AlbTargetGroup#port}.
        :param preserve_client_ip: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#preserve_client_ip AlbTargetGroup#preserve_client_ip}.
        :param protocol: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#protocol AlbTargetGroup#protocol}.
        :param protocol_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#protocol_version AlbTargetGroup#protocol_version}.
        :param proxy_protocol_v2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#proxy_protocol_v2 AlbTargetGroup#proxy_protocol_v2}.
        :param slow_start: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#slow_start AlbTargetGroup#slow_start}.
        :param stickiness: stickiness block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#stickiness AlbTargetGroup#stickiness}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#tags AlbTargetGroup#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#tags_all AlbTargetGroup#tags_all}.
        :param target_failover: target_failover block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#target_failover AlbTargetGroup#target_failover}
        :param target_group_health: target_group_health block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#target_group_health AlbTargetGroup#target_group_health}
        :param target_health_state: target_health_state block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#target_health_state AlbTargetGroup#target_health_state}
        :param target_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#target_type AlbTargetGroup#target_type}.
        :param vpc_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#vpc_id AlbTargetGroup#vpc_id}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(health_check, dict):
            health_check = AlbTargetGroupHealthCheck(**health_check)
        if isinstance(stickiness, dict):
            stickiness = AlbTargetGroupStickiness(**stickiness)
        if isinstance(target_group_health, dict):
            target_group_health = AlbTargetGroupTargetGroupHealth(**target_group_health)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e810457e77275657902e52d2d77b322201c8937dcf80afb20ede1f4857b20b89)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument connection_termination", value=connection_termination, expected_type=type_hints["connection_termination"])
            check_type(argname="argument deregistration_delay", value=deregistration_delay, expected_type=type_hints["deregistration_delay"])
            check_type(argname="argument health_check", value=health_check, expected_type=type_hints["health_check"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument ip_address_type", value=ip_address_type, expected_type=type_hints["ip_address_type"])
            check_type(argname="argument lambda_multi_value_headers_enabled", value=lambda_multi_value_headers_enabled, expected_type=type_hints["lambda_multi_value_headers_enabled"])
            check_type(argname="argument load_balancing_algorithm_type", value=load_balancing_algorithm_type, expected_type=type_hints["load_balancing_algorithm_type"])
            check_type(argname="argument load_balancing_anomaly_mitigation", value=load_balancing_anomaly_mitigation, expected_type=type_hints["load_balancing_anomaly_mitigation"])
            check_type(argname="argument load_balancing_cross_zone_enabled", value=load_balancing_cross_zone_enabled, expected_type=type_hints["load_balancing_cross_zone_enabled"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument name_prefix", value=name_prefix, expected_type=type_hints["name_prefix"])
            check_type(argname="argument port", value=port, expected_type=type_hints["port"])
            check_type(argname="argument preserve_client_ip", value=preserve_client_ip, expected_type=type_hints["preserve_client_ip"])
            check_type(argname="argument protocol", value=protocol, expected_type=type_hints["protocol"])
            check_type(argname="argument protocol_version", value=protocol_version, expected_type=type_hints["protocol_version"])
            check_type(argname="argument proxy_protocol_v2", value=proxy_protocol_v2, expected_type=type_hints["proxy_protocol_v2"])
            check_type(argname="argument slow_start", value=slow_start, expected_type=type_hints["slow_start"])
            check_type(argname="argument stickiness", value=stickiness, expected_type=type_hints["stickiness"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument target_failover", value=target_failover, expected_type=type_hints["target_failover"])
            check_type(argname="argument target_group_health", value=target_group_health, expected_type=type_hints["target_group_health"])
            check_type(argname="argument target_health_state", value=target_health_state, expected_type=type_hints["target_health_state"])
            check_type(argname="argument target_type", value=target_type, expected_type=type_hints["target_type"])
            check_type(argname="argument vpc_id", value=vpc_id, expected_type=type_hints["vpc_id"])
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
        if connection_termination is not None:
            self._values["connection_termination"] = connection_termination
        if deregistration_delay is not None:
            self._values["deregistration_delay"] = deregistration_delay
        if health_check is not None:
            self._values["health_check"] = health_check
        if id is not None:
            self._values["id"] = id
        if ip_address_type is not None:
            self._values["ip_address_type"] = ip_address_type
        if lambda_multi_value_headers_enabled is not None:
            self._values["lambda_multi_value_headers_enabled"] = lambda_multi_value_headers_enabled
        if load_balancing_algorithm_type is not None:
            self._values["load_balancing_algorithm_type"] = load_balancing_algorithm_type
        if load_balancing_anomaly_mitigation is not None:
            self._values["load_balancing_anomaly_mitigation"] = load_balancing_anomaly_mitigation
        if load_balancing_cross_zone_enabled is not None:
            self._values["load_balancing_cross_zone_enabled"] = load_balancing_cross_zone_enabled
        if name is not None:
            self._values["name"] = name
        if name_prefix is not None:
            self._values["name_prefix"] = name_prefix
        if port is not None:
            self._values["port"] = port
        if preserve_client_ip is not None:
            self._values["preserve_client_ip"] = preserve_client_ip
        if protocol is not None:
            self._values["protocol"] = protocol
        if protocol_version is not None:
            self._values["protocol_version"] = protocol_version
        if proxy_protocol_v2 is not None:
            self._values["proxy_protocol_v2"] = proxy_protocol_v2
        if slow_start is not None:
            self._values["slow_start"] = slow_start
        if stickiness is not None:
            self._values["stickiness"] = stickiness
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if target_failover is not None:
            self._values["target_failover"] = target_failover
        if target_group_health is not None:
            self._values["target_group_health"] = target_group_health
        if target_health_state is not None:
            self._values["target_health_state"] = target_health_state
        if target_type is not None:
            self._values["target_type"] = target_type
        if vpc_id is not None:
            self._values["vpc_id"] = vpc_id

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
    def connection_termination(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#connection_termination AlbTargetGroup#connection_termination}.'''
        result = self._values.get("connection_termination")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def deregistration_delay(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#deregistration_delay AlbTargetGroup#deregistration_delay}.'''
        result = self._values.get("deregistration_delay")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def health_check(self) -> typing.Optional["AlbTargetGroupHealthCheck"]:
        '''health_check block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#health_check AlbTargetGroup#health_check}
        '''
        result = self._values.get("health_check")
        return typing.cast(typing.Optional["AlbTargetGroupHealthCheck"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#id AlbTargetGroup#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ip_address_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#ip_address_type AlbTargetGroup#ip_address_type}.'''
        result = self._values.get("ip_address_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lambda_multi_value_headers_enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#lambda_multi_value_headers_enabled AlbTargetGroup#lambda_multi_value_headers_enabled}.'''
        result = self._values.get("lambda_multi_value_headers_enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def load_balancing_algorithm_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#load_balancing_algorithm_type AlbTargetGroup#load_balancing_algorithm_type}.'''
        result = self._values.get("load_balancing_algorithm_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def load_balancing_anomaly_mitigation(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#load_balancing_anomaly_mitigation AlbTargetGroup#load_balancing_anomaly_mitigation}.'''
        result = self._values.get("load_balancing_anomaly_mitigation")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def load_balancing_cross_zone_enabled(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#load_balancing_cross_zone_enabled AlbTargetGroup#load_balancing_cross_zone_enabled}.'''
        result = self._values.get("load_balancing_cross_zone_enabled")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#name AlbTargetGroup#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#name_prefix AlbTargetGroup#name_prefix}.'''
        result = self._values.get("name_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#port AlbTargetGroup#port}.'''
        result = self._values.get("port")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def preserve_client_ip(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#preserve_client_ip AlbTargetGroup#preserve_client_ip}.'''
        result = self._values.get("preserve_client_ip")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def protocol(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#protocol AlbTargetGroup#protocol}.'''
        result = self._values.get("protocol")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def protocol_version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#protocol_version AlbTargetGroup#protocol_version}.'''
        result = self._values.get("protocol_version")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def proxy_protocol_v2(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#proxy_protocol_v2 AlbTargetGroup#proxy_protocol_v2}.'''
        result = self._values.get("proxy_protocol_v2")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def slow_start(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#slow_start AlbTargetGroup#slow_start}.'''
        result = self._values.get("slow_start")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def stickiness(self) -> typing.Optional["AlbTargetGroupStickiness"]:
        '''stickiness block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#stickiness AlbTargetGroup#stickiness}
        '''
        result = self._values.get("stickiness")
        return typing.cast(typing.Optional["AlbTargetGroupStickiness"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#tags AlbTargetGroup#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#tags_all AlbTargetGroup#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def target_failover(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AlbTargetGroupTargetFailover"]]]:
        '''target_failover block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#target_failover AlbTargetGroup#target_failover}
        '''
        result = self._values.get("target_failover")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AlbTargetGroupTargetFailover"]]], result)

    @builtins.property
    def target_group_health(self) -> typing.Optional["AlbTargetGroupTargetGroupHealth"]:
        '''target_group_health block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#target_group_health AlbTargetGroup#target_group_health}
        '''
        result = self._values.get("target_group_health")
        return typing.cast(typing.Optional["AlbTargetGroupTargetGroupHealth"], result)

    @builtins.property
    def target_health_state(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AlbTargetGroupTargetHealthState"]]]:
        '''target_health_state block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#target_health_state AlbTargetGroup#target_health_state}
        '''
        result = self._values.get("target_health_state")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AlbTargetGroupTargetHealthState"]]], result)

    @builtins.property
    def target_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#target_type AlbTargetGroup#target_type}.'''
        result = self._values.get("target_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def vpc_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#vpc_id AlbTargetGroup#vpc_id}.'''
        result = self._values.get("vpc_id")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbTargetGroupConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.albTargetGroup.AlbTargetGroupHealthCheck",
    jsii_struct_bases=[],
    name_mapping={
        "enabled": "enabled",
        "healthy_threshold": "healthyThreshold",
        "interval": "interval",
        "matcher": "matcher",
        "path": "path",
        "port": "port",
        "protocol": "protocol",
        "timeout": "timeout",
        "unhealthy_threshold": "unhealthyThreshold",
    },
)
class AlbTargetGroupHealthCheck:
    def __init__(
        self,
        *,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        healthy_threshold: typing.Optional[jsii.Number] = None,
        interval: typing.Optional[jsii.Number] = None,
        matcher: typing.Optional[builtins.str] = None,
        path: typing.Optional[builtins.str] = None,
        port: typing.Optional[builtins.str] = None,
        protocol: typing.Optional[builtins.str] = None,
        timeout: typing.Optional[jsii.Number] = None,
        unhealthy_threshold: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#enabled AlbTargetGroup#enabled}.
        :param healthy_threshold: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#healthy_threshold AlbTargetGroup#healthy_threshold}.
        :param interval: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#interval AlbTargetGroup#interval}.
        :param matcher: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#matcher AlbTargetGroup#matcher}.
        :param path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#path AlbTargetGroup#path}.
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#port AlbTargetGroup#port}.
        :param protocol: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#protocol AlbTargetGroup#protocol}.
        :param timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#timeout AlbTargetGroup#timeout}.
        :param unhealthy_threshold: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#unhealthy_threshold AlbTargetGroup#unhealthy_threshold}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c896b1fadea62dba22033ea22b3d12fc69003e3e5b3074aa809ca928019ad5fe)
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
            check_type(argname="argument healthy_threshold", value=healthy_threshold, expected_type=type_hints["healthy_threshold"])
            check_type(argname="argument interval", value=interval, expected_type=type_hints["interval"])
            check_type(argname="argument matcher", value=matcher, expected_type=type_hints["matcher"])
            check_type(argname="argument path", value=path, expected_type=type_hints["path"])
            check_type(argname="argument port", value=port, expected_type=type_hints["port"])
            check_type(argname="argument protocol", value=protocol, expected_type=type_hints["protocol"])
            check_type(argname="argument timeout", value=timeout, expected_type=type_hints["timeout"])
            check_type(argname="argument unhealthy_threshold", value=unhealthy_threshold, expected_type=type_hints["unhealthy_threshold"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if enabled is not None:
            self._values["enabled"] = enabled
        if healthy_threshold is not None:
            self._values["healthy_threshold"] = healthy_threshold
        if interval is not None:
            self._values["interval"] = interval
        if matcher is not None:
            self._values["matcher"] = matcher
        if path is not None:
            self._values["path"] = path
        if port is not None:
            self._values["port"] = port
        if protocol is not None:
            self._values["protocol"] = protocol
        if timeout is not None:
            self._values["timeout"] = timeout
        if unhealthy_threshold is not None:
            self._values["unhealthy_threshold"] = unhealthy_threshold

    @builtins.property
    def enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#enabled AlbTargetGroup#enabled}.'''
        result = self._values.get("enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def healthy_threshold(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#healthy_threshold AlbTargetGroup#healthy_threshold}.'''
        result = self._values.get("healthy_threshold")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def interval(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#interval AlbTargetGroup#interval}.'''
        result = self._values.get("interval")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def matcher(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#matcher AlbTargetGroup#matcher}.'''
        result = self._values.get("matcher")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#path AlbTargetGroup#path}.'''
        result = self._values.get("path")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def port(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#port AlbTargetGroup#port}.'''
        result = self._values.get("port")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def protocol(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#protocol AlbTargetGroup#protocol}.'''
        result = self._values.get("protocol")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def timeout(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#timeout AlbTargetGroup#timeout}.'''
        result = self._values.get("timeout")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def unhealthy_threshold(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#unhealthy_threshold AlbTargetGroup#unhealthy_threshold}.'''
        result = self._values.get("unhealthy_threshold")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbTargetGroupHealthCheck(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AlbTargetGroupHealthCheckOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.albTargetGroup.AlbTargetGroupHealthCheckOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3a1e4aebdbd97d4168ee0753b7672d3dc95aff7dfc38eabc77791a9c3b2d7ae2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetEnabled")
    def reset_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnabled", []))

    @jsii.member(jsii_name="resetHealthyThreshold")
    def reset_healthy_threshold(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHealthyThreshold", []))

    @jsii.member(jsii_name="resetInterval")
    def reset_interval(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInterval", []))

    @jsii.member(jsii_name="resetMatcher")
    def reset_matcher(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMatcher", []))

    @jsii.member(jsii_name="resetPath")
    def reset_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPath", []))

    @jsii.member(jsii_name="resetPort")
    def reset_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPort", []))

    @jsii.member(jsii_name="resetProtocol")
    def reset_protocol(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProtocol", []))

    @jsii.member(jsii_name="resetTimeout")
    def reset_timeout(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeout", []))

    @jsii.member(jsii_name="resetUnhealthyThreshold")
    def reset_unhealthy_threshold(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUnhealthyThreshold", []))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="healthyThresholdInput")
    def healthy_threshold_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "healthyThresholdInput"))

    @builtins.property
    @jsii.member(jsii_name="intervalInput")
    def interval_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "intervalInput"))

    @builtins.property
    @jsii.member(jsii_name="matcherInput")
    def matcher_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "matcherInput"))

    @builtins.property
    @jsii.member(jsii_name="pathInput")
    def path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "pathInput"))

    @builtins.property
    @jsii.member(jsii_name="portInput")
    def port_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "portInput"))

    @builtins.property
    @jsii.member(jsii_name="protocolInput")
    def protocol_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "protocolInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutInput")
    def timeout_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "timeoutInput"))

    @builtins.property
    @jsii.member(jsii_name="unhealthyThresholdInput")
    def unhealthy_threshold_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "unhealthyThresholdInput"))

    @builtins.property
    @jsii.member(jsii_name="enabled")
    def enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enabled"))

    @enabled.setter
    def enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__503cd205774aa6124fe6ea1022235e57dd1ab7274abda2b8c31238c04e0ad949)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="healthyThreshold")
    def healthy_threshold(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "healthyThreshold"))

    @healthy_threshold.setter
    def healthy_threshold(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fda5961260c27685a739db1f61e5c5f818e420906ad04b7e7c5805634942e84a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "healthyThreshold", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="interval")
    def interval(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "interval"))

    @interval.setter
    def interval(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b27dd67fb6bc1a1ae45fd3c3217342265938bcf5c9fd1d178bf0e3757fc7be4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "interval", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="matcher")
    def matcher(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "matcher"))

    @matcher.setter
    def matcher(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4d6ccfb67db93a80d690d23799242fd4aaa65ffd9eae289dbb0ccd56a200252)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "matcher", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="path")
    def path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "path"))

    @path.setter
    def path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__afd1544a91f22888988a327e025acc45254bcc60f4518bc9274e258418c5ecdc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "path", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="port")
    def port(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "port"))

    @port.setter
    def port(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__73ca7fa504aa4a4443e3fb84011a2afc4349b76dad374140562fa2610b6ec99e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "port", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="protocol")
    def protocol(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "protocol"))

    @protocol.setter
    def protocol(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8cd2ada7d3a0e93e3198266bef27b76686c09b831a22d583e591a83c0c6910aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "protocol", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="timeout")
    def timeout(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "timeout"))

    @timeout.setter
    def timeout(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9237dea034a50f96c4d0747a8b263a2e15dc09e0097ad068d0bfa4f27fe3d948)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "timeout", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="unhealthyThreshold")
    def unhealthy_threshold(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "unhealthyThreshold"))

    @unhealthy_threshold.setter
    def unhealthy_threshold(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__397cb0bd305b0247bdaca2150873138ce07db1aa4dbd040f48ba136037c37672)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "unhealthyThreshold", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AlbTargetGroupHealthCheck]:
        return typing.cast(typing.Optional[AlbTargetGroupHealthCheck], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[AlbTargetGroupHealthCheck]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d020f651b2ea98def22ecfbc69675c95c60df74cf065568880130af9b6f1a1a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.albTargetGroup.AlbTargetGroupStickiness",
    jsii_struct_bases=[],
    name_mapping={
        "type": "type",
        "cookie_duration": "cookieDuration",
        "cookie_name": "cookieName",
        "enabled": "enabled",
    },
)
class AlbTargetGroupStickiness:
    def __init__(
        self,
        *,
        type: builtins.str,
        cookie_duration: typing.Optional[jsii.Number] = None,
        cookie_name: typing.Optional[builtins.str] = None,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#type AlbTargetGroup#type}.
        :param cookie_duration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#cookie_duration AlbTargetGroup#cookie_duration}.
        :param cookie_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#cookie_name AlbTargetGroup#cookie_name}.
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#enabled AlbTargetGroup#enabled}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b04707f27303ce9ce320334fc92a9075536252a13178944e8092b1cca46cd7e)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument cookie_duration", value=cookie_duration, expected_type=type_hints["cookie_duration"])
            check_type(argname="argument cookie_name", value=cookie_name, expected_type=type_hints["cookie_name"])
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "type": type,
        }
        if cookie_duration is not None:
            self._values["cookie_duration"] = cookie_duration
        if cookie_name is not None:
            self._values["cookie_name"] = cookie_name
        if enabled is not None:
            self._values["enabled"] = enabled

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#type AlbTargetGroup#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def cookie_duration(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#cookie_duration AlbTargetGroup#cookie_duration}.'''
        result = self._values.get("cookie_duration")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def cookie_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#cookie_name AlbTargetGroup#cookie_name}.'''
        result = self._values.get("cookie_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#enabled AlbTargetGroup#enabled}.'''
        result = self._values.get("enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbTargetGroupStickiness(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AlbTargetGroupStickinessOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.albTargetGroup.AlbTargetGroupStickinessOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__604c119982dea27813dabec2e6fd698ca6ac1d9dd9e2cd9220bdeb666ac6c68a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCookieDuration")
    def reset_cookie_duration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCookieDuration", []))

    @jsii.member(jsii_name="resetCookieName")
    def reset_cookie_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCookieName", []))

    @jsii.member(jsii_name="resetEnabled")
    def reset_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnabled", []))

    @builtins.property
    @jsii.member(jsii_name="cookieDurationInput")
    def cookie_duration_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "cookieDurationInput"))

    @builtins.property
    @jsii.member(jsii_name="cookieNameInput")
    def cookie_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cookieNameInput"))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="cookieDuration")
    def cookie_duration(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "cookieDuration"))

    @cookie_duration.setter
    def cookie_duration(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f59881b8b1673d07b35e9c224339ce9f06b6c9a04f413202356fdbb9f4d301f7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cookieDuration", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="cookieName")
    def cookie_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "cookieName"))

    @cookie_name.setter
    def cookie_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__290a454c1776aa41fe59a4e16070a5a4350c6cb981ed0d69731367e0c99e658f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cookieName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enabled")
    def enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enabled"))

    @enabled.setter
    def enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__93f1e8e88698c9305f3f9a664a8a84aaaf43e8011da7a939a639109de875bb1e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__312d96895753a30370b8766ffdfabfc2176a734c2790d1fd4944c11db9a99a01)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AlbTargetGroupStickiness]:
        return typing.cast(typing.Optional[AlbTargetGroupStickiness], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[AlbTargetGroupStickiness]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8cb32912ac98352ff052ffa63d6908f77ed2d960f7053925cce280e2fd710373)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.albTargetGroup.AlbTargetGroupTargetFailover",
    jsii_struct_bases=[],
    name_mapping={
        "on_deregistration": "onDeregistration",
        "on_unhealthy": "onUnhealthy",
    },
)
class AlbTargetGroupTargetFailover:
    def __init__(
        self,
        *,
        on_deregistration: builtins.str,
        on_unhealthy: builtins.str,
    ) -> None:
        '''
        :param on_deregistration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#on_deregistration AlbTargetGroup#on_deregistration}.
        :param on_unhealthy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#on_unhealthy AlbTargetGroup#on_unhealthy}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__924fa0f470a0c171cda2e5779033110bda5e0ea11fb0fca44945d6e6d2865c4c)
            check_type(argname="argument on_deregistration", value=on_deregistration, expected_type=type_hints["on_deregistration"])
            check_type(argname="argument on_unhealthy", value=on_unhealthy, expected_type=type_hints["on_unhealthy"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "on_deregistration": on_deregistration,
            "on_unhealthy": on_unhealthy,
        }

    @builtins.property
    def on_deregistration(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#on_deregistration AlbTargetGroup#on_deregistration}.'''
        result = self._values.get("on_deregistration")
        assert result is not None, "Required property 'on_deregistration' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def on_unhealthy(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#on_unhealthy AlbTargetGroup#on_unhealthy}.'''
        result = self._values.get("on_unhealthy")
        assert result is not None, "Required property 'on_unhealthy' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbTargetGroupTargetFailover(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AlbTargetGroupTargetFailoverList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.albTargetGroup.AlbTargetGroupTargetFailoverList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5f4909817345ec97a2dcb51b4cd642b42f90ae2bfc092ad1b6dc55ea23040ade)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "AlbTargetGroupTargetFailoverOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__85b25b96b279da8c112fad0fe1a97ab7fd00d04f9a41e11937314defdced00d1)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("AlbTargetGroupTargetFailoverOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__982228a2e9c89783f380555d763c392c54774a7dde6898a060e5f48d9787f955)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9fe97d1d6945ac37e21422923bfea1fead016f71c17d42b86d21104549d77c16)
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
            type_hints = typing.get_type_hints(_typecheckingstub__936ebf92726c74add50e042e1b58a705d2390dd785526fc980b31d332b63c787)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AlbTargetGroupTargetFailover]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AlbTargetGroupTargetFailover]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AlbTargetGroupTargetFailover]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__320c15a0541be560687157efe34f536a825b1d1daf18b5f7045ae0017bf259c2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AlbTargetGroupTargetFailoverOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.albTargetGroup.AlbTargetGroupTargetFailoverOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__de39aacf90141a772bd159f336466606689531db6e5528a1dea7d9b74c328817)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="onDeregistrationInput")
    def on_deregistration_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "onDeregistrationInput"))

    @builtins.property
    @jsii.member(jsii_name="onUnhealthyInput")
    def on_unhealthy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "onUnhealthyInput"))

    @builtins.property
    @jsii.member(jsii_name="onDeregistration")
    def on_deregistration(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "onDeregistration"))

    @on_deregistration.setter
    def on_deregistration(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99f5eddc264f05f114934238eb89c2bc74a3538b7eab3aef78c165361a878231)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onDeregistration", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onUnhealthy")
    def on_unhealthy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "onUnhealthy"))

    @on_unhealthy.setter
    def on_unhealthy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9c7dadc43979c10fb3c954e40b79afeb4159533f532691bb4640c5c1475a6f6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onUnhealthy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbTargetGroupTargetFailover]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbTargetGroupTargetFailover]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbTargetGroupTargetFailover]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7bafae71d7e4d46c8d788401724829f8320d4e8e54d42c817075102d8085134d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.albTargetGroup.AlbTargetGroupTargetGroupHealth",
    jsii_struct_bases=[],
    name_mapping={
        "dns_failover": "dnsFailover",
        "unhealthy_state_routing": "unhealthyStateRouting",
    },
)
class AlbTargetGroupTargetGroupHealth:
    def __init__(
        self,
        *,
        dns_failover: typing.Optional[typing.Union["AlbTargetGroupTargetGroupHealthDnsFailover", typing.Dict[builtins.str, typing.Any]]] = None,
        unhealthy_state_routing: typing.Optional[typing.Union["AlbTargetGroupTargetGroupHealthUnhealthyStateRouting", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param dns_failover: dns_failover block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#dns_failover AlbTargetGroup#dns_failover}
        :param unhealthy_state_routing: unhealthy_state_routing block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#unhealthy_state_routing AlbTargetGroup#unhealthy_state_routing}
        '''
        if isinstance(dns_failover, dict):
            dns_failover = AlbTargetGroupTargetGroupHealthDnsFailover(**dns_failover)
        if isinstance(unhealthy_state_routing, dict):
            unhealthy_state_routing = AlbTargetGroupTargetGroupHealthUnhealthyStateRouting(**unhealthy_state_routing)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6f372e9a4b7b60703bec758282bd59b3ee306f1bb39c85783b676c7ae7be5df3)
            check_type(argname="argument dns_failover", value=dns_failover, expected_type=type_hints["dns_failover"])
            check_type(argname="argument unhealthy_state_routing", value=unhealthy_state_routing, expected_type=type_hints["unhealthy_state_routing"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if dns_failover is not None:
            self._values["dns_failover"] = dns_failover
        if unhealthy_state_routing is not None:
            self._values["unhealthy_state_routing"] = unhealthy_state_routing

    @builtins.property
    def dns_failover(
        self,
    ) -> typing.Optional["AlbTargetGroupTargetGroupHealthDnsFailover"]:
        '''dns_failover block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#dns_failover AlbTargetGroup#dns_failover}
        '''
        result = self._values.get("dns_failover")
        return typing.cast(typing.Optional["AlbTargetGroupTargetGroupHealthDnsFailover"], result)

    @builtins.property
    def unhealthy_state_routing(
        self,
    ) -> typing.Optional["AlbTargetGroupTargetGroupHealthUnhealthyStateRouting"]:
        '''unhealthy_state_routing block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#unhealthy_state_routing AlbTargetGroup#unhealthy_state_routing}
        '''
        result = self._values.get("unhealthy_state_routing")
        return typing.cast(typing.Optional["AlbTargetGroupTargetGroupHealthUnhealthyStateRouting"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbTargetGroupTargetGroupHealth(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.albTargetGroup.AlbTargetGroupTargetGroupHealthDnsFailover",
    jsii_struct_bases=[],
    name_mapping={
        "minimum_healthy_targets_count": "minimumHealthyTargetsCount",
        "minimum_healthy_targets_percentage": "minimumHealthyTargetsPercentage",
    },
)
class AlbTargetGroupTargetGroupHealthDnsFailover:
    def __init__(
        self,
        *,
        minimum_healthy_targets_count: typing.Optional[builtins.str] = None,
        minimum_healthy_targets_percentage: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param minimum_healthy_targets_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_count AlbTargetGroup#minimum_healthy_targets_count}.
        :param minimum_healthy_targets_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_percentage AlbTargetGroup#minimum_healthy_targets_percentage}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__10bde2586cd777e682ba72b2d5d9b959ff3f69c098a2bbb21f43a4956a763970)
            check_type(argname="argument minimum_healthy_targets_count", value=minimum_healthy_targets_count, expected_type=type_hints["minimum_healthy_targets_count"])
            check_type(argname="argument minimum_healthy_targets_percentage", value=minimum_healthy_targets_percentage, expected_type=type_hints["minimum_healthy_targets_percentage"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if minimum_healthy_targets_count is not None:
            self._values["minimum_healthy_targets_count"] = minimum_healthy_targets_count
        if minimum_healthy_targets_percentage is not None:
            self._values["minimum_healthy_targets_percentage"] = minimum_healthy_targets_percentage

    @builtins.property
    def minimum_healthy_targets_count(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_count AlbTargetGroup#minimum_healthy_targets_count}.'''
        result = self._values.get("minimum_healthy_targets_count")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def minimum_healthy_targets_percentage(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_percentage AlbTargetGroup#minimum_healthy_targets_percentage}.'''
        result = self._values.get("minimum_healthy_targets_percentage")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbTargetGroupTargetGroupHealthDnsFailover(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AlbTargetGroupTargetGroupHealthDnsFailoverOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.albTargetGroup.AlbTargetGroupTargetGroupHealthDnsFailoverOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__aef144f7af95cf464751fd2f42212c35e89e1c5352358abec8543894631d3bf3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMinimumHealthyTargetsCount")
    def reset_minimum_healthy_targets_count(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinimumHealthyTargetsCount", []))

    @jsii.member(jsii_name="resetMinimumHealthyTargetsPercentage")
    def reset_minimum_healthy_targets_percentage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinimumHealthyTargetsPercentage", []))

    @builtins.property
    @jsii.member(jsii_name="minimumHealthyTargetsCountInput")
    def minimum_healthy_targets_count_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "minimumHealthyTargetsCountInput"))

    @builtins.property
    @jsii.member(jsii_name="minimumHealthyTargetsPercentageInput")
    def minimum_healthy_targets_percentage_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "minimumHealthyTargetsPercentageInput"))

    @builtins.property
    @jsii.member(jsii_name="minimumHealthyTargetsCount")
    def minimum_healthy_targets_count(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "minimumHealthyTargetsCount"))

    @minimum_healthy_targets_count.setter
    def minimum_healthy_targets_count(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e3c23c303bf5ccbb4ad8475b19e13eafea37211f02c870fc4bea328b1099b0e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minimumHealthyTargetsCount", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minimumHealthyTargetsPercentage")
    def minimum_healthy_targets_percentage(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "minimumHealthyTargetsPercentage"))

    @minimum_healthy_targets_percentage.setter
    def minimum_healthy_targets_percentage(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab1072d98f66e2797ac8e2a54d39279ed433e71413200ab141bd5c71a40a6a2d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minimumHealthyTargetsPercentage", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AlbTargetGroupTargetGroupHealthDnsFailover]:
        return typing.cast(typing.Optional[AlbTargetGroupTargetGroupHealthDnsFailover], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AlbTargetGroupTargetGroupHealthDnsFailover],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__deece127599e3f4538b392fd88e9c77e788e39cd3ce6d8976d10d7b2aa51e8a9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AlbTargetGroupTargetGroupHealthOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.albTargetGroup.AlbTargetGroupTargetGroupHealthOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__30912da21b76e5f8075dff20202a056a543d32d3201108c011ad2d8470178798)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDnsFailover")
    def put_dns_failover(
        self,
        *,
        minimum_healthy_targets_count: typing.Optional[builtins.str] = None,
        minimum_healthy_targets_percentage: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param minimum_healthy_targets_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_count AlbTargetGroup#minimum_healthy_targets_count}.
        :param minimum_healthy_targets_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_percentage AlbTargetGroup#minimum_healthy_targets_percentage}.
        '''
        value = AlbTargetGroupTargetGroupHealthDnsFailover(
            minimum_healthy_targets_count=minimum_healthy_targets_count,
            minimum_healthy_targets_percentage=minimum_healthy_targets_percentage,
        )

        return typing.cast(None, jsii.invoke(self, "putDnsFailover", [value]))

    @jsii.member(jsii_name="putUnhealthyStateRouting")
    def put_unhealthy_state_routing(
        self,
        *,
        minimum_healthy_targets_count: typing.Optional[jsii.Number] = None,
        minimum_healthy_targets_percentage: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param minimum_healthy_targets_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_count AlbTargetGroup#minimum_healthy_targets_count}.
        :param minimum_healthy_targets_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_percentage AlbTargetGroup#minimum_healthy_targets_percentage}.
        '''
        value = AlbTargetGroupTargetGroupHealthUnhealthyStateRouting(
            minimum_healthy_targets_count=minimum_healthy_targets_count,
            minimum_healthy_targets_percentage=minimum_healthy_targets_percentage,
        )

        return typing.cast(None, jsii.invoke(self, "putUnhealthyStateRouting", [value]))

    @jsii.member(jsii_name="resetDnsFailover")
    def reset_dns_failover(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDnsFailover", []))

    @jsii.member(jsii_name="resetUnhealthyStateRouting")
    def reset_unhealthy_state_routing(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUnhealthyStateRouting", []))

    @builtins.property
    @jsii.member(jsii_name="dnsFailover")
    def dns_failover(self) -> AlbTargetGroupTargetGroupHealthDnsFailoverOutputReference:
        return typing.cast(AlbTargetGroupTargetGroupHealthDnsFailoverOutputReference, jsii.get(self, "dnsFailover"))

    @builtins.property
    @jsii.member(jsii_name="unhealthyStateRouting")
    def unhealthy_state_routing(
        self,
    ) -> "AlbTargetGroupTargetGroupHealthUnhealthyStateRoutingOutputReference":
        return typing.cast("AlbTargetGroupTargetGroupHealthUnhealthyStateRoutingOutputReference", jsii.get(self, "unhealthyStateRouting"))

    @builtins.property
    @jsii.member(jsii_name="dnsFailoverInput")
    def dns_failover_input(
        self,
    ) -> typing.Optional[AlbTargetGroupTargetGroupHealthDnsFailover]:
        return typing.cast(typing.Optional[AlbTargetGroupTargetGroupHealthDnsFailover], jsii.get(self, "dnsFailoverInput"))

    @builtins.property
    @jsii.member(jsii_name="unhealthyStateRoutingInput")
    def unhealthy_state_routing_input(
        self,
    ) -> typing.Optional["AlbTargetGroupTargetGroupHealthUnhealthyStateRouting"]:
        return typing.cast(typing.Optional["AlbTargetGroupTargetGroupHealthUnhealthyStateRouting"], jsii.get(self, "unhealthyStateRoutingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AlbTargetGroupTargetGroupHealth]:
        return typing.cast(typing.Optional[AlbTargetGroupTargetGroupHealth], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AlbTargetGroupTargetGroupHealth],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ea966df008bb3f1ef47772755d30d27767859e3e6ee14d80cda2d7cdeac7792)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.albTargetGroup.AlbTargetGroupTargetGroupHealthUnhealthyStateRouting",
    jsii_struct_bases=[],
    name_mapping={
        "minimum_healthy_targets_count": "minimumHealthyTargetsCount",
        "minimum_healthy_targets_percentage": "minimumHealthyTargetsPercentage",
    },
)
class AlbTargetGroupTargetGroupHealthUnhealthyStateRouting:
    def __init__(
        self,
        *,
        minimum_healthy_targets_count: typing.Optional[jsii.Number] = None,
        minimum_healthy_targets_percentage: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param minimum_healthy_targets_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_count AlbTargetGroup#minimum_healthy_targets_count}.
        :param minimum_healthy_targets_percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_percentage AlbTargetGroup#minimum_healthy_targets_percentage}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__218caf7a0bbe60da4b01c4b6631c6cff87a5d1f9078d93e7004513ba5c274947)
            check_type(argname="argument minimum_healthy_targets_count", value=minimum_healthy_targets_count, expected_type=type_hints["minimum_healthy_targets_count"])
            check_type(argname="argument minimum_healthy_targets_percentage", value=minimum_healthy_targets_percentage, expected_type=type_hints["minimum_healthy_targets_percentage"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if minimum_healthy_targets_count is not None:
            self._values["minimum_healthy_targets_count"] = minimum_healthy_targets_count
        if minimum_healthy_targets_percentage is not None:
            self._values["minimum_healthy_targets_percentage"] = minimum_healthy_targets_percentage

    @builtins.property
    def minimum_healthy_targets_count(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_count AlbTargetGroup#minimum_healthy_targets_count}.'''
        result = self._values.get("minimum_healthy_targets_count")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def minimum_healthy_targets_percentage(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_percentage AlbTargetGroup#minimum_healthy_targets_percentage}.'''
        result = self._values.get("minimum_healthy_targets_percentage")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbTargetGroupTargetGroupHealthUnhealthyStateRouting(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AlbTargetGroupTargetGroupHealthUnhealthyStateRoutingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.albTargetGroup.AlbTargetGroupTargetGroupHealthUnhealthyStateRoutingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__84103925da5562cc3c6508dd6ea5bd2cda162b5aae3379effe57f9f7d7d68e6f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMinimumHealthyTargetsCount")
    def reset_minimum_healthy_targets_count(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinimumHealthyTargetsCount", []))

    @jsii.member(jsii_name="resetMinimumHealthyTargetsPercentage")
    def reset_minimum_healthy_targets_percentage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinimumHealthyTargetsPercentage", []))

    @builtins.property
    @jsii.member(jsii_name="minimumHealthyTargetsCountInput")
    def minimum_healthy_targets_count_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minimumHealthyTargetsCountInput"))

    @builtins.property
    @jsii.member(jsii_name="minimumHealthyTargetsPercentageInput")
    def minimum_healthy_targets_percentage_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "minimumHealthyTargetsPercentageInput"))

    @builtins.property
    @jsii.member(jsii_name="minimumHealthyTargetsCount")
    def minimum_healthy_targets_count(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minimumHealthyTargetsCount"))

    @minimum_healthy_targets_count.setter
    def minimum_healthy_targets_count(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ed48187afabd16e47668b11ba908d92a0c0c1417a7fe23abe76086933175cd8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minimumHealthyTargetsCount", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minimumHealthyTargetsPercentage")
    def minimum_healthy_targets_percentage(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "minimumHealthyTargetsPercentage"))

    @minimum_healthy_targets_percentage.setter
    def minimum_healthy_targets_percentage(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ec70c1c2d5b783e75811b8c0a5b1d0bfa8f89d72e2df13bd08148c304dde70d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minimumHealthyTargetsPercentage", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[AlbTargetGroupTargetGroupHealthUnhealthyStateRouting]:
        return typing.cast(typing.Optional[AlbTargetGroupTargetGroupHealthUnhealthyStateRouting], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AlbTargetGroupTargetGroupHealthUnhealthyStateRouting],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6db7be4bc31b22b1d8c0680c68b175d2ccb83811874158320f71aafda2811d65)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.albTargetGroup.AlbTargetGroupTargetHealthState",
    jsii_struct_bases=[],
    name_mapping={
        "enable_unhealthy_connection_termination": "enableUnhealthyConnectionTermination",
        "unhealthy_draining_interval": "unhealthyDrainingInterval",
    },
)
class AlbTargetGroupTargetHealthState:
    def __init__(
        self,
        *,
        enable_unhealthy_connection_termination: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        unhealthy_draining_interval: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param enable_unhealthy_connection_termination: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#enable_unhealthy_connection_termination AlbTargetGroup#enable_unhealthy_connection_termination}.
        :param unhealthy_draining_interval: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#unhealthy_draining_interval AlbTargetGroup#unhealthy_draining_interval}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__be4a83073581dee1b1cf0551a797ee7759635e86ce25aaa224c7178d38a7b8ed)
            check_type(argname="argument enable_unhealthy_connection_termination", value=enable_unhealthy_connection_termination, expected_type=type_hints["enable_unhealthy_connection_termination"])
            check_type(argname="argument unhealthy_draining_interval", value=unhealthy_draining_interval, expected_type=type_hints["unhealthy_draining_interval"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "enable_unhealthy_connection_termination": enable_unhealthy_connection_termination,
        }
        if unhealthy_draining_interval is not None:
            self._values["unhealthy_draining_interval"] = unhealthy_draining_interval

    @builtins.property
    def enable_unhealthy_connection_termination(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#enable_unhealthy_connection_termination AlbTargetGroup#enable_unhealthy_connection_termination}.'''
        result = self._values.get("enable_unhealthy_connection_termination")
        assert result is not None, "Required property 'enable_unhealthy_connection_termination' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    @builtins.property
    def unhealthy_draining_interval(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#unhealthy_draining_interval AlbTargetGroup#unhealthy_draining_interval}.'''
        result = self._values.get("unhealthy_draining_interval")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbTargetGroupTargetHealthState(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AlbTargetGroupTargetHealthStateList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.albTargetGroup.AlbTargetGroupTargetHealthStateList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__72416264362def055f8e74095168d0b8874b8368f23ea8e78b650a890ade2f5b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "AlbTargetGroupTargetHealthStateOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18170a03a4728abba67a7c20b2ec252394d2604f1e2658f1007c0b13cc56d7ff)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("AlbTargetGroupTargetHealthStateOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__320d7e03c1ae42b12ceda3bd5213c674b13bfc895fbbb1865c47c476da08171c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5c4c043cb3a8b8f2d8e968928b7f5de0ac907bbfd85e259d6a1cf841ab2502c6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2834d006257b2fe1015904e9cb0c39eb95a462455ce5239a7f0aa596ee554c43)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AlbTargetGroupTargetHealthState]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AlbTargetGroupTargetHealthState]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AlbTargetGroupTargetHealthState]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9cb294541ad1b68a43eeea4932a619cdf88adc8be9f88a0ef4c6dd436cf44afc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AlbTargetGroupTargetHealthStateOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.albTargetGroup.AlbTargetGroupTargetHealthStateOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e723fa0afdd465cd03f45209615c671d641abd5510e1254f704d9012e78eed9d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetUnhealthyDrainingInterval")
    def reset_unhealthy_draining_interval(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUnhealthyDrainingInterval", []))

    @builtins.property
    @jsii.member(jsii_name="enableUnhealthyConnectionTerminationInput")
    def enable_unhealthy_connection_termination_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableUnhealthyConnectionTerminationInput"))

    @builtins.property
    @jsii.member(jsii_name="unhealthyDrainingIntervalInput")
    def unhealthy_draining_interval_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "unhealthyDrainingIntervalInput"))

    @builtins.property
    @jsii.member(jsii_name="enableUnhealthyConnectionTermination")
    def enable_unhealthy_connection_termination(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableUnhealthyConnectionTermination"))

    @enable_unhealthy_connection_termination.setter
    def enable_unhealthy_connection_termination(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__374041c0bd4f587105b36cd772b05779a6462cd472ba464b1996b6169a72c4c3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableUnhealthyConnectionTermination", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="unhealthyDrainingInterval")
    def unhealthy_draining_interval(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "unhealthyDrainingInterval"))

    @unhealthy_draining_interval.setter
    def unhealthy_draining_interval(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c931fa6b7d03c392d3b9691da6bf26ee6963d474add3a0d0b222be9c789f282)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "unhealthyDrainingInterval", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbTargetGroupTargetHealthState]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbTargetGroupTargetHealthState]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbTargetGroupTargetHealthState]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4fd1013fba17a652a7ae0c989af49f7b463219a8de3ca17031bc290c61b43e61)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "AlbTargetGroup",
    "AlbTargetGroupConfig",
    "AlbTargetGroupHealthCheck",
    "AlbTargetGroupHealthCheckOutputReference",
    "AlbTargetGroupStickiness",
    "AlbTargetGroupStickinessOutputReference",
    "AlbTargetGroupTargetFailover",
    "AlbTargetGroupTargetFailoverList",
    "AlbTargetGroupTargetFailoverOutputReference",
    "AlbTargetGroupTargetGroupHealth",
    "AlbTargetGroupTargetGroupHealthDnsFailover",
    "AlbTargetGroupTargetGroupHealthDnsFailoverOutputReference",
    "AlbTargetGroupTargetGroupHealthOutputReference",
    "AlbTargetGroupTargetGroupHealthUnhealthyStateRouting",
    "AlbTargetGroupTargetGroupHealthUnhealthyStateRoutingOutputReference",
    "AlbTargetGroupTargetHealthState",
    "AlbTargetGroupTargetHealthStateList",
    "AlbTargetGroupTargetHealthStateOutputReference",
]

publication.publish()

def _typecheckingstub__560d03d7e69d811f9971fe3108b75c76a29015203041b794499d7ea34bfb6014(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    connection_termination: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    deregistration_delay: typing.Optional[builtins.str] = None,
    health_check: typing.Optional[typing.Union[AlbTargetGroupHealthCheck, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    ip_address_type: typing.Optional[builtins.str] = None,
    lambda_multi_value_headers_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    load_balancing_algorithm_type: typing.Optional[builtins.str] = None,
    load_balancing_anomaly_mitigation: typing.Optional[builtins.str] = None,
    load_balancing_cross_zone_enabled: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    port: typing.Optional[jsii.Number] = None,
    preserve_client_ip: typing.Optional[builtins.str] = None,
    protocol: typing.Optional[builtins.str] = None,
    protocol_version: typing.Optional[builtins.str] = None,
    proxy_protocol_v2: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    slow_start: typing.Optional[jsii.Number] = None,
    stickiness: typing.Optional[typing.Union[AlbTargetGroupStickiness, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    target_failover: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AlbTargetGroupTargetFailover, typing.Dict[builtins.str, typing.Any]]]]] = None,
    target_group_health: typing.Optional[typing.Union[AlbTargetGroupTargetGroupHealth, typing.Dict[builtins.str, typing.Any]]] = None,
    target_health_state: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AlbTargetGroupTargetHealthState, typing.Dict[builtins.str, typing.Any]]]]] = None,
    target_type: typing.Optional[builtins.str] = None,
    vpc_id: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__0e9d933ac129b18af99ac89c683c5a361c0d2b499a0e75d902e51e21ad0c8c99(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__446fe511c19bf7891bb1c7262b21098f12b24d24e85a44972c34b535c9fc1944(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AlbTargetGroupTargetFailover, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d42fe12e4f9ff8f9a08a1aa7fef884d0efebee29c9974d9bf24daea7f517d8f2(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AlbTargetGroupTargetHealthState, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41e2de4718507db1f6b7a504fb77305c358abb75f1a5b4818c4ebbe90be08b6c(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2e843e73e477662c8d70a0fd89d347cec1d3d8418ea6aa4b14256b3712100535(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f18eebbf6916bed8fe4e7b50451dfe724bc043381d1c38b298f9e4e63bcb43e6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12560f58f0aa43c956bf43b37d382f9c2c54d0f835a3ac969a859ef49d3b6ac9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0e6d23e2f7ab2033bc093fd23f7a0284d006eb669dc1b266643a125726620ba(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5d0d9d9ce374fde6c52d8c635855008deaee8d1520876a2f593962b77c34cc2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d529c51c0765743648aa21e8c8f52543ffcffda0df2889609eecddebb60252b6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__762c3d1670750c0030b872ce6cd52635bb88d5a4ad78d07327d80e2e0879d21e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b2c637301473d405ee390de3aca32444c98b517b0425926e78bff33913be33b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ed639ed3371c21fd1bb7ff22b089ec18bcc80d15f80181c6e8981bb65ef9f44(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e06b0ca3041312918f9428b8b697d6358fee44601add7515508ce498ae49d172(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0570eb89f0924a9196e74b7afc23c5dcb5c55572a0c679b375e19a28267e13a7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__faff35c2df4e2cb531cade94ed390c76c098872b3a496ef10dfe3f3d4f121c25(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a8bc272151d5a52ed3313cd0117de2246e2128ece3640289012107dc6f142ba6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56c3ff084c837e142d62b04254eae2e0e0f53a29caa51f79bae08f28dfae1583(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83803fce3701bda3107f914afbe684c61a8a2a5154affc18553544451e47a3cb(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__58e9c0accca4f348163ac7591449d5653d09e8d4ddae860e6813cfe389dd4d54(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72807f3d0a4c89cc0564237bc3ae0f479e1c5115b62bf259b196f30e7c60a5eb(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__494b1cd819b06464b3c4b0f2334cf4d06984ea0528fb8a12b337045b590ba37a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f191ad1cbe006fdfa9d48773ad7ab31de49c6605af52c591e563268a6d9bb6a3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e810457e77275657902e52d2d77b322201c8937dcf80afb20ede1f4857b20b89(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    connection_termination: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    deregistration_delay: typing.Optional[builtins.str] = None,
    health_check: typing.Optional[typing.Union[AlbTargetGroupHealthCheck, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    ip_address_type: typing.Optional[builtins.str] = None,
    lambda_multi_value_headers_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    load_balancing_algorithm_type: typing.Optional[builtins.str] = None,
    load_balancing_anomaly_mitigation: typing.Optional[builtins.str] = None,
    load_balancing_cross_zone_enabled: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    port: typing.Optional[jsii.Number] = None,
    preserve_client_ip: typing.Optional[builtins.str] = None,
    protocol: typing.Optional[builtins.str] = None,
    protocol_version: typing.Optional[builtins.str] = None,
    proxy_protocol_v2: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    slow_start: typing.Optional[jsii.Number] = None,
    stickiness: typing.Optional[typing.Union[AlbTargetGroupStickiness, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    target_failover: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AlbTargetGroupTargetFailover, typing.Dict[builtins.str, typing.Any]]]]] = None,
    target_group_health: typing.Optional[typing.Union[AlbTargetGroupTargetGroupHealth, typing.Dict[builtins.str, typing.Any]]] = None,
    target_health_state: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AlbTargetGroupTargetHealthState, typing.Dict[builtins.str, typing.Any]]]]] = None,
    target_type: typing.Optional[builtins.str] = None,
    vpc_id: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c896b1fadea62dba22033ea22b3d12fc69003e3e5b3074aa809ca928019ad5fe(
    *,
    enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    healthy_threshold: typing.Optional[jsii.Number] = None,
    interval: typing.Optional[jsii.Number] = None,
    matcher: typing.Optional[builtins.str] = None,
    path: typing.Optional[builtins.str] = None,
    port: typing.Optional[builtins.str] = None,
    protocol: typing.Optional[builtins.str] = None,
    timeout: typing.Optional[jsii.Number] = None,
    unhealthy_threshold: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a1e4aebdbd97d4168ee0753b7672d3dc95aff7dfc38eabc77791a9c3b2d7ae2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__503cd205774aa6124fe6ea1022235e57dd1ab7274abda2b8c31238c04e0ad949(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fda5961260c27685a739db1f61e5c5f818e420906ad04b7e7c5805634942e84a(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b27dd67fb6bc1a1ae45fd3c3217342265938bcf5c9fd1d178bf0e3757fc7be4(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4d6ccfb67db93a80d690d23799242fd4aaa65ffd9eae289dbb0ccd56a200252(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afd1544a91f22888988a327e025acc45254bcc60f4518bc9274e258418c5ecdc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73ca7fa504aa4a4443e3fb84011a2afc4349b76dad374140562fa2610b6ec99e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8cd2ada7d3a0e93e3198266bef27b76686c09b831a22d583e591a83c0c6910aa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9237dea034a50f96c4d0747a8b263a2e15dc09e0097ad068d0bfa4f27fe3d948(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__397cb0bd305b0247bdaca2150873138ce07db1aa4dbd040f48ba136037c37672(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d020f651b2ea98def22ecfbc69675c95c60df74cf065568880130af9b6f1a1a0(
    value: typing.Optional[AlbTargetGroupHealthCheck],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b04707f27303ce9ce320334fc92a9075536252a13178944e8092b1cca46cd7e(
    *,
    type: builtins.str,
    cookie_duration: typing.Optional[jsii.Number] = None,
    cookie_name: typing.Optional[builtins.str] = None,
    enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__604c119982dea27813dabec2e6fd698ca6ac1d9dd9e2cd9220bdeb666ac6c68a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f59881b8b1673d07b35e9c224339ce9f06b6c9a04f413202356fdbb9f4d301f7(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__290a454c1776aa41fe59a4e16070a5a4350c6cb981ed0d69731367e0c99e658f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93f1e8e88698c9305f3f9a664a8a84aaaf43e8011da7a939a639109de875bb1e(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__312d96895753a30370b8766ffdfabfc2176a734c2790d1fd4944c11db9a99a01(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8cb32912ac98352ff052ffa63d6908f77ed2d960f7053925cce280e2fd710373(
    value: typing.Optional[AlbTargetGroupStickiness],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__924fa0f470a0c171cda2e5779033110bda5e0ea11fb0fca44945d6e6d2865c4c(
    *,
    on_deregistration: builtins.str,
    on_unhealthy: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f4909817345ec97a2dcb51b4cd642b42f90ae2bfc092ad1b6dc55ea23040ade(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85b25b96b279da8c112fad0fe1a97ab7fd00d04f9a41e11937314defdced00d1(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__982228a2e9c89783f380555d763c392c54774a7dde6898a060e5f48d9787f955(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9fe97d1d6945ac37e21422923bfea1fead016f71c17d42b86d21104549d77c16(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__936ebf92726c74add50e042e1b58a705d2390dd785526fc980b31d332b63c787(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__320c15a0541be560687157efe34f536a825b1d1daf18b5f7045ae0017bf259c2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AlbTargetGroupTargetFailover]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__de39aacf90141a772bd159f336466606689531db6e5528a1dea7d9b74c328817(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99f5eddc264f05f114934238eb89c2bc74a3538b7eab3aef78c165361a878231(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9c7dadc43979c10fb3c954e40b79afeb4159533f532691bb4640c5c1475a6f6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7bafae71d7e4d46c8d788401724829f8320d4e8e54d42c817075102d8085134d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbTargetGroupTargetFailover]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f372e9a4b7b60703bec758282bd59b3ee306f1bb39c85783b676c7ae7be5df3(
    *,
    dns_failover: typing.Optional[typing.Union[AlbTargetGroupTargetGroupHealthDnsFailover, typing.Dict[builtins.str, typing.Any]]] = None,
    unhealthy_state_routing: typing.Optional[typing.Union[AlbTargetGroupTargetGroupHealthUnhealthyStateRouting, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10bde2586cd777e682ba72b2d5d9b959ff3f69c098a2bbb21f43a4956a763970(
    *,
    minimum_healthy_targets_count: typing.Optional[builtins.str] = None,
    minimum_healthy_targets_percentage: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aef144f7af95cf464751fd2f42212c35e89e1c5352358abec8543894631d3bf3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e3c23c303bf5ccbb4ad8475b19e13eafea37211f02c870fc4bea328b1099b0e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab1072d98f66e2797ac8e2a54d39279ed433e71413200ab141bd5c71a40a6a2d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__deece127599e3f4538b392fd88e9c77e788e39cd3ce6d8976d10d7b2aa51e8a9(
    value: typing.Optional[AlbTargetGroupTargetGroupHealthDnsFailover],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30912da21b76e5f8075dff20202a056a543d32d3201108c011ad2d8470178798(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ea966df008bb3f1ef47772755d30d27767859e3e6ee14d80cda2d7cdeac7792(
    value: typing.Optional[AlbTargetGroupTargetGroupHealth],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__218caf7a0bbe60da4b01c4b6631c6cff87a5d1f9078d93e7004513ba5c274947(
    *,
    minimum_healthy_targets_count: typing.Optional[jsii.Number] = None,
    minimum_healthy_targets_percentage: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84103925da5562cc3c6508dd6ea5bd2cda162b5aae3379effe57f9f7d7d68e6f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ed48187afabd16e47668b11ba908d92a0c0c1417a7fe23abe76086933175cd8(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ec70c1c2d5b783e75811b8c0a5b1d0bfa8f89d72e2df13bd08148c304dde70d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6db7be4bc31b22b1d8c0680c68b175d2ccb83811874158320f71aafda2811d65(
    value: typing.Optional[AlbTargetGroupTargetGroupHealthUnhealthyStateRouting],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be4a83073581dee1b1cf0551a797ee7759635e86ce25aaa224c7178d38a7b8ed(
    *,
    enable_unhealthy_connection_termination: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    unhealthy_draining_interval: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72416264362def055f8e74095168d0b8874b8368f23ea8e78b650a890ade2f5b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18170a03a4728abba67a7c20b2ec252394d2604f1e2658f1007c0b13cc56d7ff(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__320d7e03c1ae42b12ceda3bd5213c674b13bfc895fbbb1865c47c476da08171c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c4c043cb3a8b8f2d8e968928b7f5de0ac907bbfd85e259d6a1cf841ab2502c6(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2834d006257b2fe1015904e9cb0c39eb95a462455ce5239a7f0aa596ee554c43(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9cb294541ad1b68a43eeea4932a619cdf88adc8be9f88a0ef4c6dd436cf44afc(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AlbTargetGroupTargetHealthState]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e723fa0afdd465cd03f45209615c671d641abd5510e1254f704d9012e78eed9d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__374041c0bd4f587105b36cd772b05779a6462cd472ba464b1996b6169a72c4c3(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c931fa6b7d03c392d3b9691da6bf26ee6963d474add3a0d0b222be9c789f282(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4fd1013fba17a652a7ae0c989af49f7b463219a8de3ca17031bc290c61b43e61(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbTargetGroupTargetHealthState]],
) -> None:
    """Type checking stubs"""
    pass
