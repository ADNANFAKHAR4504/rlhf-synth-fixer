r'''
# `aws_lb`

Refer to the Terraform Registry for docs: [`aws_lb`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb).
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


class Lb(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lb.Lb",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb aws_lb}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        access_logs: typing.Optional[typing.Union["LbAccessLogs", typing.Dict[builtins.str, typing.Any]]] = None,
        client_keep_alive: typing.Optional[jsii.Number] = None,
        connection_logs: typing.Optional[typing.Union["LbConnectionLogs", typing.Dict[builtins.str, typing.Any]]] = None,
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
        ipam_pools: typing.Optional[typing.Union["LbIpamPools", typing.Dict[builtins.str, typing.Any]]] = None,
        load_balancer_type: typing.Optional[builtins.str] = None,
        minimum_load_balancer_capacity: typing.Optional[typing.Union["LbMinimumLoadBalancerCapacity", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        preserve_host_header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
        subnet_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["LbSubnetMapping", typing.Dict[builtins.str, typing.Any]]]]] = None,
        subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["LbTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        xff_header_processing_mode: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb aws_lb} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param access_logs: access_logs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#access_logs Lb#access_logs}
        :param client_keep_alive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#client_keep_alive Lb#client_keep_alive}.
        :param connection_logs: connection_logs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#connection_logs Lb#connection_logs}
        :param customer_owned_ipv4_pool: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#customer_owned_ipv4_pool Lb#customer_owned_ipv4_pool}.
        :param desync_mitigation_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#desync_mitigation_mode Lb#desync_mitigation_mode}.
        :param dns_record_client_routing_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#dns_record_client_routing_policy Lb#dns_record_client_routing_policy}.
        :param drop_invalid_header_fields: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#drop_invalid_header_fields Lb#drop_invalid_header_fields}.
        :param enable_cross_zone_load_balancing: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_cross_zone_load_balancing Lb#enable_cross_zone_load_balancing}.
        :param enable_deletion_protection: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_deletion_protection Lb#enable_deletion_protection}.
        :param enable_http2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_http2 Lb#enable_http2}.
        :param enable_tls_version_and_cipher_suite_headers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_tls_version_and_cipher_suite_headers Lb#enable_tls_version_and_cipher_suite_headers}.
        :param enable_waf_fail_open: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_waf_fail_open Lb#enable_waf_fail_open}.
        :param enable_xff_client_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_xff_client_port Lb#enable_xff_client_port}.
        :param enable_zonal_shift: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_zonal_shift Lb#enable_zonal_shift}.
        :param enforce_security_group_inbound_rules_on_private_link_traffic: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enforce_security_group_inbound_rules_on_private_link_traffic Lb#enforce_security_group_inbound_rules_on_private_link_traffic}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#id Lb#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param idle_timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#idle_timeout Lb#idle_timeout}.
        :param internal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#internal Lb#internal}.
        :param ip_address_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ip_address_type Lb#ip_address_type}.
        :param ipam_pools: ipam_pools block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ipam_pools Lb#ipam_pools}
        :param load_balancer_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#load_balancer_type Lb#load_balancer_type}.
        :param minimum_load_balancer_capacity: minimum_load_balancer_capacity block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#minimum_load_balancer_capacity Lb#minimum_load_balancer_capacity}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#name Lb#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#name_prefix Lb#name_prefix}.
        :param preserve_host_header: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#preserve_host_header Lb#preserve_host_header}.
        :param security_groups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#security_groups Lb#security_groups}.
        :param subnet_mapping: subnet_mapping block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnet_mapping Lb#subnet_mapping}
        :param subnets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnets Lb#subnets}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#tags Lb#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#tags_all Lb#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#timeouts Lb#timeouts}
        :param xff_header_processing_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#xff_header_processing_mode Lb#xff_header_processing_mode}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a122b1259b21cdcaca82542c10938b7183362998bbdb348550b10b9a7b9b8e14)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = LbConfig(
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
        '''Generates CDKTF code for importing a Lb resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Lb to import.
        :param import_from_id: The id of the existing Lb that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Lb to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c713c8a8c598807bc20e1bcd9a3482fac6da84d77dfaf268d005a39a0f9cedde)
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
        :param bucket: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#bucket Lb#bucket}.
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enabled Lb#enabled}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#prefix Lb#prefix}.
        '''
        value = LbAccessLogs(bucket=bucket, enabled=enabled, prefix=prefix)

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
        :param bucket: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#bucket Lb#bucket}.
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enabled Lb#enabled}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#prefix Lb#prefix}.
        '''
        value = LbConnectionLogs(bucket=bucket, enabled=enabled, prefix=prefix)

        return typing.cast(None, jsii.invoke(self, "putConnectionLogs", [value]))

    @jsii.member(jsii_name="putIpamPools")
    def put_ipam_pools(self, *, ipv4_ipam_pool_id: builtins.str) -> None:
        '''
        :param ipv4_ipam_pool_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ipv4_ipam_pool_id Lb#ipv4_ipam_pool_id}.
        '''
        value = LbIpamPools(ipv4_ipam_pool_id=ipv4_ipam_pool_id)

        return typing.cast(None, jsii.invoke(self, "putIpamPools", [value]))

    @jsii.member(jsii_name="putMinimumLoadBalancerCapacity")
    def put_minimum_load_balancer_capacity(
        self,
        *,
        capacity_units: jsii.Number,
    ) -> None:
        '''
        :param capacity_units: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#capacity_units Lb#capacity_units}.
        '''
        value = LbMinimumLoadBalancerCapacity(capacity_units=capacity_units)

        return typing.cast(None, jsii.invoke(self, "putMinimumLoadBalancerCapacity", [value]))

    @jsii.member(jsii_name="putSubnetMapping")
    def put_subnet_mapping(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["LbSubnetMapping", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d69b12f2a9cfdde272c8ba416bbea6e5db1a098b8ea1ade9c6089c8bd20c639)
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
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#create Lb#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#delete Lb#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#update Lb#update}.
        '''
        value = LbTimeouts(create=create, delete=delete, update=update)

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
    def access_logs(self) -> "LbAccessLogsOutputReference":
        return typing.cast("LbAccessLogsOutputReference", jsii.get(self, "accessLogs"))

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
    def connection_logs(self) -> "LbConnectionLogsOutputReference":
        return typing.cast("LbConnectionLogsOutputReference", jsii.get(self, "connectionLogs"))

    @builtins.property
    @jsii.member(jsii_name="dnsName")
    def dns_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dnsName"))

    @builtins.property
    @jsii.member(jsii_name="ipamPools")
    def ipam_pools(self) -> "LbIpamPoolsOutputReference":
        return typing.cast("LbIpamPoolsOutputReference", jsii.get(self, "ipamPools"))

    @builtins.property
    @jsii.member(jsii_name="minimumLoadBalancerCapacity")
    def minimum_load_balancer_capacity(
        self,
    ) -> "LbMinimumLoadBalancerCapacityOutputReference":
        return typing.cast("LbMinimumLoadBalancerCapacityOutputReference", jsii.get(self, "minimumLoadBalancerCapacity"))

    @builtins.property
    @jsii.member(jsii_name="subnetMapping")
    def subnet_mapping(self) -> "LbSubnetMappingList":
        return typing.cast("LbSubnetMappingList", jsii.get(self, "subnetMapping"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "LbTimeoutsOutputReference":
        return typing.cast("LbTimeoutsOutputReference", jsii.get(self, "timeouts"))

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
    def access_logs_input(self) -> typing.Optional["LbAccessLogs"]:
        return typing.cast(typing.Optional["LbAccessLogs"], jsii.get(self, "accessLogsInput"))

    @builtins.property
    @jsii.member(jsii_name="clientKeepAliveInput")
    def client_keep_alive_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "clientKeepAliveInput"))

    @builtins.property
    @jsii.member(jsii_name="connectionLogsInput")
    def connection_logs_input(self) -> typing.Optional["LbConnectionLogs"]:
        return typing.cast(typing.Optional["LbConnectionLogs"], jsii.get(self, "connectionLogsInput"))

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
    def ipam_pools_input(self) -> typing.Optional["LbIpamPools"]:
        return typing.cast(typing.Optional["LbIpamPools"], jsii.get(self, "ipamPoolsInput"))

    @builtins.property
    @jsii.member(jsii_name="loadBalancerTypeInput")
    def load_balancer_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "loadBalancerTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="minimumLoadBalancerCapacityInput")
    def minimum_load_balancer_capacity_input(
        self,
    ) -> typing.Optional["LbMinimumLoadBalancerCapacity"]:
        return typing.cast(typing.Optional["LbMinimumLoadBalancerCapacity"], jsii.get(self, "minimumLoadBalancerCapacityInput"))

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
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LbSubnetMapping"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LbSubnetMapping"]]], jsii.get(self, "subnetMappingInput"))

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
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "LbTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "LbTimeouts"]], jsii.get(self, "timeoutsInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__d1969ebcba6f2e5d82fc22ff3c83de623b5e111727c2ed1c0df17b0d37d627fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "clientKeepAlive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="customerOwnedIpv4Pool")
    def customer_owned_ipv4_pool(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "customerOwnedIpv4Pool"))

    @customer_owned_ipv4_pool.setter
    def customer_owned_ipv4_pool(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d9b231c9f0669293b4432044cf79989e5da92a416e1bea12ecc1ece2fabe302)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "customerOwnedIpv4Pool", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="desyncMitigationMode")
    def desync_mitigation_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "desyncMitigationMode"))

    @desync_mitigation_mode.setter
    def desync_mitigation_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2a180f4e5fbe3566fc6e82d6df0f73bac369723a3c0f4cc229936cb2254182f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "desyncMitigationMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dnsRecordClientRoutingPolicy")
    def dns_record_client_routing_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dnsRecordClientRoutingPolicy"))

    @dns_record_client_routing_policy.setter
    def dns_record_client_routing_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d821be35bdf309d960aca54dec60fd2b3a55e124f7c5b190ff9a484ebf253472)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ca16ccf532679219e358d1f4376737cf04ec300bcf58d83e4ae05fa310c4e4c7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__667beb6993f74e1d42092bb76a2f675090a8a8a9b7ab83860b171ea029f1bc54)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d726e1d8581604b375e8a9f29b2289374d5c0ad16deba7601353554ba99941f7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d75da204b88a59507db5c2bfec028e7482c648b5042832718bd906d3d8fe7726)
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
            type_hints = typing.get_type_hints(_typecheckingstub__558e5f0093d2358cfc3e474774c161cc5ad198fe243ea06da797c68214dbea70)
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
            type_hints = typing.get_type_hints(_typecheckingstub__55d00cd6270e90c84db09e9f5144001296ab0ebe6e676295e60ced09e655838a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0ec1c0a6dc679c339b5ca38fa3aa6581d4dc941bb9d036be4a86695f9d6abe9d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e1ddcf87e4e700d92f3b39f060dbd610cd9f08a4a6039793b575694acda445c6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__60079a288689366448cfd47f0b26ad0fc8918f149e4735d0f3ae7007833ba9f6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enforceSecurityGroupInboundRulesOnPrivateLinkTraffic", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e9128a66825a4c329c57b01f3968dcca9c4c57989b9f382831f7f906c0e3bb9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="idleTimeout")
    def idle_timeout(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "idleTimeout"))

    @idle_timeout.setter
    def idle_timeout(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce1ea006e2cfc9b19452cc4e51bfa15080ada287300bc0466b3f5d7078d85376)
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
            type_hints = typing.get_type_hints(_typecheckingstub__40fe02d0673c79ff0aaf27bc3c1ac9df5c159f7bfac3a6dcdb413922a07434ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internal", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ipAddressType")
    def ip_address_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ipAddressType"))

    @ip_address_type.setter
    def ip_address_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__88a96ca797aa9a56700be5e1db47712d212c4d22f10a91d42671aed157e43b9a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ipAddressType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="loadBalancerType")
    def load_balancer_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "loadBalancerType"))

    @load_balancer_type.setter
    def load_balancer_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3eee7694f953461a34d52edc387650322e7889a39838d107f52424a812fe75d7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "loadBalancerType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67622cd73ca8be4f145e68b3c63323fba852501ac1adf73c22e6f0c9f55d369b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="namePrefix")
    def name_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "namePrefix"))

    @name_prefix.setter
    def name_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b1defc369dafe877f8fe9d512c93cd28cecbf063ba290fac8ba958d130f62f6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0685e5ac39f10bf16181f38d43cc4b2e62a9d89e57f874d5d4767cb14f4dfdae)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "preserveHostHeader", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="securityGroups")
    def security_groups(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "securityGroups"))

    @security_groups.setter
    def security_groups(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67a54c46417408444f89ce53f6f4f3f83682576cfd68463998bd95a213df3d81)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityGroups", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnets")
    def subnets(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "subnets"))

    @subnets.setter
    def subnets(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__20c72b795c7917b5f8a399366a61c743ac4d0f52785c2eeebac8d80491b7e6f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnets", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0775fdd886f75ff2038a8d978c1c33ca461c62ca0c610134d2407e74ba885dc6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79227797b38f57178ce6c193c6d667bf3a72c3b3bbd1c78254fe49761941ad0f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="xffHeaderProcessingMode")
    def xff_header_processing_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "xffHeaderProcessingMode"))

    @xff_header_processing_mode.setter
    def xff_header_processing_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a7cdeb8321b8c7a47d72fdb13f90c539de9011866727b3ce9b3d815611ed493b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "xffHeaderProcessingMode", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lb.LbAccessLogs",
    jsii_struct_bases=[],
    name_mapping={"bucket": "bucket", "enabled": "enabled", "prefix": "prefix"},
)
class LbAccessLogs:
    def __init__(
        self,
        *,
        bucket: builtins.str,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#bucket Lb#bucket}.
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enabled Lb#enabled}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#prefix Lb#prefix}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0655af3b19e0f0043b08b1e3e2c44285767d6fad346999c669bb67b6dd136c2f)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#bucket Lb#bucket}.'''
        result = self._values.get("bucket")
        assert result is not None, "Required property 'bucket' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enabled Lb#enabled}.'''
        result = self._values.get("enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#prefix Lb#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbAccessLogs(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbAccessLogsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lb.LbAccessLogsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__51817206d343d15f86221a9e7a883e7aa911ee21054f28797e2a7fd3dc8393da)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a91fbbebb9295b13cbf129e043aa8b8438c8e0fd426f2c1c666b089b1c112765)
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
            type_hints = typing.get_type_hints(_typecheckingstub__43d34dc2ad26f83878c517043f6083f32018ba118174b5cbd4a2fc3d21ec9305)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ba0119658f6facffe01ea1055c93d52225c87f4539e73ad6c60732728f5e8c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[LbAccessLogs]:
        return typing.cast(typing.Optional[LbAccessLogs], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[LbAccessLogs]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e26dbde1d5a6341568fbc9eb03604000ead57a2c278bce707bc26b4495c7a45)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lb.LbConfig",
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
class LbConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        access_logs: typing.Optional[typing.Union[LbAccessLogs, typing.Dict[builtins.str, typing.Any]]] = None,
        client_keep_alive: typing.Optional[jsii.Number] = None,
        connection_logs: typing.Optional[typing.Union["LbConnectionLogs", typing.Dict[builtins.str, typing.Any]]] = None,
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
        ipam_pools: typing.Optional[typing.Union["LbIpamPools", typing.Dict[builtins.str, typing.Any]]] = None,
        load_balancer_type: typing.Optional[builtins.str] = None,
        minimum_load_balancer_capacity: typing.Optional[typing.Union["LbMinimumLoadBalancerCapacity", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        preserve_host_header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
        subnet_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["LbSubnetMapping", typing.Dict[builtins.str, typing.Any]]]]] = None,
        subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["LbTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
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
        :param access_logs: access_logs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#access_logs Lb#access_logs}
        :param client_keep_alive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#client_keep_alive Lb#client_keep_alive}.
        :param connection_logs: connection_logs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#connection_logs Lb#connection_logs}
        :param customer_owned_ipv4_pool: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#customer_owned_ipv4_pool Lb#customer_owned_ipv4_pool}.
        :param desync_mitigation_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#desync_mitigation_mode Lb#desync_mitigation_mode}.
        :param dns_record_client_routing_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#dns_record_client_routing_policy Lb#dns_record_client_routing_policy}.
        :param drop_invalid_header_fields: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#drop_invalid_header_fields Lb#drop_invalid_header_fields}.
        :param enable_cross_zone_load_balancing: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_cross_zone_load_balancing Lb#enable_cross_zone_load_balancing}.
        :param enable_deletion_protection: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_deletion_protection Lb#enable_deletion_protection}.
        :param enable_http2: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_http2 Lb#enable_http2}.
        :param enable_tls_version_and_cipher_suite_headers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_tls_version_and_cipher_suite_headers Lb#enable_tls_version_and_cipher_suite_headers}.
        :param enable_waf_fail_open: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_waf_fail_open Lb#enable_waf_fail_open}.
        :param enable_xff_client_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_xff_client_port Lb#enable_xff_client_port}.
        :param enable_zonal_shift: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_zonal_shift Lb#enable_zonal_shift}.
        :param enforce_security_group_inbound_rules_on_private_link_traffic: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enforce_security_group_inbound_rules_on_private_link_traffic Lb#enforce_security_group_inbound_rules_on_private_link_traffic}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#id Lb#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param idle_timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#idle_timeout Lb#idle_timeout}.
        :param internal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#internal Lb#internal}.
        :param ip_address_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ip_address_type Lb#ip_address_type}.
        :param ipam_pools: ipam_pools block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ipam_pools Lb#ipam_pools}
        :param load_balancer_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#load_balancer_type Lb#load_balancer_type}.
        :param minimum_load_balancer_capacity: minimum_load_balancer_capacity block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#minimum_load_balancer_capacity Lb#minimum_load_balancer_capacity}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#name Lb#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#name_prefix Lb#name_prefix}.
        :param preserve_host_header: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#preserve_host_header Lb#preserve_host_header}.
        :param security_groups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#security_groups Lb#security_groups}.
        :param subnet_mapping: subnet_mapping block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnet_mapping Lb#subnet_mapping}
        :param subnets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnets Lb#subnets}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#tags Lb#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#tags_all Lb#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#timeouts Lb#timeouts}
        :param xff_header_processing_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#xff_header_processing_mode Lb#xff_header_processing_mode}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(access_logs, dict):
            access_logs = LbAccessLogs(**access_logs)
        if isinstance(connection_logs, dict):
            connection_logs = LbConnectionLogs(**connection_logs)
        if isinstance(ipam_pools, dict):
            ipam_pools = LbIpamPools(**ipam_pools)
        if isinstance(minimum_load_balancer_capacity, dict):
            minimum_load_balancer_capacity = LbMinimumLoadBalancerCapacity(**minimum_load_balancer_capacity)
        if isinstance(timeouts, dict):
            timeouts = LbTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__367cda3de9611a9722710688f961a089dbb9b10dfb69cead72485e29d0eac35f)
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
    def access_logs(self) -> typing.Optional[LbAccessLogs]:
        '''access_logs block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#access_logs Lb#access_logs}
        '''
        result = self._values.get("access_logs")
        return typing.cast(typing.Optional[LbAccessLogs], result)

    @builtins.property
    def client_keep_alive(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#client_keep_alive Lb#client_keep_alive}.'''
        result = self._values.get("client_keep_alive")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def connection_logs(self) -> typing.Optional["LbConnectionLogs"]:
        '''connection_logs block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#connection_logs Lb#connection_logs}
        '''
        result = self._values.get("connection_logs")
        return typing.cast(typing.Optional["LbConnectionLogs"], result)

    @builtins.property
    def customer_owned_ipv4_pool(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#customer_owned_ipv4_pool Lb#customer_owned_ipv4_pool}.'''
        result = self._values.get("customer_owned_ipv4_pool")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def desync_mitigation_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#desync_mitigation_mode Lb#desync_mitigation_mode}.'''
        result = self._values.get("desync_mitigation_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def dns_record_client_routing_policy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#dns_record_client_routing_policy Lb#dns_record_client_routing_policy}.'''
        result = self._values.get("dns_record_client_routing_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def drop_invalid_header_fields(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#drop_invalid_header_fields Lb#drop_invalid_header_fields}.'''
        result = self._values.get("drop_invalid_header_fields")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_cross_zone_load_balancing(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_cross_zone_load_balancing Lb#enable_cross_zone_load_balancing}.'''
        result = self._values.get("enable_cross_zone_load_balancing")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_deletion_protection(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_deletion_protection Lb#enable_deletion_protection}.'''
        result = self._values.get("enable_deletion_protection")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_http2(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_http2 Lb#enable_http2}.'''
        result = self._values.get("enable_http2")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_tls_version_and_cipher_suite_headers(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_tls_version_and_cipher_suite_headers Lb#enable_tls_version_and_cipher_suite_headers}.'''
        result = self._values.get("enable_tls_version_and_cipher_suite_headers")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_waf_fail_open(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_waf_fail_open Lb#enable_waf_fail_open}.'''
        result = self._values.get("enable_waf_fail_open")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_xff_client_port(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_xff_client_port Lb#enable_xff_client_port}.'''
        result = self._values.get("enable_xff_client_port")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_zonal_shift(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_zonal_shift Lb#enable_zonal_shift}.'''
        result = self._values.get("enable_zonal_shift")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enforce_security_group_inbound_rules_on_private_link_traffic(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enforce_security_group_inbound_rules_on_private_link_traffic Lb#enforce_security_group_inbound_rules_on_private_link_traffic}.'''
        result = self._values.get("enforce_security_group_inbound_rules_on_private_link_traffic")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#id Lb#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def idle_timeout(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#idle_timeout Lb#idle_timeout}.'''
        result = self._values.get("idle_timeout")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def internal(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#internal Lb#internal}.'''
        result = self._values.get("internal")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def ip_address_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ip_address_type Lb#ip_address_type}.'''
        result = self._values.get("ip_address_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ipam_pools(self) -> typing.Optional["LbIpamPools"]:
        '''ipam_pools block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ipam_pools Lb#ipam_pools}
        '''
        result = self._values.get("ipam_pools")
        return typing.cast(typing.Optional["LbIpamPools"], result)

    @builtins.property
    def load_balancer_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#load_balancer_type Lb#load_balancer_type}.'''
        result = self._values.get("load_balancer_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def minimum_load_balancer_capacity(
        self,
    ) -> typing.Optional["LbMinimumLoadBalancerCapacity"]:
        '''minimum_load_balancer_capacity block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#minimum_load_balancer_capacity Lb#minimum_load_balancer_capacity}
        '''
        result = self._values.get("minimum_load_balancer_capacity")
        return typing.cast(typing.Optional["LbMinimumLoadBalancerCapacity"], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#name Lb#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#name_prefix Lb#name_prefix}.'''
        result = self._values.get("name_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def preserve_host_header(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#preserve_host_header Lb#preserve_host_header}.'''
        result = self._values.get("preserve_host_header")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def security_groups(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#security_groups Lb#security_groups}.'''
        result = self._values.get("security_groups")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def subnet_mapping(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LbSubnetMapping"]]]:
        '''subnet_mapping block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnet_mapping Lb#subnet_mapping}
        '''
        result = self._values.get("subnet_mapping")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LbSubnetMapping"]]], result)

    @builtins.property
    def subnets(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnets Lb#subnets}.'''
        result = self._values.get("subnets")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#tags Lb#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#tags_all Lb#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["LbTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#timeouts Lb#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["LbTimeouts"], result)

    @builtins.property
    def xff_header_processing_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#xff_header_processing_mode Lb#xff_header_processing_mode}.'''
        result = self._values.get("xff_header_processing_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.lb.LbConnectionLogs",
    jsii_struct_bases=[],
    name_mapping={"bucket": "bucket", "enabled": "enabled", "prefix": "prefix"},
)
class LbConnectionLogs:
    def __init__(
        self,
        *,
        bucket: builtins.str,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#bucket Lb#bucket}.
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enabled Lb#enabled}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#prefix Lb#prefix}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15c457f6262e57152b614e11ae013297b552d5602f185e3bfb3910ee1b8d273c)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#bucket Lb#bucket}.'''
        result = self._values.get("bucket")
        assert result is not None, "Required property 'bucket' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enabled Lb#enabled}.'''
        result = self._values.get("enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#prefix Lb#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbConnectionLogs(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbConnectionLogsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lb.LbConnectionLogsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1b6cdf5520f18cf00032518de0d16111c9fbc5202ebbea44672e42743a34b735)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2f6582511730e3b162df3c254b9be1fe5c863e2340368287195d1418863f0be3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7e0805b8249553ee483e9e9cd48e3cba8908fe58039eeb81ef8a7d4caf4ed426)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b5aaac9c777414f78411748d34c7fb1d3404c6ab7640ed59848eccef858ad099)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[LbConnectionLogs]:
        return typing.cast(typing.Optional[LbConnectionLogs], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[LbConnectionLogs]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4130da3233a2dd47eb408a246b5843ae6fd844343189556d98c25923815c1c95)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lb.LbIpamPools",
    jsii_struct_bases=[],
    name_mapping={"ipv4_ipam_pool_id": "ipv4IpamPoolId"},
)
class LbIpamPools:
    def __init__(self, *, ipv4_ipam_pool_id: builtins.str) -> None:
        '''
        :param ipv4_ipam_pool_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ipv4_ipam_pool_id Lb#ipv4_ipam_pool_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fef46556f034e44d9ab4f6f8bdb8412c5f7fc109143e9a15cd5b3657025ee488)
            check_type(argname="argument ipv4_ipam_pool_id", value=ipv4_ipam_pool_id, expected_type=type_hints["ipv4_ipam_pool_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "ipv4_ipam_pool_id": ipv4_ipam_pool_id,
        }

    @builtins.property
    def ipv4_ipam_pool_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ipv4_ipam_pool_id Lb#ipv4_ipam_pool_id}.'''
        result = self._values.get("ipv4_ipam_pool_id")
        assert result is not None, "Required property 'ipv4_ipam_pool_id' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbIpamPools(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbIpamPoolsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lb.LbIpamPoolsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7c79a4ded237721151cd794ca406904f37729dffff1a99268042aabc078ba91e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__005104740321cc7b21399c068ae0603ecef639a1f9b9dcceb4603798ceda4188)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ipv4IpamPoolId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[LbIpamPools]:
        return typing.cast(typing.Optional[LbIpamPools], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[LbIpamPools]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8f2c23bf53f1e25ca08de75b54ea532aff0ea56db44ad80bfbf5c881a61c252b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lb.LbMinimumLoadBalancerCapacity",
    jsii_struct_bases=[],
    name_mapping={"capacity_units": "capacityUnits"},
)
class LbMinimumLoadBalancerCapacity:
    def __init__(self, *, capacity_units: jsii.Number) -> None:
        '''
        :param capacity_units: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#capacity_units Lb#capacity_units}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8326816027d4447ffb0739dfa832ab8479c63493a4aaab11f93b999fc3590266)
            check_type(argname="argument capacity_units", value=capacity_units, expected_type=type_hints["capacity_units"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "capacity_units": capacity_units,
        }

    @builtins.property
    def capacity_units(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#capacity_units Lb#capacity_units}.'''
        result = self._values.get("capacity_units")
        assert result is not None, "Required property 'capacity_units' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbMinimumLoadBalancerCapacity(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbMinimumLoadBalancerCapacityOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lb.LbMinimumLoadBalancerCapacityOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b24cb798aec12dfd03c7652aa8653e9f8e6afa702e7dfea29a3b520593bbe860)
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
            type_hints = typing.get_type_hints(_typecheckingstub__76e13e99b9bb2035026bfffc4098a31148e9447d85bab6a0741d5854ed9b3bc9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "capacityUnits", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[LbMinimumLoadBalancerCapacity]:
        return typing.cast(typing.Optional[LbMinimumLoadBalancerCapacity], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LbMinimumLoadBalancerCapacity],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08d39ce946bfbcb550827357c0099569487867e775c394be467e53d7543921da)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lb.LbSubnetMapping",
    jsii_struct_bases=[],
    name_mapping={
        "subnet_id": "subnetId",
        "allocation_id": "allocationId",
        "ipv6_address": "ipv6Address",
        "private_ipv4_address": "privateIpv4Address",
    },
)
class LbSubnetMapping:
    def __init__(
        self,
        *,
        subnet_id: builtins.str,
        allocation_id: typing.Optional[builtins.str] = None,
        ipv6_address: typing.Optional[builtins.str] = None,
        private_ipv4_address: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param subnet_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnet_id Lb#subnet_id}.
        :param allocation_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#allocation_id Lb#allocation_id}.
        :param ipv6_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ipv6_address Lb#ipv6_address}.
        :param private_ipv4_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#private_ipv4_address Lb#private_ipv4_address}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dd26bd278f29a281e9438724a2a62409e1c43af82163771dbcdd413bb1e2d77b)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnet_id Lb#subnet_id}.'''
        result = self._values.get("subnet_id")
        assert result is not None, "Required property 'subnet_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def allocation_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#allocation_id Lb#allocation_id}.'''
        result = self._values.get("allocation_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ipv6_address(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ipv6_address Lb#ipv6_address}.'''
        result = self._values.get("ipv6_address")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def private_ipv4_address(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#private_ipv4_address Lb#private_ipv4_address}.'''
        result = self._values.get("private_ipv4_address")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbSubnetMapping(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbSubnetMappingList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lb.LbSubnetMappingList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7c4f544e80e25cff2a3ef637d2b2c8194d914757ca149076745091dd89335f34)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "LbSubnetMappingOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__44143e44974d7d831bcbb5a860d15e43b6638cd4b1ed3fd242b8e746c08988cb)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("LbSubnetMappingOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc6508bf230a4ebad739fc84e181e39aa24ade1e357026360957a9d9d7836d9c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8877415dcc11938d4a52f31b7f7c9c0ab03773fe9c07a9b7b436533b4c87f18b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0e142e7981fa3f9ab92aba91885e4d956a86e91e141b9a523f26bbf4538916ca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LbSubnetMapping]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LbSubnetMapping]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LbSubnetMapping]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7639941a5842264fc341f8bd02367286ee504743c4c5f7ea6dd25dde58f3cd7a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class LbSubnetMappingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lb.LbSubnetMappingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__702adfe23c564d0d209b84910362871998df8c8bc434384130eaa5f364240fea)
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
            type_hints = typing.get_type_hints(_typecheckingstub__eab64ad12168091f34cba92e1db9a413b8f4747754db9bac03ee2064489e9248)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "allocationId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ipv6Address")
    def ipv6_address(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ipv6Address"))

    @ipv6_address.setter
    def ipv6_address(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f081b295727a542ca61520e23d4cb04959a108a697c48d68d37ffa082727781e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ipv6Address", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="privateIpv4Address")
    def private_ipv4_address(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "privateIpv4Address"))

    @private_ipv4_address.setter
    def private_ipv4_address(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__13362bb30d0bd4e5633297f06712640eb98e4f677a0d712b45520031ef1c2fe6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "privateIpv4Address", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnetId")
    def subnet_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "subnetId"))

    @subnet_id.setter
    def subnet_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__634479c63d5e70df1add8292262f5acbbf4cb9a2b5183ad14d297b593086f190)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnetId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbSubnetMapping]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbSubnetMapping]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbSubnetMapping]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__19ae96ae048d26fd1b9a9799dac38da056e6fd27d4ac9664821568e4a70f1ae0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lb.LbTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class LbTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#create Lb#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#delete Lb#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#update Lb#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21d7bc4382d6137b67b442b4690d2a5c7cf688ca5667f20a9d0b74ac0dde6f9e)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#create Lb#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#delete Lb#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#update Lb#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lb.LbTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f130c7e67561b054de51edd4a6afd222984f82e5c4c4f1dbf22fdedd71394a29)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cd201787c7fc70d9390d8837d27d0bf8459d180cfbc31ea52e21ae33aabb84af)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__992534300868f1bbe7dcb9278f74807f39ab1b24db16aab241d04f46adf4ef5e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5453341d07345766ab2045757abceca1a2cffa369c63511306324c08d3df3c87)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a544ae08dcc1111e2d8e389d555104efa9a5033eae954834795f0f526b3ee28e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Lb",
    "LbAccessLogs",
    "LbAccessLogsOutputReference",
    "LbConfig",
    "LbConnectionLogs",
    "LbConnectionLogsOutputReference",
    "LbIpamPools",
    "LbIpamPoolsOutputReference",
    "LbMinimumLoadBalancerCapacity",
    "LbMinimumLoadBalancerCapacityOutputReference",
    "LbSubnetMapping",
    "LbSubnetMappingList",
    "LbSubnetMappingOutputReference",
    "LbTimeouts",
    "LbTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__a122b1259b21cdcaca82542c10938b7183362998bbdb348550b10b9a7b9b8e14(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    access_logs: typing.Optional[typing.Union[LbAccessLogs, typing.Dict[builtins.str, typing.Any]]] = None,
    client_keep_alive: typing.Optional[jsii.Number] = None,
    connection_logs: typing.Optional[typing.Union[LbConnectionLogs, typing.Dict[builtins.str, typing.Any]]] = None,
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
    ipam_pools: typing.Optional[typing.Union[LbIpamPools, typing.Dict[builtins.str, typing.Any]]] = None,
    load_balancer_type: typing.Optional[builtins.str] = None,
    minimum_load_balancer_capacity: typing.Optional[typing.Union[LbMinimumLoadBalancerCapacity, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    preserve_host_header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
    subnet_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LbSubnetMapping, typing.Dict[builtins.str, typing.Any]]]]] = None,
    subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[LbTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__c713c8a8c598807bc20e1bcd9a3482fac6da84d77dfaf268d005a39a0f9cedde(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d69b12f2a9cfdde272c8ba416bbea6e5db1a098b8ea1ade9c6089c8bd20c639(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LbSubnetMapping, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1969ebcba6f2e5d82fc22ff3c83de623b5e111727c2ed1c0df17b0d37d627fd(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d9b231c9f0669293b4432044cf79989e5da92a416e1bea12ecc1ece2fabe302(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2a180f4e5fbe3566fc6e82d6df0f73bac369723a3c0f4cc229936cb2254182f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d821be35bdf309d960aca54dec60fd2b3a55e124f7c5b190ff9a484ebf253472(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca16ccf532679219e358d1f4376737cf04ec300bcf58d83e4ae05fa310c4e4c7(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__667beb6993f74e1d42092bb76a2f675090a8a8a9b7ab83860b171ea029f1bc54(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d726e1d8581604b375e8a9f29b2289374d5c0ad16deba7601353554ba99941f7(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d75da204b88a59507db5c2bfec028e7482c648b5042832718bd906d3d8fe7726(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__558e5f0093d2358cfc3e474774c161cc5ad198fe243ea06da797c68214dbea70(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__55d00cd6270e90c84db09e9f5144001296ab0ebe6e676295e60ced09e655838a(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ec1c0a6dc679c339b5ca38fa3aa6581d4dc941bb9d036be4a86695f9d6abe9d(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1ddcf87e4e700d92f3b39f060dbd610cd9f08a4a6039793b575694acda445c6(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60079a288689366448cfd47f0b26ad0fc8918f149e4735d0f3ae7007833ba9f6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e9128a66825a4c329c57b01f3968dcca9c4c57989b9f382831f7f906c0e3bb9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce1ea006e2cfc9b19452cc4e51bfa15080ada287300bc0466b3f5d7078d85376(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40fe02d0673c79ff0aaf27bc3c1ac9df5c159f7bfac3a6dcdb413922a07434ba(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88a96ca797aa9a56700be5e1db47712d212c4d22f10a91d42671aed157e43b9a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3eee7694f953461a34d52edc387650322e7889a39838d107f52424a812fe75d7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67622cd73ca8be4f145e68b3c63323fba852501ac1adf73c22e6f0c9f55d369b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b1defc369dafe877f8fe9d512c93cd28cecbf063ba290fac8ba958d130f62f6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0685e5ac39f10bf16181f38d43cc4b2e62a9d89e57f874d5d4767cb14f4dfdae(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67a54c46417408444f89ce53f6f4f3f83682576cfd68463998bd95a213df3d81(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__20c72b795c7917b5f8a399366a61c743ac4d0f52785c2eeebac8d80491b7e6f9(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0775fdd886f75ff2038a8d978c1c33ca461c62ca0c610134d2407e74ba885dc6(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79227797b38f57178ce6c193c6d667bf3a72c3b3bbd1c78254fe49761941ad0f(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7cdeb8321b8c7a47d72fdb13f90c539de9011866727b3ce9b3d815611ed493b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0655af3b19e0f0043b08b1e3e2c44285767d6fad346999c669bb67b6dd136c2f(
    *,
    bucket: builtins.str,
    enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    prefix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__51817206d343d15f86221a9e7a883e7aa911ee21054f28797e2a7fd3dc8393da(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a91fbbebb9295b13cbf129e043aa8b8438c8e0fd426f2c1c666b089b1c112765(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43d34dc2ad26f83878c517043f6083f32018ba118174b5cbd4a2fc3d21ec9305(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ba0119658f6facffe01ea1055c93d52225c87f4539e73ad6c60732728f5e8c5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e26dbde1d5a6341568fbc9eb03604000ead57a2c278bce707bc26b4495c7a45(
    value: typing.Optional[LbAccessLogs],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__367cda3de9611a9722710688f961a089dbb9b10dfb69cead72485e29d0eac35f(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    access_logs: typing.Optional[typing.Union[LbAccessLogs, typing.Dict[builtins.str, typing.Any]]] = None,
    client_keep_alive: typing.Optional[jsii.Number] = None,
    connection_logs: typing.Optional[typing.Union[LbConnectionLogs, typing.Dict[builtins.str, typing.Any]]] = None,
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
    ipam_pools: typing.Optional[typing.Union[LbIpamPools, typing.Dict[builtins.str, typing.Any]]] = None,
    load_balancer_type: typing.Optional[builtins.str] = None,
    minimum_load_balancer_capacity: typing.Optional[typing.Union[LbMinimumLoadBalancerCapacity, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    preserve_host_header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
    subnet_mapping: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LbSubnetMapping, typing.Dict[builtins.str, typing.Any]]]]] = None,
    subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[LbTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    xff_header_processing_mode: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15c457f6262e57152b614e11ae013297b552d5602f185e3bfb3910ee1b8d273c(
    *,
    bucket: builtins.str,
    enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    prefix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b6cdf5520f18cf00032518de0d16111c9fbc5202ebbea44672e42743a34b735(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f6582511730e3b162df3c254b9be1fe5c863e2340368287195d1418863f0be3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e0805b8249553ee483e9e9cd48e3cba8908fe58039eeb81ef8a7d4caf4ed426(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5aaac9c777414f78411748d34c7fb1d3404c6ab7640ed59848eccef858ad099(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4130da3233a2dd47eb408a246b5843ae6fd844343189556d98c25923815c1c95(
    value: typing.Optional[LbConnectionLogs],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fef46556f034e44d9ab4f6f8bdb8412c5f7fc109143e9a15cd5b3657025ee488(
    *,
    ipv4_ipam_pool_id: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c79a4ded237721151cd794ca406904f37729dffff1a99268042aabc078ba91e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__005104740321cc7b21399c068ae0603ecef639a1f9b9dcceb4603798ceda4188(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f2c23bf53f1e25ca08de75b54ea532aff0ea56db44ad80bfbf5c881a61c252b(
    value: typing.Optional[LbIpamPools],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8326816027d4447ffb0739dfa832ab8479c63493a4aaab11f93b999fc3590266(
    *,
    capacity_units: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b24cb798aec12dfd03c7652aa8653e9f8e6afa702e7dfea29a3b520593bbe860(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76e13e99b9bb2035026bfffc4098a31148e9447d85bab6a0741d5854ed9b3bc9(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08d39ce946bfbcb550827357c0099569487867e775c394be467e53d7543921da(
    value: typing.Optional[LbMinimumLoadBalancerCapacity],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd26bd278f29a281e9438724a2a62409e1c43af82163771dbcdd413bb1e2d77b(
    *,
    subnet_id: builtins.str,
    allocation_id: typing.Optional[builtins.str] = None,
    ipv6_address: typing.Optional[builtins.str] = None,
    private_ipv4_address: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c4f544e80e25cff2a3ef637d2b2c8194d914757ca149076745091dd89335f34(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44143e44974d7d831bcbb5a860d15e43b6638cd4b1ed3fd242b8e746c08988cb(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc6508bf230a4ebad739fc84e181e39aa24ade1e357026360957a9d9d7836d9c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8877415dcc11938d4a52f31b7f7c9c0ab03773fe9c07a9b7b436533b4c87f18b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e142e7981fa3f9ab92aba91885e4d956a86e91e141b9a523f26bbf4538916ca(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7639941a5842264fc341f8bd02367286ee504743c4c5f7ea6dd25dde58f3cd7a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LbSubnetMapping]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__702adfe23c564d0d209b84910362871998df8c8bc434384130eaa5f364240fea(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eab64ad12168091f34cba92e1db9a413b8f4747754db9bac03ee2064489e9248(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f081b295727a542ca61520e23d4cb04959a108a697c48d68d37ffa082727781e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__13362bb30d0bd4e5633297f06712640eb98e4f677a0d712b45520031ef1c2fe6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__634479c63d5e70df1add8292262f5acbbf4cb9a2b5183ad14d297b593086f190(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__19ae96ae048d26fd1b9a9799dac38da056e6fd27d4ac9664821568e4a70f1ae0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbSubnetMapping]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21d7bc4382d6137b67b442b4690d2a5c7cf688ca5667f20a9d0b74ac0dde6f9e(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f130c7e67561b054de51edd4a6afd222984f82e5c4c4f1dbf22fdedd71394a29(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd201787c7fc70d9390d8837d27d0bf8459d180cfbc31ea52e21ae33aabb84af(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__992534300868f1bbe7dcb9278f74807f39ab1b24db16aab241d04f46adf4ef5e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5453341d07345766ab2045757abceca1a2cffa369c63511306324c08d3df3c87(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a544ae08dcc1111e2d8e389d555104efa9a5033eae954834795f0f526b3ee28e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
