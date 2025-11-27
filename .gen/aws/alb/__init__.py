r'''
# `aws_alb`

Refer to the Terraform Registry for docs: [`aws_alb`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb).
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


class Alb(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.alb.Alb",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb aws_alb}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        access_logs: typing.Optional[typing.Union["AlbAccessLogs", typing.Dict[builtins.str, typing.Any]]] = None,
        client_keep_alive: typing.Optional[jsii.Number] = None,
        connection_logs: typing.Optional[typing.Union["AlbConnectionLogs", typing.Dict[builtins.str, typing.Any]]] = None,
        customer_owned_ipv4_pool: typing.Optional[builtins.str] = None,
        desync_mitigation_mode: typing.Optional[builtins.str] = None,
        dns_record_client_routing_policy: typing.Optional[builtins.str] = None,
        drop_invalid_header_fields: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_cross_zone_load_balancing: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_deletion_protection: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_http2: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_tls_version_and_cipher_suite_headers: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_waf_fail_open: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_xff_client_port: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_zonal_shift: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enforce_security_group_inbound_rules_on_private_link_traffic: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        idle_timeout: typing.Optional[jsii.Number] = None,
        internal: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        ip_address_type: typing.Optional[builtins.str] = None,
        ipam_pools: typing.Optional[typing.Union["AlbIpamPools", typing.Dict[builtins.str, typing.Any]]] = None,
        load_balancer_type: typing.Optional[builtins.str] = None,
        minimum_load_balancer_capacity: typing.Optional[typing.Union["AlbMinimumLoadBalancerCapacity", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        preserve_host_header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
        subnet_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AlbSubnetMapping", typing.Dict[builtins.str, typing.Any]]]]] = None,
        subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["AlbTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        xff_header_processing_mode: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb aws_alb} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param access_logs: access_logs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#access_logs Alb#access_logs}
        :param client_keep_alive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#client_keep_alive Alb#client_keep_alive}.
        :param connection_logs: connection_logs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#connection_logs Alb#connection_logs}
        :param customer_owned_ipv4_pool: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#customer_owned_ipv4_pool Alb#customer_owned_ipv4_pool}.
        :param desync_mitigation_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#desync_mitigation_mode Alb#desync_mitigation_mode}.
        :param dns_record_client_routing_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#dns_record_client_routing_policy Alb#dns_record_client_routing_policy}.
        :param drop_invalid_header_fields: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#drop_invalid_header_fields Alb#drop_invalid_header_fields}.
        :param enable_cross_zone_load_balancing: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_cross_zone_load_balancing Alb#enable_cross_zone_load_balancing}.
        :param enable_deletion_protection: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_deletion_protection Alb#enable_deletion_protection}.
        :param enable_http2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_http2 Alb#enable_http2}.
        :param enable_tls_version_and_cipher_suite_headers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_tls_version_and_cipher_suite_headers Alb#enable_tls_version_and_cipher_suite_headers}.
        :param enable_waf_fail_open: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_waf_fail_open Alb#enable_waf_fail_open}.
        :param enable_xff_client_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_xff_client_port Alb#enable_xff_client_port}.
        :param enable_zonal_shift: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_zonal_shift Alb#enable_zonal_shift}.
        :param enforce_security_group_inbound_rules_on_private_link_traffic: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enforce_security_group_inbound_rules_on_private_link_traffic Alb#enforce_security_group_inbound_rules_on_private_link_traffic}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#id Alb#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param idle_timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#idle_timeout Alb#idle_timeout}.
        :param internal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#internal Alb#internal}.
        :param ip_address_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ip_address_type Alb#ip_address_type}.
        :param ipam_pools: ipam_pools block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ipam_pools Alb#ipam_pools}
        :param load_balancer_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#load_balancer_type Alb#load_balancer_type}.
        :param minimum_load_balancer_capacity: minimum_load_balancer_capacity block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#minimum_load_balancer_capacity Alb#minimum_load_balancer_capacity}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#name Alb#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#name_prefix Alb#name_prefix}.
        :param preserve_host_header: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#preserve_host_header Alb#preserve_host_header}.
        :param security_groups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#security_groups Alb#security_groups}.
        :param subnet_mapping: subnet_mapping block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#subnet_mapping Alb#subnet_mapping}
        :param subnets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#subnets Alb#subnets}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#tags Alb#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#tags_all Alb#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#timeouts Alb#timeouts}
        :param xff_header_processing_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#xff_header_processing_mode Alb#xff_header_processing_mode}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc0172fdf08d24f62a469e8a09d95c0507f35c9aad462ec741ad9272e2dbeedf)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = AlbConfig(
            access_logs=access_logs,
            client_keep_alive=client_keep_alive,
            connection_logs=connection_logs,
            customer_owned_ipv4_pool=customer_owned_ipv4_pool,
            desync_mitigation_mode=desync_mitigation_mode,
            dns_record_client_routing_policy=dns_record_client_routing_policy,
            drop_invalid_header_fields=drop_invalid_header_fields,
            enable_cross_zone_load_balancing=enable_cross_zone_load_balancing,
            enable_deletion_protection=enable_deletion_protection,
            enable_http2=enable_http2,
            enable_tls_version_and_cipher_suite_headers=enable_tls_version_and_cipher_suite_headers,
            enable_waf_fail_open=enable_waf_fail_open,
            enable_xff_client_port=enable_xff_client_port,
            enable_zonal_shift=enable_zonal_shift,
            enforce_security_group_inbound_rules_on_private_link_traffic=enforce_security_group_inbound_rules_on_private_link_traffic,
            id=id,
            idle_timeout=idle_timeout,
            internal=internal,
            ip_address_type=ip_address_type,
            ipam_pools=ipam_pools,
            load_balancer_type=load_balancer_type,
            minimum_load_balancer_capacity=minimum_load_balancer_capacity,
            name=name,
            name_prefix=name_prefix,
            preserve_host_header=preserve_host_header,
            security_groups=security_groups,
            subnet_mapping=subnet_mapping,
            subnets=subnets,
            tags=tags,
            tags_all=tags_all,
            timeouts=timeouts,
            xff_header_processing_mode=xff_header_processing_mode,
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
        '''Generates CDKTF code for importing a Alb resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Alb to import.
        :param import_from_id: The id of the existing Alb that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Alb to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67beea051e880f55ffa3a9b60987634424088d0e01d365cce67bc0de10bb0451)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putAccessLogs")
    def put_access_logs(
        self,
        *,
        bucket: builtins.str,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#bucket Alb#bucket}.
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enabled Alb#enabled}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#prefix Alb#prefix}.
        '''
        value = AlbAccessLogs(bucket=bucket, enabled=enabled, prefix=prefix)

        return typing.cast(None, jsii.invoke(self, "putAccessLogs", [value]))

    @jsii.member(jsii_name="putConnectionLogs")
    def put_connection_logs(
        self,
        *,
        bucket: builtins.str,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#bucket Alb#bucket}.
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enabled Alb#enabled}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#prefix Alb#prefix}.
        '''
        value = AlbConnectionLogs(bucket=bucket, enabled=enabled, prefix=prefix)

        return typing.cast(None, jsii.invoke(self, "putConnectionLogs", [value]))

    @jsii.member(jsii_name="putIpamPools")
    def put_ipam_pools(self, *, ipv4_ipam_pool_id: builtins.str) -> None:
        '''
        :param ipv4_ipam_pool_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ipv4_ipam_pool_id Alb#ipv4_ipam_pool_id}.
        '''
        value = AlbIpamPools(ipv4_ipam_pool_id=ipv4_ipam_pool_id)

        return typing.cast(None, jsii.invoke(self, "putIpamPools", [value]))

    @jsii.member(jsii_name="putMinimumLoadBalancerCapacity")
    def put_minimum_load_balancer_capacity(
        self,
        *,
        capacity_units: jsii.Number,
    ) -> None:
        '''
        :param capacity_units: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#capacity_units Alb#capacity_units}.
        '''
        value = AlbMinimumLoadBalancerCapacity(capacity_units=capacity_units)

        return typing.cast(None, jsii.invoke(self, "putMinimumLoadBalancerCapacity", [value]))

    @jsii.member(jsii_name="putSubnetMapping")
    def put_subnet_mapping(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AlbSubnetMapping", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dd85f0c8e0166f3a1db108817107e47b92384f198195a2ee72d45c74a262b5a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSubnetMapping", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#create Alb#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#delete Alb#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#update Alb#update}.
        '''
        value = AlbTimeouts(create=create, delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetAccessLogs")
    def reset_access_logs(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccessLogs", []))

    @jsii.member(jsii_name="resetClientKeepAlive")
    def reset_client_keep_alive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetClientKeepAlive", []))

    @jsii.member(jsii_name="resetConnectionLogs")
    def reset_connection_logs(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConnectionLogs", []))

    @jsii.member(jsii_name="resetCustomerOwnedIpv4Pool")
    def reset_customer_owned_ipv4_pool(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomerOwnedIpv4Pool", []))

    @jsii.member(jsii_name="resetDesyncMitigationMode")
    def reset_desync_mitigation_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDesyncMitigationMode", []))

    @jsii.member(jsii_name="resetDnsRecordClientRoutingPolicy")
    def reset_dns_record_client_routing_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDnsRecordClientRoutingPolicy", []))

    @jsii.member(jsii_name="resetDropInvalidHeaderFields")
    def reset_drop_invalid_header_fields(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDropInvalidHeaderFields", []))

    @jsii.member(jsii_name="resetEnableCrossZoneLoadBalancing")
    def reset_enable_cross_zone_load_balancing(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableCrossZoneLoadBalancing", []))

    @jsii.member(jsii_name="resetEnableDeletionProtection")
    def reset_enable_deletion_protection(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableDeletionProtection", []))

    @jsii.member(jsii_name="resetEnableHttp2")
    def reset_enable_http2(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableHttp2", []))

    @jsii.member(jsii_name="resetEnableTlsVersionAndCipherSuiteHeaders")
    def reset_enable_tls_version_and_cipher_suite_headers(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableTlsVersionAndCipherSuiteHeaders", []))

    @jsii.member(jsii_name="resetEnableWafFailOpen")
    def reset_enable_waf_fail_open(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableWafFailOpen", []))

    @jsii.member(jsii_name="resetEnableXffClientPort")
    def reset_enable_xff_client_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableXffClientPort", []))

    @jsii.member(jsii_name="resetEnableZonalShift")
    def reset_enable_zonal_shift(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableZonalShift", []))

    @jsii.member(jsii_name="resetEnforceSecurityGroupInboundRulesOnPrivateLinkTraffic")
    def reset_enforce_security_group_inbound_rules_on_private_link_traffic(
        self,
    ) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnforceSecurityGroupInboundRulesOnPrivateLinkTraffic", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetIdleTimeout")
    def reset_idle_timeout(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdleTimeout", []))

    @jsii.member(jsii_name="resetInternal")
    def reset_internal(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInternal", []))

    @jsii.member(jsii_name="resetIpAddressType")
    def reset_ip_address_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIpAddressType", []))

    @jsii.member(jsii_name="resetIpamPools")
    def reset_ipam_pools(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIpamPools", []))

    @jsii.member(jsii_name="resetLoadBalancerType")
    def reset_load_balancer_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLoadBalancerType", []))

    @jsii.member(jsii_name="resetMinimumLoadBalancerCapacity")
    def reset_minimum_load_balancer_capacity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinimumLoadBalancerCapacity", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetNamePrefix")
    def reset_name_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNamePrefix", []))

    @jsii.member(jsii_name="resetPreserveHostHeader")
    def reset_preserve_host_header(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPreserveHostHeader", []))

    @jsii.member(jsii_name="resetSecurityGroups")
    def reset_security_groups(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityGroups", []))

    @jsii.member(jsii_name="resetSubnetMapping")
    def reset_subnet_mapping(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSubnetMapping", []))

    @jsii.member(jsii_name="resetSubnets")
    def reset_subnets(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSubnets", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTimeouts")
    def reset_timeouts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeouts", []))

    @jsii.member(jsii_name="resetXffHeaderProcessingMode")
    def reset_xff_header_processing_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetXffHeaderProcessingMode", []))

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
    @jsii.member(jsii_name="accessLogs")
    def access_logs(self) -> "AlbAccessLogsOutputReference":
        return typing.cast("AlbAccessLogsOutputReference", jsii.get(self, "accessLogs"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @builtins.property
    @jsii.member(jsii_name="arnSuffix")
    def arn_suffix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arnSuffix"))

    @builtins.property
    @jsii.member(jsii_name="connectionLogs")
    def connection_logs(self) -> "AlbConnectionLogsOutputReference":
        return typing.cast("AlbConnectionLogsOutputReference", jsii.get(self, "connectionLogs"))

    @builtins.property
    @jsii.member(jsii_name="dnsName")
    def dns_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dnsName"))

    @builtins.property
    @jsii.member(jsii_name="ipamPools")
    def ipam_pools(self) -> "AlbIpamPoolsOutputReference":
        return typing.cast("AlbIpamPoolsOutputReference", jsii.get(self, "ipamPools"))

    @builtins.property
    @jsii.member(jsii_name="minimumLoadBalancerCapacity")
    def minimum_load_balancer_capacity(
        self,
    ) -> "AlbMinimumLoadBalancerCapacityOutputReference":
        return typing.cast("AlbMinimumLoadBalancerCapacityOutputReference", jsii.get(self, "minimumLoadBalancerCapacity"))

    @builtins.property
    @jsii.member(jsii_name="subnetMapping")
    def subnet_mapping(self) -> "AlbSubnetMappingList":
        return typing.cast("AlbSubnetMappingList", jsii.get(self, "subnetMapping"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "AlbTimeoutsOutputReference":
        return typing.cast("AlbTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="vpcId")
    def vpc_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vpcId"))

    @builtins.property
    @jsii.member(jsii_name="zoneId")
    def zone_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "zoneId"))

    @builtins.property
    @jsii.member(jsii_name="accessLogsInput")
    def access_logs_input(self) -> typing.Optional["AlbAccessLogs"]:
        return typing.cast(typing.Optional["AlbAccessLogs"], jsii.get(self, "accessLogsInput"))

    @builtins.property
    @jsii.member(jsii_name="clientKeepAliveInput")
    def client_keep_alive_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "clientKeepAliveInput"))

    @builtins.property
    @jsii.member(jsii_name="connectionLogsInput")
    def connection_logs_input(self) -> typing.Optional["AlbConnectionLogs"]:
        return typing.cast(typing.Optional["AlbConnectionLogs"], jsii.get(self, "connectionLogsInput"))

    @builtins.property
    @jsii.member(jsii_name="customerOwnedIpv4PoolInput")
    def customer_owned_ipv4_pool_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "customerOwnedIpv4PoolInput"))

    @builtins.property
    @jsii.member(jsii_name="desyncMitigationModeInput")
    def desync_mitigation_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "desyncMitigationModeInput"))

    @builtins.property
    @jsii.member(jsii_name="dnsRecordClientRoutingPolicyInput")
    def dns_record_client_routing_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dnsRecordClientRoutingPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="dropInvalidHeaderFieldsInput")
    def drop_invalid_header_fields_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "dropInvalidHeaderFieldsInput"))

    @builtins.property
    @jsii.member(jsii_name="enableCrossZoneLoadBalancingInput")
    def enable_cross_zone_load_balancing_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableCrossZoneLoadBalancingInput"))

    @builtins.property
    @jsii.member(jsii_name="enableDeletionProtectionInput")
    def enable_deletion_protection_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableDeletionProtectionInput"))

    @builtins.property
    @jsii.member(jsii_name="enableHttp2Input")
    def enable_http2_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableHttp2Input"))

    @builtins.property
    @jsii.member(jsii_name="enableTlsVersionAndCipherSuiteHeadersInput")
    def enable_tls_version_and_cipher_suite_headers_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableTlsVersionAndCipherSuiteHeadersInput"))

    @builtins.property
    @jsii.member(jsii_name="enableWafFailOpenInput")
    def enable_waf_fail_open_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableWafFailOpenInput"))

    @builtins.property
    @jsii.member(jsii_name="enableXffClientPortInput")
    def enable_xff_client_port_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableXffClientPortInput"))

    @builtins.property
    @jsii.member(jsii_name="enableZonalShiftInput")
    def enable_zonal_shift_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableZonalShiftInput"))

    @builtins.property
    @jsii.member(jsii_name="enforceSecurityGroupInboundRulesOnPrivateLinkTrafficInput")
    def enforce_security_group_inbound_rules_on_private_link_traffic_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "enforceSecurityGroupInboundRulesOnPrivateLinkTrafficInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="idleTimeoutInput")
    def idle_timeout_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "idleTimeoutInput"))

    @builtins.property
    @jsii.member(jsii_name="internalInput")
    def internal_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "internalInput"))

    @builtins.property
    @jsii.member(jsii_name="ipAddressTypeInput")
    def ip_address_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ipAddressTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="ipamPoolsInput")
    def ipam_pools_input(self) -> typing.Optional["AlbIpamPools"]:
        return typing.cast(typing.Optional["AlbIpamPools"], jsii.get(self, "ipamPoolsInput"))

    @builtins.property
    @jsii.member(jsii_name="loadBalancerTypeInput")
    def load_balancer_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "loadBalancerTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="minimumLoadBalancerCapacityInput")
    def minimum_load_balancer_capacity_input(
        self,
    ) -> typing.Optional["AlbMinimumLoadBalancerCapacity"]:
        return typing.cast(typing.Optional["AlbMinimumLoadBalancerCapacity"], jsii.get(self, "minimumLoadBalancerCapacityInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="namePrefixInput")
    def name_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "namePrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="preserveHostHeaderInput")
    def preserve_host_header_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "preserveHostHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="securityGroupsInput")
    def security_groups_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "securityGroupsInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetMappingInput")
    def subnet_mapping_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AlbSubnetMapping"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AlbSubnetMapping"]]], jsii.get(self, "subnetMappingInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetsInput")
    def subnets_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "subnetsInput"))

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
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "AlbTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "AlbTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="xffHeaderProcessingModeInput")
    def xff_header_processing_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "xffHeaderProcessingModeInput"))

    @builtins.property
    @jsii.member(jsii_name="clientKeepAlive")
    def client_keep_alive(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "clientKeepAlive"))

    @client_keep_alive.setter
    def client_keep_alive(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d2bc031276dabe1abc849620f9cd067f1d3dbdac6b1521251f2d4fab294c32e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "clientKeepAlive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="customerOwnedIpv4Pool")
    def customer_owned_ipv4_pool(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "customerOwnedIpv4Pool"))

    @customer_owned_ipv4_pool.setter
    def customer_owned_ipv4_pool(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a14fbebcacc4455d31df759dc8ee1ddac8a91d98fc81211038d4a10eade9a3b1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "customerOwnedIpv4Pool", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="desyncMitigationMode")
    def desync_mitigation_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "desyncMitigationMode"))

    @desync_mitigation_mode.setter
    def desync_mitigation_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9aa4dafa60455452d86feff67523e8cfeb705cefa1d41051b502d3219724e9c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "desyncMitigationMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dnsRecordClientRoutingPolicy")
    def dns_record_client_routing_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dnsRecordClientRoutingPolicy"))

    @dns_record_client_routing_policy.setter
    def dns_record_client_routing_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6cb6a82833dac94cf608fdc950cfc74ed0e001bac080e425bc20652d2a141bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dnsRecordClientRoutingPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dropInvalidHeaderFields")
    def drop_invalid_header_fields(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "dropInvalidHeaderFields"))

    @drop_invalid_header_fields.setter
    def drop_invalid_header_fields(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__076207156ec6e1c2fd73f7c189449a3045831ced97c960f0d01eb782556cfa67)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dropInvalidHeaderFields", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enableCrossZoneLoadBalancing")
    def enable_cross_zone_load_balancing(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableCrossZoneLoadBalancing"))

    @enable_cross_zone_load_balancing.setter
    def enable_cross_zone_load_balancing(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__39d7d3114d7e7fd80770301088ccc661d805e1e8482c2984eb81d6ebe40a81fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableCrossZoneLoadBalancing", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enableDeletionProtection")
    def enable_deletion_protection(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableDeletionProtection"))

    @enable_deletion_protection.setter
    def enable_deletion_protection(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a043a7b71be73fb05bbcda6324db47d51d9b82f80548a05291f955ec3ff7d99)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableDeletionProtection", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enableHttp2")
    def enable_http2(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableHttp2"))

    @enable_http2.setter
    def enable_http2(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8829587428504479e0dbc501802f518ea6419f1c58be4e8aaf1b1f0bbf5c8818)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableHttp2", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enableTlsVersionAndCipherSuiteHeaders")
    def enable_tls_version_and_cipher_suite_headers(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableTlsVersionAndCipherSuiteHeaders"))

    @enable_tls_version_and_cipher_suite_headers.setter
    def enable_tls_version_and_cipher_suite_headers(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e15a5457861558c368e38046198b00fec1964d00e1ddc3755856284a124460d7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableTlsVersionAndCipherSuiteHeaders", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enableWafFailOpen")
    def enable_waf_fail_open(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableWafFailOpen"))

    @enable_waf_fail_open.setter
    def enable_waf_fail_open(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a8c81ebdb242cb554d20f7b4109034afd01abf3e4c2a0d46d55f8ecc3d880558)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableWafFailOpen", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enableXffClientPort")
    def enable_xff_client_port(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableXffClientPort"))

    @enable_xff_client_port.setter
    def enable_xff_client_port(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__367c3788c29a96a6f9d44b5b2dc41ec83f3efb6228eea9b41781ec15bc3b43d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableXffClientPort", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enableZonalShift")
    def enable_zonal_shift(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableZonalShift"))

    @enable_zonal_shift.setter
    def enable_zonal_shift(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1680aeb1eaf782ef6e5316421769066505cf96b7332fa94752d04a18ae723c79)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableZonalShift", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enforceSecurityGroupInboundRulesOnPrivateLinkTraffic")
    def enforce_security_group_inbound_rules_on_private_link_traffic(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "enforceSecurityGroupInboundRulesOnPrivateLinkTraffic"))

    @enforce_security_group_inbound_rules_on_private_link_traffic.setter
    def enforce_security_group_inbound_rules_on_private_link_traffic(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e3adb0214993dec148e82860faf165bd62b888f94c0e1ca594e3244a0b16b99e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enforceSecurityGroupInboundRulesOnPrivateLinkTraffic", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61dc694b1e58f61c45759997a9b20b1ae062eb8abb2b77acbe2146469e2e5e77)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="idleTimeout")
    def idle_timeout(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "idleTimeout"))

    @idle_timeout.setter
    def idle_timeout(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd4da834e064feebd383e42d2def8d0b956493cecd55fcf9ffd719f8d476fb37)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "idleTimeout", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internal")
    def internal(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "internal"))

    @internal.setter
    def internal(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b1752d9030f88a3ae9940b638de3b0ad0e7455b4b02a9cefbd3a01869a97e0f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internal", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ipAddressType")
    def ip_address_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ipAddressType"))

    @ip_address_type.setter
    def ip_address_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0d9a5a18ed2a29d2d113ee96397c1e72107c0aa8c2f4edbfa2d95d8b278320f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ipAddressType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="loadBalancerType")
    def load_balancer_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "loadBalancerType"))

    @load_balancer_type.setter
    def load_balancer_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6285d5f798060046c5296fbb118070ed3c0347ec2afa4a2a731061d1982e9042)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "loadBalancerType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__922c741a018db2a1b5a6515015d7700c94705f0e566810efe2b83a749645aeee)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="namePrefix")
    def name_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "namePrefix"))

    @name_prefix.setter
    def name_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f82ee69cfb74b01af4f14afecf061e418a76fe500fc900e9f1c6161bb1e060ea)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "namePrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="preserveHostHeader")
    def preserve_host_header(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "preserveHostHeader"))

    @preserve_host_header.setter
    def preserve_host_header(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca1c196de57a59f46101cc1bb5360c9196277e0e2ebbd4ad77e7089a7332d110)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "preserveHostHeader", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="securityGroups")
    def security_groups(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "securityGroups"))

    @security_groups.setter
    def security_groups(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f18c81b21fc50931f1c73c8df52b692427d0ca7eb427f425a2c08145cfbed385)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityGroups", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnets")
    def subnets(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "subnets"))

    @subnets.setter
    def subnets(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__80563b54fd48f866a2255a78d2b9f9e0fc550a8eeec008e853af4fcecc30b319)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnets", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a0f0a875dae86b5c022ab93e0d61e46af6a001d4474e8dc42f9a1f5a55381355)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d20479c6f26acd0ed54e50bcf95043c42733fa6fce8f4f81ab040cce7f7e8ca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="xffHeaderProcessingMode")
    def xff_header_processing_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "xffHeaderProcessingMode"))

    @xff_header_processing_mode.setter
    def xff_header_processing_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1346ec088215212c6f61a1adea1d18b9f5ec7ddc0a5ba5f9393faaaabd56036)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "xffHeaderProcessingMode", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.alb.AlbAccessLogs",
    jsii_struct_bases=[],
    name_mapping={"bucket": "bucket", "enabled": "enabled", "prefix": "prefix"},
)
class AlbAccessLogs:
    def __init__(
        self,
        *,
        bucket: builtins.str,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#bucket Alb#bucket}.
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enabled Alb#enabled}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#prefix Alb#prefix}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e65b800dab182606536afb050efa06ef4f7b04317b3522614daa7acd24bf4967)
            check_type(argname="argument bucket", value=bucket, expected_type=type_hints["bucket"])
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "bucket": bucket,
        }
        if enabled is not None:
            self._values["enabled"] = enabled
        if prefix is not None:
            self._values["prefix"] = prefix

    @builtins.property
    def bucket(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#bucket Alb#bucket}.'''
        result = self._values.get("bucket")
        assert result is not None, "Required property 'bucket' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enabled Alb#enabled}.'''
        result = self._values.get("enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#prefix Alb#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbAccessLogs(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AlbAccessLogsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.alb.AlbAccessLogsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cdc461703b4d023cf6cf41793ec952f4c6fac19a023bb7b27568b84cbbadb3c6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetEnabled")
    def reset_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnabled", []))

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @builtins.property
    @jsii.member(jsii_name="bucketInput")
    def bucket_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bucketInput"))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="bucket")
    def bucket(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucket"))

    @bucket.setter
    def bucket(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb1a94f515f7869a7db847b5ed6b16d204fa597457cc54ad1fb2b4752259f54b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bucket", value) # pyright: ignore[reportArgumentType]

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
            type_hints = typing.get_type_hints(_typecheckingstub__c0b2231aaf4b6e0655c682f6b906904efeead7d8c93c9cebf27ee6ed74f4febf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d0e2a0308ad01e1adcfa2867aab4309a4a3da55a68136968a16d975e2a5ee94)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AlbAccessLogs]:
        return typing.cast(typing.Optional[AlbAccessLogs], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[AlbAccessLogs]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc41eaf165d1d3d722cb616aaf47a10632b1c0a2a84044d4a5b3f0faf8d035fe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.alb.AlbConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "access_logs": "accessLogs",
        "client_keep_alive": "clientKeepAlive",
        "connection_logs": "connectionLogs",
        "customer_owned_ipv4_pool": "customerOwnedIpv4Pool",
        "desync_mitigation_mode": "desyncMitigationMode",
        "dns_record_client_routing_policy": "dnsRecordClientRoutingPolicy",
        "drop_invalid_header_fields": "dropInvalidHeaderFields",
        "enable_cross_zone_load_balancing": "enableCrossZoneLoadBalancing",
        "enable_deletion_protection": "enableDeletionProtection",
        "enable_http2": "enableHttp2",
        "enable_tls_version_and_cipher_suite_headers": "enableTlsVersionAndCipherSuiteHeaders",
        "enable_waf_fail_open": "enableWafFailOpen",
        "enable_xff_client_port": "enableXffClientPort",
        "enable_zonal_shift": "enableZonalShift",
        "enforce_security_group_inbound_rules_on_private_link_traffic": "enforceSecurityGroupInboundRulesOnPrivateLinkTraffic",
        "id": "id",
        "idle_timeout": "idleTimeout",
        "internal": "internal",
        "ip_address_type": "ipAddressType",
        "ipam_pools": "ipamPools",
        "load_balancer_type": "loadBalancerType",
        "minimum_load_balancer_capacity": "minimumLoadBalancerCapacity",
        "name": "name",
        "name_prefix": "namePrefix",
        "preserve_host_header": "preserveHostHeader",
        "security_groups": "securityGroups",
        "subnet_mapping": "subnetMapping",
        "subnets": "subnets",
        "tags": "tags",
        "tags_all": "tagsAll",
        "timeouts": "timeouts",
        "xff_header_processing_mode": "xffHeaderProcessingMode",
    },
)
class AlbConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        access_logs: typing.Optional[typing.Union[AlbAccessLogs, typing.Dict[builtins.str, typing.Any]]] = None,
        client_keep_alive: typing.Optional[jsii.Number] = None,
        connection_logs: typing.Optional[typing.Union["AlbConnectionLogs", typing.Dict[builtins.str, typing.Any]]] = None,
        customer_owned_ipv4_pool: typing.Optional[builtins.str] = None,
        desync_mitigation_mode: typing.Optional[builtins.str] = None,
        dns_record_client_routing_policy: typing.Optional[builtins.str] = None,
        drop_invalid_header_fields: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_cross_zone_load_balancing: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_deletion_protection: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_http2: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_tls_version_and_cipher_suite_headers: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_waf_fail_open: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_xff_client_port: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_zonal_shift: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enforce_security_group_inbound_rules_on_private_link_traffic: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        idle_timeout: typing.Optional[jsii.Number] = None,
        internal: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        ip_address_type: typing.Optional[builtins.str] = None,
        ipam_pools: typing.Optional[typing.Union["AlbIpamPools", typing.Dict[builtins.str, typing.Any]]] = None,
        load_balancer_type: typing.Optional[builtins.str] = None,
        minimum_load_balancer_capacity: typing.Optional[typing.Union["AlbMinimumLoadBalancerCapacity", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        preserve_host_header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
        subnet_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["AlbSubnetMapping", typing.Dict[builtins.str, typing.Any]]]]] = None,
        subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["AlbTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        xff_header_processing_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param access_logs: access_logs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#access_logs Alb#access_logs}
        :param client_keep_alive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#client_keep_alive Alb#client_keep_alive}.
        :param connection_logs: connection_logs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#connection_logs Alb#connection_logs}
        :param customer_owned_ipv4_pool: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#customer_owned_ipv4_pool Alb#customer_owned_ipv4_pool}.
        :param desync_mitigation_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#desync_mitigation_mode Alb#desync_mitigation_mode}.
        :param dns_record_client_routing_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#dns_record_client_routing_policy Alb#dns_record_client_routing_policy}.
        :param drop_invalid_header_fields: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#drop_invalid_header_fields Alb#drop_invalid_header_fields}.
        :param enable_cross_zone_load_balancing: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_cross_zone_load_balancing Alb#enable_cross_zone_load_balancing}.
        :param enable_deletion_protection: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_deletion_protection Alb#enable_deletion_protection}.
        :param enable_http2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_http2 Alb#enable_http2}.
        :param enable_tls_version_and_cipher_suite_headers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_tls_version_and_cipher_suite_headers Alb#enable_tls_version_and_cipher_suite_headers}.
        :param enable_waf_fail_open: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_waf_fail_open Alb#enable_waf_fail_open}.
        :param enable_xff_client_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_xff_client_port Alb#enable_xff_client_port}.
        :param enable_zonal_shift: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_zonal_shift Alb#enable_zonal_shift}.
        :param enforce_security_group_inbound_rules_on_private_link_traffic: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enforce_security_group_inbound_rules_on_private_link_traffic Alb#enforce_security_group_inbound_rules_on_private_link_traffic}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#id Alb#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param idle_timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#idle_timeout Alb#idle_timeout}.
        :param internal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#internal Alb#internal}.
        :param ip_address_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ip_address_type Alb#ip_address_type}.
        :param ipam_pools: ipam_pools block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ipam_pools Alb#ipam_pools}
        :param load_balancer_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#load_balancer_type Alb#load_balancer_type}.
        :param minimum_load_balancer_capacity: minimum_load_balancer_capacity block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#minimum_load_balancer_capacity Alb#minimum_load_balancer_capacity}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#name Alb#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#name_prefix Alb#name_prefix}.
        :param preserve_host_header: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#preserve_host_header Alb#preserve_host_header}.
        :param security_groups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#security_groups Alb#security_groups}.
        :param subnet_mapping: subnet_mapping block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#subnet_mapping Alb#subnet_mapping}
        :param subnets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#subnets Alb#subnets}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#tags Alb#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#tags_all Alb#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#timeouts Alb#timeouts}
        :param xff_header_processing_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#xff_header_processing_mode Alb#xff_header_processing_mode}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(access_logs, dict):
            access_logs = AlbAccessLogs(**access_logs)
        if isinstance(connection_logs, dict):
            connection_logs = AlbConnectionLogs(**connection_logs)
        if isinstance(ipam_pools, dict):
            ipam_pools = AlbIpamPools(**ipam_pools)
        if isinstance(minimum_load_balancer_capacity, dict):
            minimum_load_balancer_capacity = AlbMinimumLoadBalancerCapacity(**minimum_load_balancer_capacity)
        if isinstance(timeouts, dict):
            timeouts = AlbTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d69b3faf77c12e5ec62aa1d0984a49bdcb43402e582ebd102b286e7bb26fcb74)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument access_logs", value=access_logs, expected_type=type_hints["access_logs"])
            check_type(argname="argument client_keep_alive", value=client_keep_alive, expected_type=type_hints["client_keep_alive"])
            check_type(argname="argument connection_logs", value=connection_logs, expected_type=type_hints["connection_logs"])
            check_type(argname="argument customer_owned_ipv4_pool", value=customer_owned_ipv4_pool, expected_type=type_hints["customer_owned_ipv4_pool"])
            check_type(argname="argument desync_mitigation_mode", value=desync_mitigation_mode, expected_type=type_hints["desync_mitigation_mode"])
            check_type(argname="argument dns_record_client_routing_policy", value=dns_record_client_routing_policy, expected_type=type_hints["dns_record_client_routing_policy"])
            check_type(argname="argument drop_invalid_header_fields", value=drop_invalid_header_fields, expected_type=type_hints["drop_invalid_header_fields"])
            check_type(argname="argument enable_cross_zone_load_balancing", value=enable_cross_zone_load_balancing, expected_type=type_hints["enable_cross_zone_load_balancing"])
            check_type(argname="argument enable_deletion_protection", value=enable_deletion_protection, expected_type=type_hints["enable_deletion_protection"])
            check_type(argname="argument enable_http2", value=enable_http2, expected_type=type_hints["enable_http2"])
            check_type(argname="argument enable_tls_version_and_cipher_suite_headers", value=enable_tls_version_and_cipher_suite_headers, expected_type=type_hints["enable_tls_version_and_cipher_suite_headers"])
            check_type(argname="argument enable_waf_fail_open", value=enable_waf_fail_open, expected_type=type_hints["enable_waf_fail_open"])
            check_type(argname="argument enable_xff_client_port", value=enable_xff_client_port, expected_type=type_hints["enable_xff_client_port"])
            check_type(argname="argument enable_zonal_shift", value=enable_zonal_shift, expected_type=type_hints["enable_zonal_shift"])
            check_type(argname="argument enforce_security_group_inbound_rules_on_private_link_traffic", value=enforce_security_group_inbound_rules_on_private_link_traffic, expected_type=type_hints["enforce_security_group_inbound_rules_on_private_link_traffic"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument idle_timeout", value=idle_timeout, expected_type=type_hints["idle_timeout"])
            check_type(argname="argument internal", value=internal, expected_type=type_hints["internal"])
            check_type(argname="argument ip_address_type", value=ip_address_type, expected_type=type_hints["ip_address_type"])
            check_type(argname="argument ipam_pools", value=ipam_pools, expected_type=type_hints["ipam_pools"])
            check_type(argname="argument load_balancer_type", value=load_balancer_type, expected_type=type_hints["load_balancer_type"])
            check_type(argname="argument minimum_load_balancer_capacity", value=minimum_load_balancer_capacity, expected_type=type_hints["minimum_load_balancer_capacity"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument name_prefix", value=name_prefix, expected_type=type_hints["name_prefix"])
            check_type(argname="argument preserve_host_header", value=preserve_host_header, expected_type=type_hints["preserve_host_header"])
            check_type(argname="argument security_groups", value=security_groups, expected_type=type_hints["security_groups"])
            check_type(argname="argument subnet_mapping", value=subnet_mapping, expected_type=type_hints["subnet_mapping"])
            check_type(argname="argument subnets", value=subnets, expected_type=type_hints["subnets"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
            check_type(argname="argument xff_header_processing_mode", value=xff_header_processing_mode, expected_type=type_hints["xff_header_processing_mode"])
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
        if access_logs is not None:
            self._values["access_logs"] = access_logs
        if client_keep_alive is not None:
            self._values["client_keep_alive"] = client_keep_alive
        if connection_logs is not None:
            self._values["connection_logs"] = connection_logs
        if customer_owned_ipv4_pool is not None:
            self._values["customer_owned_ipv4_pool"] = customer_owned_ipv4_pool
        if desync_mitigation_mode is not None:
            self._values["desync_mitigation_mode"] = desync_mitigation_mode
        if dns_record_client_routing_policy is not None:
            self._values["dns_record_client_routing_policy"] = dns_record_client_routing_policy
        if drop_invalid_header_fields is not None:
            self._values["drop_invalid_header_fields"] = drop_invalid_header_fields
        if enable_cross_zone_load_balancing is not None:
            self._values["enable_cross_zone_load_balancing"] = enable_cross_zone_load_balancing
        if enable_deletion_protection is not None:
            self._values["enable_deletion_protection"] = enable_deletion_protection
        if enable_http2 is not None:
            self._values["enable_http2"] = enable_http2
        if enable_tls_version_and_cipher_suite_headers is not None:
            self._values["enable_tls_version_and_cipher_suite_headers"] = enable_tls_version_and_cipher_suite_headers
        if enable_waf_fail_open is not None:
            self._values["enable_waf_fail_open"] = enable_waf_fail_open
        if enable_xff_client_port is not None:
            self._values["enable_xff_client_port"] = enable_xff_client_port
        if enable_zonal_shift is not None:
            self._values["enable_zonal_shift"] = enable_zonal_shift
        if enforce_security_group_inbound_rules_on_private_link_traffic is not None:
            self._values["enforce_security_group_inbound_rules_on_private_link_traffic"] = enforce_security_group_inbound_rules_on_private_link_traffic
        if id is not None:
            self._values["id"] = id
        if idle_timeout is not None:
            self._values["idle_timeout"] = idle_timeout
        if internal is not None:
            self._values["internal"] = internal
        if ip_address_type is not None:
            self._values["ip_address_type"] = ip_address_type
        if ipam_pools is not None:
            self._values["ipam_pools"] = ipam_pools
        if load_balancer_type is not None:
            self._values["load_balancer_type"] = load_balancer_type
        if minimum_load_balancer_capacity is not None:
            self._values["minimum_load_balancer_capacity"] = minimum_load_balancer_capacity
        if name is not None:
            self._values["name"] = name
        if name_prefix is not None:
            self._values["name_prefix"] = name_prefix
        if preserve_host_header is not None:
            self._values["preserve_host_header"] = preserve_host_header
        if security_groups is not None:
            self._values["security_groups"] = security_groups
        if subnet_mapping is not None:
            self._values["subnet_mapping"] = subnet_mapping
        if subnets is not None:
            self._values["subnets"] = subnets
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if timeouts is not None:
            self._values["timeouts"] = timeouts
        if xff_header_processing_mode is not None:
            self._values["xff_header_processing_mode"] = xff_header_processing_mode

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
    def access_logs(self) -> typing.Optional[AlbAccessLogs]:
        '''access_logs block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#access_logs Alb#access_logs}
        '''
        result = self._values.get("access_logs")
        return typing.cast(typing.Optional[AlbAccessLogs], result)

    @builtins.property
    def client_keep_alive(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#client_keep_alive Alb#client_keep_alive}.'''
        result = self._values.get("client_keep_alive")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def connection_logs(self) -> typing.Optional["AlbConnectionLogs"]:
        '''connection_logs block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#connection_logs Alb#connection_logs}
        '''
        result = self._values.get("connection_logs")
        return typing.cast(typing.Optional["AlbConnectionLogs"], result)

    @builtins.property
    def customer_owned_ipv4_pool(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#customer_owned_ipv4_pool Alb#customer_owned_ipv4_pool}.'''
        result = self._values.get("customer_owned_ipv4_pool")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def desync_mitigation_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#desync_mitigation_mode Alb#desync_mitigation_mode}.'''
        result = self._values.get("desync_mitigation_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def dns_record_client_routing_policy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#dns_record_client_routing_policy Alb#dns_record_client_routing_policy}.'''
        result = self._values.get("dns_record_client_routing_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def drop_invalid_header_fields(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#drop_invalid_header_fields Alb#drop_invalid_header_fields}.'''
        result = self._values.get("drop_invalid_header_fields")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_cross_zone_load_balancing(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_cross_zone_load_balancing Alb#enable_cross_zone_load_balancing}.'''
        result = self._values.get("enable_cross_zone_load_balancing")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_deletion_protection(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_deletion_protection Alb#enable_deletion_protection}.'''
        result = self._values.get("enable_deletion_protection")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_http2(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_http2 Alb#enable_http2}.'''
        result = self._values.get("enable_http2")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_tls_version_and_cipher_suite_headers(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_tls_version_and_cipher_suite_headers Alb#enable_tls_version_and_cipher_suite_headers}.'''
        result = self._values.get("enable_tls_version_and_cipher_suite_headers")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_waf_fail_open(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_waf_fail_open Alb#enable_waf_fail_open}.'''
        result = self._values.get("enable_waf_fail_open")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_xff_client_port(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_xff_client_port Alb#enable_xff_client_port}.'''
        result = self._values.get("enable_xff_client_port")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_zonal_shift(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enable_zonal_shift Alb#enable_zonal_shift}.'''
        result = self._values.get("enable_zonal_shift")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enforce_security_group_inbound_rules_on_private_link_traffic(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enforce_security_group_inbound_rules_on_private_link_traffic Alb#enforce_security_group_inbound_rules_on_private_link_traffic}.'''
        result = self._values.get("enforce_security_group_inbound_rules_on_private_link_traffic")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#id Alb#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def idle_timeout(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#idle_timeout Alb#idle_timeout}.'''
        result = self._values.get("idle_timeout")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def internal(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#internal Alb#internal}.'''
        result = self._values.get("internal")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def ip_address_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ip_address_type Alb#ip_address_type}.'''
        result = self._values.get("ip_address_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ipam_pools(self) -> typing.Optional["AlbIpamPools"]:
        '''ipam_pools block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ipam_pools Alb#ipam_pools}
        '''
        result = self._values.get("ipam_pools")
        return typing.cast(typing.Optional["AlbIpamPools"], result)

    @builtins.property
    def load_balancer_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#load_balancer_type Alb#load_balancer_type}.'''
        result = self._values.get("load_balancer_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def minimum_load_balancer_capacity(
        self,
    ) -> typing.Optional["AlbMinimumLoadBalancerCapacity"]:
        '''minimum_load_balancer_capacity block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#minimum_load_balancer_capacity Alb#minimum_load_balancer_capacity}
        '''
        result = self._values.get("minimum_load_balancer_capacity")
        return typing.cast(typing.Optional["AlbMinimumLoadBalancerCapacity"], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#name Alb#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#name_prefix Alb#name_prefix}.'''
        result = self._values.get("name_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def preserve_host_header(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#preserve_host_header Alb#preserve_host_header}.'''
        result = self._values.get("preserve_host_header")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def security_groups(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#security_groups Alb#security_groups}.'''
        result = self._values.get("security_groups")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def subnet_mapping(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AlbSubnetMapping"]]]:
        '''subnet_mapping block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#subnet_mapping Alb#subnet_mapping}
        '''
        result = self._values.get("subnet_mapping")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["AlbSubnetMapping"]]], result)

    @builtins.property
    def subnets(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#subnets Alb#subnets}.'''
        result = self._values.get("subnets")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#tags Alb#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#tags_all Alb#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["AlbTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#timeouts Alb#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["AlbTimeouts"], result)

    @builtins.property
    def xff_header_processing_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#xff_header_processing_mode Alb#xff_header_processing_mode}.'''
        result = self._values.get("xff_header_processing_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.alb.AlbConnectionLogs",
    jsii_struct_bases=[],
    name_mapping={"bucket": "bucket", "enabled": "enabled", "prefix": "prefix"},
)
class AlbConnectionLogs:
    def __init__(
        self,
        *,
        bucket: builtins.str,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#bucket Alb#bucket}.
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enabled Alb#enabled}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#prefix Alb#prefix}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75fb30c79c30d20348e0d313a04b4ded36f227183e23399249d34cbae794c7a7)
            check_type(argname="argument bucket", value=bucket, expected_type=type_hints["bucket"])
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "bucket": bucket,
        }
        if enabled is not None:
            self._values["enabled"] = enabled
        if prefix is not None:
            self._values["prefix"] = prefix

    @builtins.property
    def bucket(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#bucket Alb#bucket}.'''
        result = self._values.get("bucket")
        assert result is not None, "Required property 'bucket' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#enabled Alb#enabled}.'''
        result = self._values.get("enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#prefix Alb#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbConnectionLogs(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AlbConnectionLogsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.alb.AlbConnectionLogsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e7d214d9ea909b6e25779c80a81abd2caef0889a27a07cf1998a22e3860ca6dc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetEnabled")
    def reset_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnabled", []))

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @builtins.property
    @jsii.member(jsii_name="bucketInput")
    def bucket_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bucketInput"))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="bucket")
    def bucket(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucket"))

    @bucket.setter
    def bucket(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f03413a5b3500f83add86315811faf8a297fdf59ffae6790a19e748712906007)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bucket", value) # pyright: ignore[reportArgumentType]

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
            type_hints = typing.get_type_hints(_typecheckingstub__22926c59494fe02439131b4d46642da64550d1587b5d1adeb533e233b828eeaf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9f9cdb2d7735b1ba48c12e3bd4b4e1670bf013065dcd1ce015e53627a268c594)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AlbConnectionLogs]:
        return typing.cast(typing.Optional[AlbConnectionLogs], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[AlbConnectionLogs]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c463194b398dbb32f7a78e89351cb617cc00e8cd50a652f58546c0d1dbb9adc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.alb.AlbIpamPools",
    jsii_struct_bases=[],
    name_mapping={"ipv4_ipam_pool_id": "ipv4IpamPoolId"},
)
class AlbIpamPools:
    def __init__(self, *, ipv4_ipam_pool_id: builtins.str) -> None:
        '''
        :param ipv4_ipam_pool_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ipv4_ipam_pool_id Alb#ipv4_ipam_pool_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a5d6d9589f4bcff1c9e800b1caebb4e1e066749d655ef6e059a89ee5ff70fcbe)
            check_type(argname="argument ipv4_ipam_pool_id", value=ipv4_ipam_pool_id, expected_type=type_hints["ipv4_ipam_pool_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "ipv4_ipam_pool_id": ipv4_ipam_pool_id,
        }

    @builtins.property
    def ipv4_ipam_pool_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ipv4_ipam_pool_id Alb#ipv4_ipam_pool_id}.'''
        result = self._values.get("ipv4_ipam_pool_id")
        assert result is not None, "Required property 'ipv4_ipam_pool_id' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbIpamPools(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AlbIpamPoolsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.alb.AlbIpamPoolsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f51a331a54ae284ef491200cad2903b7b3e3efe127efd27d10666772adbec422)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="ipv4IpamPoolIdInput")
    def ipv4_ipam_pool_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ipv4IpamPoolIdInput"))

    @builtins.property
    @jsii.member(jsii_name="ipv4IpamPoolId")
    def ipv4_ipam_pool_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ipv4IpamPoolId"))

    @ipv4_ipam_pool_id.setter
    def ipv4_ipam_pool_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2c388493abd801ed52bddeff8514926a4ba98f15950a5d05ed523cd63402aba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ipv4IpamPoolId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AlbIpamPools]:
        return typing.cast(typing.Optional[AlbIpamPools], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[AlbIpamPools]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4b89c761a4b50aeeb798d2dd0838de6245881205b858c6aec0eeda5783869bc9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.alb.AlbMinimumLoadBalancerCapacity",
    jsii_struct_bases=[],
    name_mapping={"capacity_units": "capacityUnits"},
)
class AlbMinimumLoadBalancerCapacity:
    def __init__(self, *, capacity_units: jsii.Number) -> None:
        '''
        :param capacity_units: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#capacity_units Alb#capacity_units}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6fee833fbdebcabe6b378a62392d5586233b7d5a191d1a4f165e8f7a46d29dcf)
            check_type(argname="argument capacity_units", value=capacity_units, expected_type=type_hints["capacity_units"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "capacity_units": capacity_units,
        }

    @builtins.property
    def capacity_units(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#capacity_units Alb#capacity_units}.'''
        result = self._values.get("capacity_units")
        assert result is not None, "Required property 'capacity_units' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbMinimumLoadBalancerCapacity(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AlbMinimumLoadBalancerCapacityOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.alb.AlbMinimumLoadBalancerCapacityOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5b4cae268204dcc8e9dcda502e783d6a3245a31d5c8aa8834a2e7c872515f855)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="capacityUnitsInput")
    def capacity_units_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "capacityUnitsInput"))

    @builtins.property
    @jsii.member(jsii_name="capacityUnits")
    def capacity_units(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "capacityUnits"))

    @capacity_units.setter
    def capacity_units(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf9c4f0ce656010e21f3097e57f87ceb4ac644e335ef81078a667a34cb3a7712)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "capacityUnits", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[AlbMinimumLoadBalancerCapacity]:
        return typing.cast(typing.Optional[AlbMinimumLoadBalancerCapacity], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[AlbMinimumLoadBalancerCapacity],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ebd003d241b57afe76b4a67810e912203f13c9308f2adaec29feb47954cf50e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.alb.AlbSubnetMapping",
    jsii_struct_bases=[],
    name_mapping={
        "subnet_id": "subnetId",
        "allocation_id": "allocationId",
        "ipv6_address": "ipv6Address",
        "private_ipv4_address": "privateIpv4Address",
    },
)
class AlbSubnetMapping:
    def __init__(
        self,
        *,
        subnet_id: builtins.str,
        allocation_id: typing.Optional[builtins.str] = None,
        ipv6_address: typing.Optional[builtins.str] = None,
        private_ipv4_address: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param subnet_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#subnet_id Alb#subnet_id}.
        :param allocation_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#allocation_id Alb#allocation_id}.
        :param ipv6_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ipv6_address Alb#ipv6_address}.
        :param private_ipv4_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#private_ipv4_address Alb#private_ipv4_address}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c22d75f68f352f681d29f0d2ee2214c5df66e34d4b3397f60651a628e30c9f93)
            check_type(argname="argument subnet_id", value=subnet_id, expected_type=type_hints["subnet_id"])
            check_type(argname="argument allocation_id", value=allocation_id, expected_type=type_hints["allocation_id"])
            check_type(argname="argument ipv6_address", value=ipv6_address, expected_type=type_hints["ipv6_address"])
            check_type(argname="argument private_ipv4_address", value=private_ipv4_address, expected_type=type_hints["private_ipv4_address"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "subnet_id": subnet_id,
        }
        if allocation_id is not None:
            self._values["allocation_id"] = allocation_id
        if ipv6_address is not None:
            self._values["ipv6_address"] = ipv6_address
        if private_ipv4_address is not None:
            self._values["private_ipv4_address"] = private_ipv4_address

    @builtins.property
    def subnet_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#subnet_id Alb#subnet_id}.'''
        result = self._values.get("subnet_id")
        assert result is not None, "Required property 'subnet_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def allocation_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#allocation_id Alb#allocation_id}.'''
        result = self._values.get("allocation_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ipv6_address(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#ipv6_address Alb#ipv6_address}.'''
        result = self._values.get("ipv6_address")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def private_ipv4_address(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#private_ipv4_address Alb#private_ipv4_address}.'''
        result = self._values.get("private_ipv4_address")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbSubnetMapping(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AlbSubnetMappingList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.alb.AlbSubnetMappingList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5930b192c63b6add27c6d4e259b5e005346b3e053c3624063c4fef4d3c4658b9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "AlbSubnetMappingOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f7aee36dac320123e897d21a0e38604142e10bfe3d6c6668476bfb16c5804d86)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("AlbSubnetMappingOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a058ca8809eb20216eaf5ef9ddcce9676f521849db4058b3ac7b40dcfc94a62)
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
            type_hints = typing.get_type_hints(_typecheckingstub__06d7298375efdbda8fd68140c87e965cda1b9832f46ad3b99bb33000e6a00cb4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__90c42e538f708fbf8c7cc2abf51a20a285b12d19215dfd7ae2512923ad334e31)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AlbSubnetMapping]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AlbSubnetMapping]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AlbSubnetMapping]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fcd361d23dbc67242d815218815e1799665056ea0673693d3bf92b9231009ce7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class AlbSubnetMappingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.alb.AlbSubnetMappingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__01603d6d325369a71c39b31541f71d66ba6a5f45683d8ffaaef4372f1edc1c89)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetAllocationId")
    def reset_allocation_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllocationId", []))

    @jsii.member(jsii_name="resetIpv6Address")
    def reset_ipv6_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIpv6Address", []))

    @jsii.member(jsii_name="resetPrivateIpv4Address")
    def reset_private_ipv4_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrivateIpv4Address", []))

    @builtins.property
    @jsii.member(jsii_name="outpostId")
    def outpost_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "outpostId"))

    @builtins.property
    @jsii.member(jsii_name="allocationIdInput")
    def allocation_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "allocationIdInput"))

    @builtins.property
    @jsii.member(jsii_name="ipv6AddressInput")
    def ipv6_address_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ipv6AddressInput"))

    @builtins.property
    @jsii.member(jsii_name="privateIpv4AddressInput")
    def private_ipv4_address_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "privateIpv4AddressInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetIdInput")
    def subnet_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "subnetIdInput"))

    @builtins.property
    @jsii.member(jsii_name="allocationId")
    def allocation_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "allocationId"))

    @allocation_id.setter
    def allocation_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d271cb061bcf9f1166c3e348f29228885ef78ac781fedfbc9a7c1b40debf3477)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "allocationId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ipv6Address")
    def ipv6_address(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ipv6Address"))

    @ipv6_address.setter
    def ipv6_address(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc4d7c9744a7ecb70e252b8699b1299cd29cd3bf4f25373225dc72985e68474c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ipv6Address", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="privateIpv4Address")
    def private_ipv4_address(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "privateIpv4Address"))

    @private_ipv4_address.setter
    def private_ipv4_address(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e989a2963ee33f17fc10c42c7f0a656725e81927cc90e5d8659d87f8eb04f75)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "privateIpv4Address", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnetId")
    def subnet_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "subnetId"))

    @subnet_id.setter
    def subnet_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__057eb677f0804b1d806d727bb7174d4b13758448fcf65a318dc325d5bc2f66ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnetId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbSubnetMapping]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbSubnetMapping]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbSubnetMapping]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aca1514d0624913f6b7712464e4ce0bd2de67f8ebf6e0fc8b9ab9c1ff75a2ac7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.alb.AlbTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class AlbTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#create Alb#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#delete Alb#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#update Alb#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59a3aaccbac15ad7599dacc4ac6f57b9f83d32e93e477162e5789861258270ac)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#create Alb#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#delete Alb#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb#update Alb#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "AlbTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class AlbTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.alb.AlbTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6e9e82ea6b0c31cb7f212bfadddb4e5f08d811acd6706cdae1a79be2916e395d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5e685342f498dcbedcdf07fd742ea88269e3f908499997f4ad676e9830e64a8b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d941a3d8881a178d67bb073cddb78519bcbc1d8247825da3e5864d232177ecb6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab877bb9196dcc95bbd9f0a03196e35926b0f645bda2665d1f8d8f2aff22e89b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a8aa46b9deead6c0a1f41315ac0a1143da580f226e0fb09694544778f754a794)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Alb",
    "AlbAccessLogs",
    "AlbAccessLogsOutputReference",
    "AlbConfig",
    "AlbConnectionLogs",
    "AlbConnectionLogsOutputReference",
    "AlbIpamPools",
    "AlbIpamPoolsOutputReference",
    "AlbMinimumLoadBalancerCapacity",
    "AlbMinimumLoadBalancerCapacityOutputReference",
    "AlbSubnetMapping",
    "AlbSubnetMappingList",
    "AlbSubnetMappingOutputReference",
    "AlbTimeouts",
    "AlbTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__dc0172fdf08d24f62a469e8a09d95c0507f35c9aad462ec741ad9272e2dbeedf(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    access_logs: typing.Optional[typing.Union[AlbAccessLogs, typing.Dict[builtins.str, typing.Any]]] = None,
    client_keep_alive: typing.Optional[jsii.Number] = None,
    connection_logs: typing.Optional[typing.Union[AlbConnectionLogs, typing.Dict[builtins.str, typing.Any]]] = None,
    customer_owned_ipv4_pool: typing.Optional[builtins.str] = None,
    desync_mitigation_mode: typing.Optional[builtins.str] = None,
    dns_record_client_routing_policy: typing.Optional[builtins.str] = None,
    drop_invalid_header_fields: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_cross_zone_load_balancing: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_deletion_protection: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_http2: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_tls_version_and_cipher_suite_headers: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_waf_fail_open: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_xff_client_port: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_zonal_shift: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enforce_security_group_inbound_rules_on_private_link_traffic: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    idle_timeout: typing.Optional[jsii.Number] = None,
    internal: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ip_address_type: typing.Optional[builtins.str] = None,
    ipam_pools: typing.Optional[typing.Union[AlbIpamPools, typing.Dict[builtins.str, typing.Any]]] = None,
    load_balancer_type: typing.Optional[builtins.str] = None,
    minimum_load_balancer_capacity: typing.Optional[typing.Union[AlbMinimumLoadBalancerCapacity, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    preserve_host_header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
    subnet_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AlbSubnetMapping, typing.Dict[builtins.str, typing.Any]]]]] = None,
    subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[AlbTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    xff_header_processing_mode: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__67beea051e880f55ffa3a9b60987634424088d0e01d365cce67bc0de10bb0451(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd85f0c8e0166f3a1db108817107e47b92384f198195a2ee72d45c74a262b5a0(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AlbSubnetMapping, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2bc031276dabe1abc849620f9cd067f1d3dbdac6b1521251f2d4fab294c32e4(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a14fbebcacc4455d31df759dc8ee1ddac8a91d98fc81211038d4a10eade9a3b1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9aa4dafa60455452d86feff67523e8cfeb705cefa1d41051b502d3219724e9c8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6cb6a82833dac94cf608fdc950cfc74ed0e001bac080e425bc20652d2a141bf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__076207156ec6e1c2fd73f7c189449a3045831ced97c960f0d01eb782556cfa67(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__39d7d3114d7e7fd80770301088ccc661d805e1e8482c2984eb81d6ebe40a81fb(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a043a7b71be73fb05bbcda6324db47d51d9b82f80548a05291f955ec3ff7d99(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8829587428504479e0dbc501802f518ea6419f1c58be4e8aaf1b1f0bbf5c8818(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e15a5457861558c368e38046198b00fec1964d00e1ddc3755856284a124460d7(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a8c81ebdb242cb554d20f7b4109034afd01abf3e4c2a0d46d55f8ecc3d880558(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__367c3788c29a96a6f9d44b5b2dc41ec83f3efb6228eea9b41781ec15bc3b43d0(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1680aeb1eaf782ef6e5316421769066505cf96b7332fa94752d04a18ae723c79(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3adb0214993dec148e82860faf165bd62b888f94c0e1ca594e3244a0b16b99e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61dc694b1e58f61c45759997a9b20b1ae062eb8abb2b77acbe2146469e2e5e77(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd4da834e064feebd383e42d2def8d0b956493cecd55fcf9ffd719f8d476fb37(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b1752d9030f88a3ae9940b638de3b0ad0e7455b4b02a9cefbd3a01869a97e0f(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0d9a5a18ed2a29d2d113ee96397c1e72107c0aa8c2f4edbfa2d95d8b278320f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6285d5f798060046c5296fbb118070ed3c0347ec2afa4a2a731061d1982e9042(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__922c741a018db2a1b5a6515015d7700c94705f0e566810efe2b83a749645aeee(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f82ee69cfb74b01af4f14afecf061e418a76fe500fc900e9f1c6161bb1e060ea(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca1c196de57a59f46101cc1bb5360c9196277e0e2ebbd4ad77e7089a7332d110(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f18c81b21fc50931f1c73c8df52b692427d0ca7eb427f425a2c08145cfbed385(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__80563b54fd48f866a2255a78d2b9f9e0fc550a8eeec008e853af4fcecc30b319(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0f0a875dae86b5c022ab93e0d61e46af6a001d4474e8dc42f9a1f5a55381355(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d20479c6f26acd0ed54e50bcf95043c42733fa6fce8f4f81ab040cce7f7e8ca(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1346ec088215212c6f61a1adea1d18b9f5ec7ddc0a5ba5f9393faaaabd56036(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e65b800dab182606536afb050efa06ef4f7b04317b3522614daa7acd24bf4967(
    *,
    bucket: builtins.str,
    enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    prefix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cdc461703b4d023cf6cf41793ec952f4c6fac19a023bb7b27568b84cbbadb3c6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb1a94f515f7869a7db847b5ed6b16d204fa597457cc54ad1fb2b4752259f54b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0b2231aaf4b6e0655c682f6b906904efeead7d8c93c9cebf27ee6ed74f4febf(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d0e2a0308ad01e1adcfa2867aab4309a4a3da55a68136968a16d975e2a5ee94(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc41eaf165d1d3d722cb616aaf47a10632b1c0a2a84044d4a5b3f0faf8d035fe(
    value: typing.Optional[AlbAccessLogs],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d69b3faf77c12e5ec62aa1d0984a49bdcb43402e582ebd102b286e7bb26fcb74(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    access_logs: typing.Optional[typing.Union[AlbAccessLogs, typing.Dict[builtins.str, typing.Any]]] = None,
    client_keep_alive: typing.Optional[jsii.Number] = None,
    connection_logs: typing.Optional[typing.Union[AlbConnectionLogs, typing.Dict[builtins.str, typing.Any]]] = None,
    customer_owned_ipv4_pool: typing.Optional[builtins.str] = None,
    desync_mitigation_mode: typing.Optional[builtins.str] = None,
    dns_record_client_routing_policy: typing.Optional[builtins.str] = None,
    drop_invalid_header_fields: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_cross_zone_load_balancing: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_deletion_protection: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_http2: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_tls_version_and_cipher_suite_headers: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_waf_fail_open: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_xff_client_port: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_zonal_shift: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enforce_security_group_inbound_rules_on_private_link_traffic: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    idle_timeout: typing.Optional[jsii.Number] = None,
    internal: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ip_address_type: typing.Optional[builtins.str] = None,
    ipam_pools: typing.Optional[typing.Union[AlbIpamPools, typing.Dict[builtins.str, typing.Any]]] = None,
    load_balancer_type: typing.Optional[builtins.str] = None,
    minimum_load_balancer_capacity: typing.Optional[typing.Union[AlbMinimumLoadBalancerCapacity, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    preserve_host_header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
    subnet_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[AlbSubnetMapping, typing.Dict[builtins.str, typing.Any]]]]] = None,
    subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[AlbTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    xff_header_processing_mode: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75fb30c79c30d20348e0d313a04b4ded36f227183e23399249d34cbae794c7a7(
    *,
    bucket: builtins.str,
    enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    prefix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7d214d9ea909b6e25779c80a81abd2caef0889a27a07cf1998a22e3860ca6dc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f03413a5b3500f83add86315811faf8a297fdf59ffae6790a19e748712906007(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22926c59494fe02439131b4d46642da64550d1587b5d1adeb533e233b828eeaf(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f9cdb2d7735b1ba48c12e3bd4b4e1670bf013065dcd1ce015e53627a268c594(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c463194b398dbb32f7a78e89351cb617cc00e8cd50a652f58546c0d1dbb9adc(
    value: typing.Optional[AlbConnectionLogs],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5d6d9589f4bcff1c9e800b1caebb4e1e066749d655ef6e059a89ee5ff70fcbe(
    *,
    ipv4_ipam_pool_id: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f51a331a54ae284ef491200cad2903b7b3e3efe127efd27d10666772adbec422(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2c388493abd801ed52bddeff8514926a4ba98f15950a5d05ed523cd63402aba(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b89c761a4b50aeeb798d2dd0838de6245881205b858c6aec0eeda5783869bc9(
    value: typing.Optional[AlbIpamPools],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6fee833fbdebcabe6b378a62392d5586233b7d5a191d1a4f165e8f7a46d29dcf(
    *,
    capacity_units: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b4cae268204dcc8e9dcda502e783d6a3245a31d5c8aa8834a2e7c872515f855(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf9c4f0ce656010e21f3097e57f87ceb4ac644e335ef81078a667a34cb3a7712(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebd003d241b57afe76b4a67810e912203f13c9308f2adaec29feb47954cf50e4(
    value: typing.Optional[AlbMinimumLoadBalancerCapacity],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c22d75f68f352f681d29f0d2ee2214c5df66e34d4b3397f60651a628e30c9f93(
    *,
    subnet_id: builtins.str,
    allocation_id: typing.Optional[builtins.str] = None,
    ipv6_address: typing.Optional[builtins.str] = None,
    private_ipv4_address: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5930b192c63b6add27c6d4e259b5e005346b3e053c3624063c4fef4d3c4658b9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7aee36dac320123e897d21a0e38604142e10bfe3d6c6668476bfb16c5804d86(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a058ca8809eb20216eaf5ef9ddcce9676f521849db4058b3ac7b40dcfc94a62(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06d7298375efdbda8fd68140c87e965cda1b9832f46ad3b99bb33000e6a00cb4(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90c42e538f708fbf8c7cc2abf51a20a285b12d19215dfd7ae2512923ad334e31(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fcd361d23dbc67242d815218815e1799665056ea0673693d3bf92b9231009ce7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[AlbSubnetMapping]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01603d6d325369a71c39b31541f71d66ba6a5f45683d8ffaaef4372f1edc1c89(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d271cb061bcf9f1166c3e348f29228885ef78ac781fedfbc9a7c1b40debf3477(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc4d7c9744a7ecb70e252b8699b1299cd29cd3bf4f25373225dc72985e68474c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e989a2963ee33f17fc10c42c7f0a656725e81927cc90e5d8659d87f8eb04f75(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__057eb677f0804b1d806d727bb7174d4b13758448fcf65a318dc325d5bc2f66ba(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aca1514d0624913f6b7712464e4ce0bd2de67f8ebf6e0fc8b9ab9c1ff75a2ac7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbSubnetMapping]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59a3aaccbac15ad7599dacc4ac6f57b9f83d32e93e477162e5789861258270ac(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e9e82ea6b0c31cb7f212bfadddb4e5f08d811acd6706cdae1a79be2916e395d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e685342f498dcbedcdf07fd742ea88269e3f908499997f4ad676e9830e64a8b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d941a3d8881a178d67bb073cddb78519bcbc1d8247825da3e5864d232177ecb6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab877bb9196dcc95bbd9f0a03196e35926b0f645bda2665d1f8d8f2aff22e89b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a8aa46b9deead6c0a1f41315ac0a1143da580f226e0fb09694544778f754a794(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, AlbTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
