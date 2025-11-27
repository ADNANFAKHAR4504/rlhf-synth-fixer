r'''
# `aws_lightsail_distribution`

Refer to the Terraform Registry for docs: [`aws_lightsail_distribution`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution).
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


class LightsailDistribution(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lightsailDistribution.LightsailDistribution",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution aws_lightsail_distribution}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        bundle_id: builtins.str,
        default_cache_behavior: typing.Union["LightsailDistributionDefaultCacheBehavior", typing.Dict[builtins.str, typing.Any]],
        name: builtins.str,
        origin: typing.Union["LightsailDistributionOrigin", typing.Dict[builtins.str, typing.Any]],
        cache_behavior: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["LightsailDistributionCacheBehavior", typing.Dict[builtins.str, typing.Any]]]]] = None,
        cache_behavior_settings: typing.Optional[typing.Union["LightsailDistributionCacheBehaviorSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        certificate_name: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        ip_address_type: typing.Optional[builtins.str] = None,
        is_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["LightsailDistributionTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution aws_lightsail_distribution} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param bundle_id: The bundle ID to use for the distribution. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#bundle_id LightsailDistribution#bundle_id}
        :param default_cache_behavior: default_cache_behavior block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#default_cache_behavior LightsailDistribution#default_cache_behavior}
        :param name: The name of the distribution. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#name LightsailDistribution#name}
        :param origin: origin block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#origin LightsailDistribution#origin}
        :param cache_behavior: cache_behavior block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior LightsailDistribution#cache_behavior}
        :param cache_behavior_settings: cache_behavior_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior_settings LightsailDistribution#cache_behavior_settings}
        :param certificate_name: The name of the SSL/TLS certificate attached to the distribution, if any. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#certificate_name LightsailDistribution#certificate_name}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#id LightsailDistribution#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param ip_address_type: The IP address type of the distribution. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#ip_address_type LightsailDistribution#ip_address_type}
        :param is_enabled: Indicates whether the distribution is enabled. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#is_enabled LightsailDistribution#is_enabled}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags LightsailDistribution#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags_all LightsailDistribution#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#timeouts LightsailDistribution#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8219c5df890e37ce76fe18d8a4f43b08d0dd2f5480d31ff429a643ac6bd8190c)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = LightsailDistributionConfig(
            bundle_id=bundle_id,
            default_cache_behavior=default_cache_behavior,
            name=name,
            origin=origin,
            cache_behavior=cache_behavior,
            cache_behavior_settings=cache_behavior_settings,
            certificate_name=certificate_name,
            id=id,
            ip_address_type=ip_address_type,
            is_enabled=is_enabled,
            tags=tags,
            tags_all=tags_all,
            timeouts=timeouts,
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
        '''Generates CDKTF code for importing a LightsailDistribution resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the LightsailDistribution to import.
        :param import_from_id: The id of the existing LightsailDistribution that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the LightsailDistribution to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81c7da33d97bacbc5758ea77dd2c32cab48988b9f8be07be39455ff196e78b1f)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putCacheBehavior")
    def put_cache_behavior(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["LightsailDistributionCacheBehavior", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__58328195f86c6853eada88ffe840aeac377cb7c73a1ef224486b6238a4edf0eb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCacheBehavior", [value]))

    @jsii.member(jsii_name="putCacheBehaviorSettings")
    def put_cache_behavior_settings(
        self,
        *,
        allowed_http_methods: typing.Optional[builtins.str] = None,
        cached_http_methods: typing.Optional[builtins.str] = None,
        default_ttl: typing.Optional[jsii.Number] = None,
        forwarded_cookies: typing.Optional[typing.Union["LightsailDistributionCacheBehaviorSettingsForwardedCookies", typing.Dict[builtins.str, typing.Any]]] = None,
        forwarded_headers: typing.Optional[typing.Union["LightsailDistributionCacheBehaviorSettingsForwardedHeaders", typing.Dict[builtins.str, typing.Any]]] = None,
        forwarded_query_strings: typing.Optional[typing.Union["LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings", typing.Dict[builtins.str, typing.Any]]] = None,
        maximum_ttl: typing.Optional[jsii.Number] = None,
        minimum_ttl: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param allowed_http_methods: The HTTP methods that are processed and forwarded to the distribution's origin. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#allowed_http_methods LightsailDistribution#allowed_http_methods}
        :param cached_http_methods: The HTTP method responses that are cached by your distribution. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cached_http_methods LightsailDistribution#cached_http_methods}
        :param default_ttl: The default amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the content has been updated. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#default_ttl LightsailDistribution#default_ttl}
        :param forwarded_cookies: forwarded_cookies block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_cookies LightsailDistribution#forwarded_cookies}
        :param forwarded_headers: forwarded_headers block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_headers LightsailDistribution#forwarded_headers}
        :param forwarded_query_strings: forwarded_query_strings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_query_strings LightsailDistribution#forwarded_query_strings}
        :param maximum_ttl: The maximum amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the object has been updated. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#maximum_ttl LightsailDistribution#maximum_ttl}
        :param minimum_ttl: The minimum amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the object has been updated. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#minimum_ttl LightsailDistribution#minimum_ttl}
        '''
        value = LightsailDistributionCacheBehaviorSettings(
            allowed_http_methods=allowed_http_methods,
            cached_http_methods=cached_http_methods,
            default_ttl=default_ttl,
            forwarded_cookies=forwarded_cookies,
            forwarded_headers=forwarded_headers,
            forwarded_query_strings=forwarded_query_strings,
            maximum_ttl=maximum_ttl,
            minimum_ttl=minimum_ttl,
        )

        return typing.cast(None, jsii.invoke(self, "putCacheBehaviorSettings", [value]))

    @jsii.member(jsii_name="putDefaultCacheBehavior")
    def put_default_cache_behavior(self, *, behavior: builtins.str) -> None:
        '''
        :param behavior: The cache behavior of the distribution. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#behavior LightsailDistribution#behavior}
        '''
        value = LightsailDistributionDefaultCacheBehavior(behavior=behavior)

        return typing.cast(None, jsii.invoke(self, "putDefaultCacheBehavior", [value]))

    @jsii.member(jsii_name="putOrigin")
    def put_origin(
        self,
        *,
        name: builtins.str,
        region_name: builtins.str,
        protocol_policy: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param name: The name of the origin resource. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#name LightsailDistribution#name}
        :param region_name: The AWS Region name of the origin resource. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#region_name LightsailDistribution#region_name}
        :param protocol_policy: The protocol that your Amazon Lightsail distribution uses when establishing a connection with your origin to pull content. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#protocol_policy LightsailDistribution#protocol_policy}
        '''
        value = LightsailDistributionOrigin(
            name=name, region_name=region_name, protocol_policy=protocol_policy
        )

        return typing.cast(None, jsii.invoke(self, "putOrigin", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#create LightsailDistribution#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#delete LightsailDistribution#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#update LightsailDistribution#update}.
        '''
        value = LightsailDistributionTimeouts(
            create=create, delete=delete, update=update
        )

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetCacheBehavior")
    def reset_cache_behavior(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCacheBehavior", []))

    @jsii.member(jsii_name="resetCacheBehaviorSettings")
    def reset_cache_behavior_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCacheBehaviorSettings", []))

    @jsii.member(jsii_name="resetCertificateName")
    def reset_certificate_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCertificateName", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetIpAddressType")
    def reset_ip_address_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIpAddressType", []))

    @jsii.member(jsii_name="resetIsEnabled")
    def reset_is_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIsEnabled", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

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
    @jsii.member(jsii_name="alternativeDomainNames")
    def alternative_domain_names(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "alternativeDomainNames"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @builtins.property
    @jsii.member(jsii_name="cacheBehavior")
    def cache_behavior(self) -> "LightsailDistributionCacheBehaviorList":
        return typing.cast("LightsailDistributionCacheBehaviorList", jsii.get(self, "cacheBehavior"))

    @builtins.property
    @jsii.member(jsii_name="cacheBehaviorSettings")
    def cache_behavior_settings(
        self,
    ) -> "LightsailDistributionCacheBehaviorSettingsOutputReference":
        return typing.cast("LightsailDistributionCacheBehaviorSettingsOutputReference", jsii.get(self, "cacheBehaviorSettings"))

    @builtins.property
    @jsii.member(jsii_name="createdAt")
    def created_at(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "createdAt"))

    @builtins.property
    @jsii.member(jsii_name="defaultCacheBehavior")
    def default_cache_behavior(
        self,
    ) -> "LightsailDistributionDefaultCacheBehaviorOutputReference":
        return typing.cast("LightsailDistributionDefaultCacheBehaviorOutputReference", jsii.get(self, "defaultCacheBehavior"))

    @builtins.property
    @jsii.member(jsii_name="domainName")
    def domain_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "domainName"))

    @builtins.property
    @jsii.member(jsii_name="location")
    def location(self) -> "LightsailDistributionLocationList":
        return typing.cast("LightsailDistributionLocationList", jsii.get(self, "location"))

    @builtins.property
    @jsii.member(jsii_name="origin")
    def origin(self) -> "LightsailDistributionOriginOutputReference":
        return typing.cast("LightsailDistributionOriginOutputReference", jsii.get(self, "origin"))

    @builtins.property
    @jsii.member(jsii_name="originPublicDns")
    def origin_public_dns(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "originPublicDns"))

    @builtins.property
    @jsii.member(jsii_name="resourceType")
    def resource_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resourceType"))

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @builtins.property
    @jsii.member(jsii_name="supportCode")
    def support_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "supportCode"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "LightsailDistributionTimeoutsOutputReference":
        return typing.cast("LightsailDistributionTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="bundleIdInput")
    def bundle_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bundleIdInput"))

    @builtins.property
    @jsii.member(jsii_name="cacheBehaviorInput")
    def cache_behavior_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LightsailDistributionCacheBehavior"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LightsailDistributionCacheBehavior"]]], jsii.get(self, "cacheBehaviorInput"))

    @builtins.property
    @jsii.member(jsii_name="cacheBehaviorSettingsInput")
    def cache_behavior_settings_input(
        self,
    ) -> typing.Optional["LightsailDistributionCacheBehaviorSettings"]:
        return typing.cast(typing.Optional["LightsailDistributionCacheBehaviorSettings"], jsii.get(self, "cacheBehaviorSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="certificateNameInput")
    def certificate_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "certificateNameInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultCacheBehaviorInput")
    def default_cache_behavior_input(
        self,
    ) -> typing.Optional["LightsailDistributionDefaultCacheBehavior"]:
        return typing.cast(typing.Optional["LightsailDistributionDefaultCacheBehavior"], jsii.get(self, "defaultCacheBehaviorInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="ipAddressTypeInput")
    def ip_address_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ipAddressTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="isEnabledInput")
    def is_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "isEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="originInput")
    def origin_input(self) -> typing.Optional["LightsailDistributionOrigin"]:
        return typing.cast(typing.Optional["LightsailDistributionOrigin"], jsii.get(self, "originInput"))

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
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "LightsailDistributionTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "LightsailDistributionTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="bundleId")
    def bundle_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bundleId"))

    @bundle_id.setter
    def bundle_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c65137e129bdab915dc22e71b2204df153066a406fe50145296c4b8fa20230ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bundleId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="certificateName")
    def certificate_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "certificateName"))

    @certificate_name.setter
    def certificate_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d34ae901eef2d32e057a68998e4d098f927d8d42f3013eb5f246594ef4ee5aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "certificateName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__786770455acf024b1a90c990647841cc1d0182ccec6c8a7a8c75988add62f956)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ipAddressType")
    def ip_address_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ipAddressType"))

    @ip_address_type.setter
    def ip_address_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f0e7b581b70b81f54ac029b72b66fa97ce0ba323b0246392da0bd738bfebc1cd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ipAddressType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="isEnabled")
    def is_enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "isEnabled"))

    @is_enabled.setter
    def is_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15de40ac783dc3e985826a14bb4fe7109519adc4fa6d61f7dc43f311c8a1b020)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "isEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__631e83d680c6647b3cee336d0cae513f70ab7e0353323d92507d0eed59356b44)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4fcedab4ae7d266b69a39f76bbd7a1b36f51945f746845f8b352c22bcd0d72dc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__82a1b24b0ff021de520c133f221101ab9177d59561d424b1c4f1d6596eb42753)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lightsailDistribution.LightsailDistributionCacheBehavior",
    jsii_struct_bases=[],
    name_mapping={"behavior": "behavior", "path": "path"},
)
class LightsailDistributionCacheBehavior:
    def __init__(self, *, behavior: builtins.str, path: builtins.str) -> None:
        '''
        :param behavior: The cache behavior for the specified path. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#behavior LightsailDistribution#behavior}
        :param path: The path to a directory or file to cached, or not cache. Use an asterisk symbol to specify wildcard directories (path/to/assets/*), and file types (*.html, *jpg, *js). Directories and file paths are case-sensitive. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#path LightsailDistribution#path}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4adb17f4bf497ef341a63dfb5b7c860836c49bbe1bc1b41a485bbfa23171c0ce)
            check_type(argname="argument behavior", value=behavior, expected_type=type_hints["behavior"])
            check_type(argname="argument path", value=path, expected_type=type_hints["path"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "behavior": behavior,
            "path": path,
        }

    @builtins.property
    def behavior(self) -> builtins.str:
        '''The cache behavior for the specified path.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#behavior LightsailDistribution#behavior}
        '''
        result = self._values.get("behavior")
        assert result is not None, "Required property 'behavior' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def path(self) -> builtins.str:
        '''The path to a directory or file to cached, or not cache.

        Use an asterisk symbol to specify wildcard directories (path/to/assets/*), and file types (*.html, *jpg, *js). Directories and file paths are case-sensitive.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#path LightsailDistribution#path}
        '''
        result = self._values.get("path")
        assert result is not None, "Required property 'path' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LightsailDistributionCacheBehavior(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LightsailDistributionCacheBehaviorList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lightsailDistribution.LightsailDistributionCacheBehaviorList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__965de12cc25f711caca03e2d986f9899f4fd3022790926162e6a1177d9cbcf56)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "LightsailDistributionCacheBehaviorOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ef45cc51e04b709377bb68b96a3def877ffc5be2741328a950a73894799331ef)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("LightsailDistributionCacheBehaviorOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9e5467d7943b057ea1cc8dbf126475870aab3b657da57340d927e95c5a02413)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7e45c11a474a19ffc16a97c1a8ac356cc69f195fb707549d19a63791ac5b3395)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bc5ea4459c74bea5277b6a1c73da5412fe826943e42ab87654d4aba9f89a722d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LightsailDistributionCacheBehavior]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LightsailDistributionCacheBehavior]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LightsailDistributionCacheBehavior]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__71ff31e274fc7cf36afdb1d32c844213d638a3de12cf84121a5639aff9d5df72)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class LightsailDistributionCacheBehaviorOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lightsailDistribution.LightsailDistributionCacheBehaviorOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__063ad7b16bd93207c13f13f14be311251eb45bb49a1bf0c95a25378108a3203a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="behaviorInput")
    def behavior_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "behaviorInput"))

    @builtins.property
    @jsii.member(jsii_name="pathInput")
    def path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "pathInput"))

    @builtins.property
    @jsii.member(jsii_name="behavior")
    def behavior(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "behavior"))

    @behavior.setter
    def behavior(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__adb2c901731e8db3128fb838ed0e94925dd517047c8ba75739ec4339b2403aa7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "behavior", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="path")
    def path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "path"))

    @path.setter
    def path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a898695961dc5d478da021308b85454468edada05bc831a0e7e3aa5185878a3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "path", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LightsailDistributionCacheBehavior]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LightsailDistributionCacheBehavior]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LightsailDistributionCacheBehavior]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__39173709aab0007ec52af56c3a8e7a7d03894d23eb48f5159873f8e1ebc8e533)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettings",
    jsii_struct_bases=[],
    name_mapping={
        "allowed_http_methods": "allowedHttpMethods",
        "cached_http_methods": "cachedHttpMethods",
        "default_ttl": "defaultTtl",
        "forwarded_cookies": "forwardedCookies",
        "forwarded_headers": "forwardedHeaders",
        "forwarded_query_strings": "forwardedQueryStrings",
        "maximum_ttl": "maximumTtl",
        "minimum_ttl": "minimumTtl",
    },
)
class LightsailDistributionCacheBehaviorSettings:
    def __init__(
        self,
        *,
        allowed_http_methods: typing.Optional[builtins.str] = None,
        cached_http_methods: typing.Optional[builtins.str] = None,
        default_ttl: typing.Optional[jsii.Number] = None,
        forwarded_cookies: typing.Optional[typing.Union["LightsailDistributionCacheBehaviorSettingsForwardedCookies", typing.Dict[builtins.str, typing.Any]]] = None,
        forwarded_headers: typing.Optional[typing.Union["LightsailDistributionCacheBehaviorSettingsForwardedHeaders", typing.Dict[builtins.str, typing.Any]]] = None,
        forwarded_query_strings: typing.Optional[typing.Union["LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings", typing.Dict[builtins.str, typing.Any]]] = None,
        maximum_ttl: typing.Optional[jsii.Number] = None,
        minimum_ttl: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param allowed_http_methods: The HTTP methods that are processed and forwarded to the distribution's origin. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#allowed_http_methods LightsailDistribution#allowed_http_methods}
        :param cached_http_methods: The HTTP method responses that are cached by your distribution. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cached_http_methods LightsailDistribution#cached_http_methods}
        :param default_ttl: The default amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the content has been updated. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#default_ttl LightsailDistribution#default_ttl}
        :param forwarded_cookies: forwarded_cookies block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_cookies LightsailDistribution#forwarded_cookies}
        :param forwarded_headers: forwarded_headers block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_headers LightsailDistribution#forwarded_headers}
        :param forwarded_query_strings: forwarded_query_strings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_query_strings LightsailDistribution#forwarded_query_strings}
        :param maximum_ttl: The maximum amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the object has been updated. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#maximum_ttl LightsailDistribution#maximum_ttl}
        :param minimum_ttl: The minimum amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the object has been updated. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#minimum_ttl LightsailDistribution#minimum_ttl}
        '''
        if isinstance(forwarded_cookies, dict):
            forwarded_cookies = LightsailDistributionCacheBehaviorSettingsForwardedCookies(**forwarded_cookies)
        if isinstance(forwarded_headers, dict):
            forwarded_headers = LightsailDistributionCacheBehaviorSettingsForwardedHeaders(**forwarded_headers)
        if isinstance(forwarded_query_strings, dict):
            forwarded_query_strings = LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings(**forwarded_query_strings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__275a03ca767ccfbdef4a079289593cdf3cf436768acaccfe31c46d4756195c7e)
            check_type(argname="argument allowed_http_methods", value=allowed_http_methods, expected_type=type_hints["allowed_http_methods"])
            check_type(argname="argument cached_http_methods", value=cached_http_methods, expected_type=type_hints["cached_http_methods"])
            check_type(argname="argument default_ttl", value=default_ttl, expected_type=type_hints["default_ttl"])
            check_type(argname="argument forwarded_cookies", value=forwarded_cookies, expected_type=type_hints["forwarded_cookies"])
            check_type(argname="argument forwarded_headers", value=forwarded_headers, expected_type=type_hints["forwarded_headers"])
            check_type(argname="argument forwarded_query_strings", value=forwarded_query_strings, expected_type=type_hints["forwarded_query_strings"])
            check_type(argname="argument maximum_ttl", value=maximum_ttl, expected_type=type_hints["maximum_ttl"])
            check_type(argname="argument minimum_ttl", value=minimum_ttl, expected_type=type_hints["minimum_ttl"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if allowed_http_methods is not None:
            self._values["allowed_http_methods"] = allowed_http_methods
        if cached_http_methods is not None:
            self._values["cached_http_methods"] = cached_http_methods
        if default_ttl is not None:
            self._values["default_ttl"] = default_ttl
        if forwarded_cookies is not None:
            self._values["forwarded_cookies"] = forwarded_cookies
        if forwarded_headers is not None:
            self._values["forwarded_headers"] = forwarded_headers
        if forwarded_query_strings is not None:
            self._values["forwarded_query_strings"] = forwarded_query_strings
        if maximum_ttl is not None:
            self._values["maximum_ttl"] = maximum_ttl
        if minimum_ttl is not None:
            self._values["minimum_ttl"] = minimum_ttl

    @builtins.property
    def allowed_http_methods(self) -> typing.Optional[builtins.str]:
        '''The HTTP methods that are processed and forwarded to the distribution's origin.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#allowed_http_methods LightsailDistribution#allowed_http_methods}
        '''
        result = self._values.get("allowed_http_methods")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def cached_http_methods(self) -> typing.Optional[builtins.str]:
        '''The HTTP method responses that are cached by your distribution.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cached_http_methods LightsailDistribution#cached_http_methods}
        '''
        result = self._values.get("cached_http_methods")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def default_ttl(self) -> typing.Optional[jsii.Number]:
        '''The default amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the content has been updated.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#default_ttl LightsailDistribution#default_ttl}
        '''
        result = self._values.get("default_ttl")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def forwarded_cookies(
        self,
    ) -> typing.Optional["LightsailDistributionCacheBehaviorSettingsForwardedCookies"]:
        '''forwarded_cookies block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_cookies LightsailDistribution#forwarded_cookies}
        '''
        result = self._values.get("forwarded_cookies")
        return typing.cast(typing.Optional["LightsailDistributionCacheBehaviorSettingsForwardedCookies"], result)

    @builtins.property
    def forwarded_headers(
        self,
    ) -> typing.Optional["LightsailDistributionCacheBehaviorSettingsForwardedHeaders"]:
        '''forwarded_headers block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_headers LightsailDistribution#forwarded_headers}
        '''
        result = self._values.get("forwarded_headers")
        return typing.cast(typing.Optional["LightsailDistributionCacheBehaviorSettingsForwardedHeaders"], result)

    @builtins.property
    def forwarded_query_strings(
        self,
    ) -> typing.Optional["LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings"]:
        '''forwarded_query_strings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_query_strings LightsailDistribution#forwarded_query_strings}
        '''
        result = self._values.get("forwarded_query_strings")
        return typing.cast(typing.Optional["LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings"], result)

    @builtins.property
    def maximum_ttl(self) -> typing.Optional[jsii.Number]:
        '''The maximum amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the object has been updated.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#maximum_ttl LightsailDistribution#maximum_ttl}
        '''
        result = self._values.get("maximum_ttl")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def minimum_ttl(self) -> typing.Optional[jsii.Number]:
        '''The minimum amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the object has been updated.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#minimum_ttl LightsailDistribution#minimum_ttl}
        '''
        result = self._values.get("minimum_ttl")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LightsailDistributionCacheBehaviorSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedCookies",
    jsii_struct_bases=[],
    name_mapping={"cookies_allow_list": "cookiesAllowList", "option": "option"},
)
class LightsailDistributionCacheBehaviorSettingsForwardedCookies:
    def __init__(
        self,
        *,
        cookies_allow_list: typing.Optional[typing.Sequence[builtins.str]] = None,
        option: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param cookies_allow_list: The specific cookies to forward to your distribution's origin. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cookies_allow_list LightsailDistribution#cookies_allow_list}
        :param option: Specifies which cookies to forward to the distribution's origin for a cache behavior: all, none, or allow-list to forward only the cookies specified in the cookiesAllowList parameter. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b607a66fdd6fcd4c7846069673c01fa88c72ee055b513b2a64b6ded80fa68544)
            check_type(argname="argument cookies_allow_list", value=cookies_allow_list, expected_type=type_hints["cookies_allow_list"])
            check_type(argname="argument option", value=option, expected_type=type_hints["option"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if cookies_allow_list is not None:
            self._values["cookies_allow_list"] = cookies_allow_list
        if option is not None:
            self._values["option"] = option

    @builtins.property
    def cookies_allow_list(self) -> typing.Optional[typing.List[builtins.str]]:
        '''The specific cookies to forward to your distribution's origin.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cookies_allow_list LightsailDistribution#cookies_allow_list}
        '''
        result = self._values.get("cookies_allow_list")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def option(self) -> typing.Optional[builtins.str]:
        '''Specifies which cookies to forward to the distribution's origin for a cache behavior: all, none, or allow-list to forward only the cookies specified in the cookiesAllowList parameter.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
        '''
        result = self._values.get("option")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LightsailDistributionCacheBehaviorSettingsForwardedCookies(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LightsailDistributionCacheBehaviorSettingsForwardedCookiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedCookiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__af134bc2d70752090c423b0fa5198af06d0384cf1ee72657caea3d38eba85fd0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCookiesAllowList")
    def reset_cookies_allow_list(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCookiesAllowList", []))

    @jsii.member(jsii_name="resetOption")
    def reset_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOption", []))

    @builtins.property
    @jsii.member(jsii_name="cookiesAllowListInput")
    def cookies_allow_list_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "cookiesAllowListInput"))

    @builtins.property
    @jsii.member(jsii_name="optionInput")
    def option_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "optionInput"))

    @builtins.property
    @jsii.member(jsii_name="cookiesAllowList")
    def cookies_allow_list(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "cookiesAllowList"))

    @cookies_allow_list.setter
    def cookies_allow_list(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0fb522d5f6431e66821a9510d30b76640b83a39360fe487526026460a98cda90)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cookiesAllowList", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="option")
    def option(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "option"))

    @option.setter
    def option(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b97ea6818973c4b52e8270d1c3c78d07cb9840910bf50165d4e670d04a18bb5a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "option", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedCookies]:
        return typing.cast(typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedCookies], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedCookies],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f9156912e41e2258b6cec588100cff47672c9bf56e858e5a1a11ab0f215d03d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedHeaders",
    jsii_struct_bases=[],
    name_mapping={"headers_allow_list": "headersAllowList", "option": "option"},
)
class LightsailDistributionCacheBehaviorSettingsForwardedHeaders:
    def __init__(
        self,
        *,
        headers_allow_list: typing.Optional[typing.Sequence[builtins.str]] = None,
        option: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param headers_allow_list: The specific headers to forward to your distribution's origin. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#headers_allow_list LightsailDistribution#headers_allow_list}
        :param option: The headers that you want your distribution to forward to your origin and base caching on. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1e479f419a07f0a403ea055979304e9eecf9862608d92a01b1e01ca66c45f88)
            check_type(argname="argument headers_allow_list", value=headers_allow_list, expected_type=type_hints["headers_allow_list"])
            check_type(argname="argument option", value=option, expected_type=type_hints["option"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if headers_allow_list is not None:
            self._values["headers_allow_list"] = headers_allow_list
        if option is not None:
            self._values["option"] = option

    @builtins.property
    def headers_allow_list(self) -> typing.Optional[typing.List[builtins.str]]:
        '''The specific headers to forward to your distribution's origin.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#headers_allow_list LightsailDistribution#headers_allow_list}
        '''
        result = self._values.get("headers_allow_list")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def option(self) -> typing.Optional[builtins.str]:
        '''The headers that you want your distribution to forward to your origin and base caching on.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
        '''
        result = self._values.get("option")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LightsailDistributionCacheBehaviorSettingsForwardedHeaders(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LightsailDistributionCacheBehaviorSettingsForwardedHeadersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedHeadersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ed8ad76b4610ad7587d2e272902cc2914ebed9b03ae67b322dc1b2cfd8327e8f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetHeadersAllowList")
    def reset_headers_allow_list(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHeadersAllowList", []))

    @jsii.member(jsii_name="resetOption")
    def reset_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOption", []))

    @builtins.property
    @jsii.member(jsii_name="headersAllowListInput")
    def headers_allow_list_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "headersAllowListInput"))

    @builtins.property
    @jsii.member(jsii_name="optionInput")
    def option_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "optionInput"))

    @builtins.property
    @jsii.member(jsii_name="headersAllowList")
    def headers_allow_list(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "headersAllowList"))

    @headers_allow_list.setter
    def headers_allow_list(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ffcad4808625c44ef52b37936783e024f7e7cf9e1c1435a22a8d416609e62152)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "headersAllowList", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="option")
    def option(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "option"))

    @option.setter
    def option(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__faf3eabb8258acfef0a2f40dff6bf77dbc3d5a6148a52fb57e612b9e02a1795b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "option", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedHeaders]:
        return typing.cast(typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedHeaders], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedHeaders],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6461c479024083f647d83ea932a7f369c5f34a280dc889762dac2369da4bb7f2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings",
    jsii_struct_bases=[],
    name_mapping={
        "option": "option",
        "query_strings_allowed_list": "queryStringsAllowedList",
    },
)
class LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings:
    def __init__(
        self,
        *,
        option: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        query_strings_allowed_list: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param option: Indicates whether the distribution forwards and caches based on query strings. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
        :param query_strings_allowed_list: The specific query strings that the distribution forwards to the origin. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#query_strings_allowed_list LightsailDistribution#query_strings_allowed_list}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a7081b51a2e7d99781af292802ef1c5a701037a6ad47af3a131e8e9b2e047b9d)
            check_type(argname="argument option", value=option, expected_type=type_hints["option"])
            check_type(argname="argument query_strings_allowed_list", value=query_strings_allowed_list, expected_type=type_hints["query_strings_allowed_list"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if option is not None:
            self._values["option"] = option
        if query_strings_allowed_list is not None:
            self._values["query_strings_allowed_list"] = query_strings_allowed_list

    @builtins.property
    def option(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Indicates whether the distribution forwards and caches based on query strings.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
        '''
        result = self._values.get("option")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def query_strings_allowed_list(self) -> typing.Optional[typing.List[builtins.str]]:
        '''The specific query strings that the distribution forwards to the origin.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#query_strings_allowed_list LightsailDistribution#query_strings_allowed_list}
        '''
        result = self._values.get("query_strings_allowed_list")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LightsailDistributionCacheBehaviorSettingsForwardedQueryStringsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStringsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b3a398ff94a213125e446a24faca650f98657ed530028f233a081a976e92e15f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetOption")
    def reset_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOption", []))

    @jsii.member(jsii_name="resetQueryStringsAllowedList")
    def reset_query_strings_allowed_list(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetQueryStringsAllowedList", []))

    @builtins.property
    @jsii.member(jsii_name="optionInput")
    def option_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "optionInput"))

    @builtins.property
    @jsii.member(jsii_name="queryStringsAllowedListInput")
    def query_strings_allowed_list_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "queryStringsAllowedListInput"))

    @builtins.property
    @jsii.member(jsii_name="option")
    def option(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "option"))

    @option.setter
    def option(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e73f4532e1ef1047336ef111d609b34af048a07856f4123f9731d7fbf19057c9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "option", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="queryStringsAllowedList")
    def query_strings_allowed_list(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "queryStringsAllowedList"))

    @query_strings_allowed_list.setter
    def query_strings_allowed_list(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7af7fb6dcc247a5a20110129f50fda2c35bcb4d1b85003b501be0bfba67349e2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "queryStringsAllowedList", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings]:
        return typing.cast(typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d7814f3e9b2dbfb64e963d4cd629597cd1ea4be3e642ff8aa5eea3e81af5186)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class LightsailDistributionCacheBehaviorSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2985abeb46f5076d9a65407b65ed8e116f6c934db481a3de0f57a19a4f4517d7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putForwardedCookies")
    def put_forwarded_cookies(
        self,
        *,
        cookies_allow_list: typing.Optional[typing.Sequence[builtins.str]] = None,
        option: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param cookies_allow_list: The specific cookies to forward to your distribution's origin. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cookies_allow_list LightsailDistribution#cookies_allow_list}
        :param option: Specifies which cookies to forward to the distribution's origin for a cache behavior: all, none, or allow-list to forward only the cookies specified in the cookiesAllowList parameter. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
        '''
        value = LightsailDistributionCacheBehaviorSettingsForwardedCookies(
            cookies_allow_list=cookies_allow_list, option=option
        )

        return typing.cast(None, jsii.invoke(self, "putForwardedCookies", [value]))

    @jsii.member(jsii_name="putForwardedHeaders")
    def put_forwarded_headers(
        self,
        *,
        headers_allow_list: typing.Optional[typing.Sequence[builtins.str]] = None,
        option: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param headers_allow_list: The specific headers to forward to your distribution's origin. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#headers_allow_list LightsailDistribution#headers_allow_list}
        :param option: The headers that you want your distribution to forward to your origin and base caching on. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
        '''
        value = LightsailDistributionCacheBehaviorSettingsForwardedHeaders(
            headers_allow_list=headers_allow_list, option=option
        )

        return typing.cast(None, jsii.invoke(self, "putForwardedHeaders", [value]))

    @jsii.member(jsii_name="putForwardedQueryStrings")
    def put_forwarded_query_strings(
        self,
        *,
        option: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        query_strings_allowed_list: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param option: Indicates whether the distribution forwards and caches based on query strings. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
        :param query_strings_allowed_list: The specific query strings that the distribution forwards to the origin. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#query_strings_allowed_list LightsailDistribution#query_strings_allowed_list}
        '''
        value = LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings(
            option=option, query_strings_allowed_list=query_strings_allowed_list
        )

        return typing.cast(None, jsii.invoke(self, "putForwardedQueryStrings", [value]))

    @jsii.member(jsii_name="resetAllowedHttpMethods")
    def reset_allowed_http_methods(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllowedHttpMethods", []))

    @jsii.member(jsii_name="resetCachedHttpMethods")
    def reset_cached_http_methods(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCachedHttpMethods", []))

    @jsii.member(jsii_name="resetDefaultTtl")
    def reset_default_ttl(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultTtl", []))

    @jsii.member(jsii_name="resetForwardedCookies")
    def reset_forwarded_cookies(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetForwardedCookies", []))

    @jsii.member(jsii_name="resetForwardedHeaders")
    def reset_forwarded_headers(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetForwardedHeaders", []))

    @jsii.member(jsii_name="resetForwardedQueryStrings")
    def reset_forwarded_query_strings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetForwardedQueryStrings", []))

    @jsii.member(jsii_name="resetMaximumTtl")
    def reset_maximum_ttl(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumTtl", []))

    @jsii.member(jsii_name="resetMinimumTtl")
    def reset_minimum_ttl(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinimumTtl", []))

    @builtins.property
    @jsii.member(jsii_name="forwardedCookies")
    def forwarded_cookies(
        self,
    ) -> LightsailDistributionCacheBehaviorSettingsForwardedCookiesOutputReference:
        return typing.cast(LightsailDistributionCacheBehaviorSettingsForwardedCookiesOutputReference, jsii.get(self, "forwardedCookies"))

    @builtins.property
    @jsii.member(jsii_name="forwardedHeaders")
    def forwarded_headers(
        self,
    ) -> LightsailDistributionCacheBehaviorSettingsForwardedHeadersOutputReference:
        return typing.cast(LightsailDistributionCacheBehaviorSettingsForwardedHeadersOutputReference, jsii.get(self, "forwardedHeaders"))

    @builtins.property
    @jsii.member(jsii_name="forwardedQueryStrings")
    def forwarded_query_strings(
        self,
    ) -> LightsailDistributionCacheBehaviorSettingsForwardedQueryStringsOutputReference:
        return typing.cast(LightsailDistributionCacheBehaviorSettingsForwardedQueryStringsOutputReference, jsii.get(self, "forwardedQueryStrings"))

    @builtins.property
    @jsii.member(jsii_name="allowedHttpMethodsInput")
    def allowed_http_methods_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "allowedHttpMethodsInput"))

    @builtins.property
    @jsii.member(jsii_name="cachedHttpMethodsInput")
    def cached_http_methods_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cachedHttpMethodsInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultTtlInput")
    def default_ttl_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "defaultTtlInput"))

    @builtins.property
    @jsii.member(jsii_name="forwardedCookiesInput")
    def forwarded_cookies_input(
        self,
    ) -> typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedCookies]:
        return typing.cast(typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedCookies], jsii.get(self, "forwardedCookiesInput"))

    @builtins.property
    @jsii.member(jsii_name="forwardedHeadersInput")
    def forwarded_headers_input(
        self,
    ) -> typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedHeaders]:
        return typing.cast(typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedHeaders], jsii.get(self, "forwardedHeadersInput"))

    @builtins.property
    @jsii.member(jsii_name="forwardedQueryStringsInput")
    def forwarded_query_strings_input(
        self,
    ) -> typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings]:
        return typing.cast(typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings], jsii.get(self, "forwardedQueryStringsInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumTtlInput")
    def maximum_ttl_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumTtlInput"))

    @builtins.property
    @jsii.member(jsii_name="minimumTtlInput")
    def minimum_ttl_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minimumTtlInput"))

    @builtins.property
    @jsii.member(jsii_name="allowedHttpMethods")
    def allowed_http_methods(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "allowedHttpMethods"))

    @allowed_http_methods.setter
    def allowed_http_methods(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__44910c0a8595023fae13b0d6194fb7c226bcc8d27e11b2764fc3704a624bfc14)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "allowedHttpMethods", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="cachedHttpMethods")
    def cached_http_methods(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "cachedHttpMethods"))

    @cached_http_methods.setter
    def cached_http_methods(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9726c892e2b7d48e42aed31207313b477626e9d6ddcd229699ca3ce6f3073c16)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cachedHttpMethods", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="defaultTtl")
    def default_ttl(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "defaultTtl"))

    @default_ttl.setter
    def default_ttl(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b54d5fb9580c828d9d4a6c26ac64bbb7e650be9160c77b8a59011a69fcfd5893)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultTtl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumTtl")
    def maximum_ttl(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumTtl"))

    @maximum_ttl.setter
    def maximum_ttl(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e9bd870b14d9200966bd164f87b6b3633653439a633726c6eb997bca4d15277)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumTtl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minimumTtl")
    def minimum_ttl(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minimumTtl"))

    @minimum_ttl.setter
    def minimum_ttl(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d013414fd25fd1f058a68816fa5ef518d696ac1727b9051c8c80bbd1f5e55777)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minimumTtl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[LightsailDistributionCacheBehaviorSettings]:
        return typing.cast(typing.Optional[LightsailDistributionCacheBehaviorSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LightsailDistributionCacheBehaviorSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f55fc29c9bce0583d43f7d30e2433db2f7887ac210dc1d103e29c45e9d6174c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lightsailDistribution.LightsailDistributionConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "bundle_id": "bundleId",
        "default_cache_behavior": "defaultCacheBehavior",
        "name": "name",
        "origin": "origin",
        "cache_behavior": "cacheBehavior",
        "cache_behavior_settings": "cacheBehaviorSettings",
        "certificate_name": "certificateName",
        "id": "id",
        "ip_address_type": "ipAddressType",
        "is_enabled": "isEnabled",
        "tags": "tags",
        "tags_all": "tagsAll",
        "timeouts": "timeouts",
    },
)
class LightsailDistributionConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        bundle_id: builtins.str,
        default_cache_behavior: typing.Union["LightsailDistributionDefaultCacheBehavior", typing.Dict[builtins.str, typing.Any]],
        name: builtins.str,
        origin: typing.Union["LightsailDistributionOrigin", typing.Dict[builtins.str, typing.Any]],
        cache_behavior: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LightsailDistributionCacheBehavior, typing.Dict[builtins.str, typing.Any]]]]] = None,
        cache_behavior_settings: typing.Optional[typing.Union[LightsailDistributionCacheBehaviorSettings, typing.Dict[builtins.str, typing.Any]]] = None,
        certificate_name: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        ip_address_type: typing.Optional[builtins.str] = None,
        is_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["LightsailDistributionTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param bundle_id: The bundle ID to use for the distribution. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#bundle_id LightsailDistribution#bundle_id}
        :param default_cache_behavior: default_cache_behavior block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#default_cache_behavior LightsailDistribution#default_cache_behavior}
        :param name: The name of the distribution. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#name LightsailDistribution#name}
        :param origin: origin block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#origin LightsailDistribution#origin}
        :param cache_behavior: cache_behavior block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior LightsailDistribution#cache_behavior}
        :param cache_behavior_settings: cache_behavior_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior_settings LightsailDistribution#cache_behavior_settings}
        :param certificate_name: The name of the SSL/TLS certificate attached to the distribution, if any. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#certificate_name LightsailDistribution#certificate_name}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#id LightsailDistribution#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param ip_address_type: The IP address type of the distribution. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#ip_address_type LightsailDistribution#ip_address_type}
        :param is_enabled: Indicates whether the distribution is enabled. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#is_enabled LightsailDistribution#is_enabled}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags LightsailDistribution#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags_all LightsailDistribution#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#timeouts LightsailDistribution#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(default_cache_behavior, dict):
            default_cache_behavior = LightsailDistributionDefaultCacheBehavior(**default_cache_behavior)
        if isinstance(origin, dict):
            origin = LightsailDistributionOrigin(**origin)
        if isinstance(cache_behavior_settings, dict):
            cache_behavior_settings = LightsailDistributionCacheBehaviorSettings(**cache_behavior_settings)
        if isinstance(timeouts, dict):
            timeouts = LightsailDistributionTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab9637631e77ffb7ec867c0d6a2eb6a293ea054e7714af230ec73cc831583def)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument bundle_id", value=bundle_id, expected_type=type_hints["bundle_id"])
            check_type(argname="argument default_cache_behavior", value=default_cache_behavior, expected_type=type_hints["default_cache_behavior"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument origin", value=origin, expected_type=type_hints["origin"])
            check_type(argname="argument cache_behavior", value=cache_behavior, expected_type=type_hints["cache_behavior"])
            check_type(argname="argument cache_behavior_settings", value=cache_behavior_settings, expected_type=type_hints["cache_behavior_settings"])
            check_type(argname="argument certificate_name", value=certificate_name, expected_type=type_hints["certificate_name"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument ip_address_type", value=ip_address_type, expected_type=type_hints["ip_address_type"])
            check_type(argname="argument is_enabled", value=is_enabled, expected_type=type_hints["is_enabled"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "bundle_id": bundle_id,
            "default_cache_behavior": default_cache_behavior,
            "name": name,
            "origin": origin,
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
        if cache_behavior is not None:
            self._values["cache_behavior"] = cache_behavior
        if cache_behavior_settings is not None:
            self._values["cache_behavior_settings"] = cache_behavior_settings
        if certificate_name is not None:
            self._values["certificate_name"] = certificate_name
        if id is not None:
            self._values["id"] = id
        if ip_address_type is not None:
            self._values["ip_address_type"] = ip_address_type
        if is_enabled is not None:
            self._values["is_enabled"] = is_enabled
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
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
    def bundle_id(self) -> builtins.str:
        '''The bundle ID to use for the distribution.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#bundle_id LightsailDistribution#bundle_id}
        '''
        result = self._values.get("bundle_id")
        assert result is not None, "Required property 'bundle_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def default_cache_behavior(self) -> "LightsailDistributionDefaultCacheBehavior":
        '''default_cache_behavior block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#default_cache_behavior LightsailDistribution#default_cache_behavior}
        '''
        result = self._values.get("default_cache_behavior")
        assert result is not None, "Required property 'default_cache_behavior' is missing"
        return typing.cast("LightsailDistributionDefaultCacheBehavior", result)

    @builtins.property
    def name(self) -> builtins.str:
        '''The name of the distribution.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#name LightsailDistribution#name}
        '''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def origin(self) -> "LightsailDistributionOrigin":
        '''origin block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#origin LightsailDistribution#origin}
        '''
        result = self._values.get("origin")
        assert result is not None, "Required property 'origin' is missing"
        return typing.cast("LightsailDistributionOrigin", result)

    @builtins.property
    def cache_behavior(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LightsailDistributionCacheBehavior]]]:
        '''cache_behavior block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior LightsailDistribution#cache_behavior}
        '''
        result = self._values.get("cache_behavior")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LightsailDistributionCacheBehavior]]], result)

    @builtins.property
    def cache_behavior_settings(
        self,
    ) -> typing.Optional[LightsailDistributionCacheBehaviorSettings]:
        '''cache_behavior_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior_settings LightsailDistribution#cache_behavior_settings}
        '''
        result = self._values.get("cache_behavior_settings")
        return typing.cast(typing.Optional[LightsailDistributionCacheBehaviorSettings], result)

    @builtins.property
    def certificate_name(self) -> typing.Optional[builtins.str]:
        '''The name of the SSL/TLS certificate attached to the distribution, if any.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#certificate_name LightsailDistribution#certificate_name}
        '''
        result = self._values.get("certificate_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#id LightsailDistribution#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ip_address_type(self) -> typing.Optional[builtins.str]:
        '''The IP address type of the distribution.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#ip_address_type LightsailDistribution#ip_address_type}
        '''
        result = self._values.get("ip_address_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def is_enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Indicates whether the distribution is enabled.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#is_enabled LightsailDistribution#is_enabled}
        '''
        result = self._values.get("is_enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags LightsailDistribution#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags_all LightsailDistribution#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["LightsailDistributionTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#timeouts LightsailDistribution#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["LightsailDistributionTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LightsailDistributionConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.lightsailDistribution.LightsailDistributionDefaultCacheBehavior",
    jsii_struct_bases=[],
    name_mapping={"behavior": "behavior"},
)
class LightsailDistributionDefaultCacheBehavior:
    def __init__(self, *, behavior: builtins.str) -> None:
        '''
        :param behavior: The cache behavior of the distribution. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#behavior LightsailDistribution#behavior}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e29a442a0660792de46ec5c8860461645b384c06e316ddd17a3f60b0633f54f4)
            check_type(argname="argument behavior", value=behavior, expected_type=type_hints["behavior"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "behavior": behavior,
        }

    @builtins.property
    def behavior(self) -> builtins.str:
        '''The cache behavior of the distribution.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#behavior LightsailDistribution#behavior}
        '''
        result = self._values.get("behavior")
        assert result is not None, "Required property 'behavior' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LightsailDistributionDefaultCacheBehavior(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LightsailDistributionDefaultCacheBehaviorOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lightsailDistribution.LightsailDistributionDefaultCacheBehaviorOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1d6aa54776e797a468ffebdb3831d080275c027cf0c2db494bb659a16b6fcec1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="behaviorInput")
    def behavior_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "behaviorInput"))

    @builtins.property
    @jsii.member(jsii_name="behavior")
    def behavior(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "behavior"))

    @behavior.setter
    def behavior(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e9a09ac3faa3403fad93cce82d8e42557273854b29bb0306b9fb2f2c6d9b55a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "behavior", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[LightsailDistributionDefaultCacheBehavior]:
        return typing.cast(typing.Optional[LightsailDistributionDefaultCacheBehavior], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LightsailDistributionDefaultCacheBehavior],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2336c1a2879038ca03b7ef8917ff06418d7388858a1b15934ffef7e1d87df29d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lightsailDistribution.LightsailDistributionLocation",
    jsii_struct_bases=[],
    name_mapping={},
)
class LightsailDistributionLocation:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LightsailDistributionLocation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LightsailDistributionLocationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lightsailDistribution.LightsailDistributionLocationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5414c53f03ac32bb2688b42d60b45da4da5e24522a9e32c61637b34de59160b2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "LightsailDistributionLocationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__17eddd0ea20a67e2bd9721134ffe7aa484c7e1159074db4464ddbfeda6aa41fd)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("LightsailDistributionLocationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3630896b1ad4df5087cded397b350bde44ed19375cf750acef952bbb55c6202c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__01e81aa411aade7fbc6458ea43a5dc4d9c8451195377b31c6571fd01d78cff92)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3c6d0eedd582981733318ad95fe1c5a1c17db28c2c2c11e6df2341d1021e8359)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class LightsailDistributionLocationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lightsailDistribution.LightsailDistributionLocationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__00268b895915375f776b2b2363cbfeb38011f76b3c69ef805ee7804fa47bd38b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="availabilityZone")
    def availability_zone(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "availabilityZone"))

    @builtins.property
    @jsii.member(jsii_name="regionName")
    def region_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "regionName"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[LightsailDistributionLocation]:
        return typing.cast(typing.Optional[LightsailDistributionLocation], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LightsailDistributionLocation],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18789a89f0e69d3ae9406888cb472fbdd7f8f2d03d6d604581679e4bdcf5cc02)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lightsailDistribution.LightsailDistributionOrigin",
    jsii_struct_bases=[],
    name_mapping={
        "name": "name",
        "region_name": "regionName",
        "protocol_policy": "protocolPolicy",
    },
)
class LightsailDistributionOrigin:
    def __init__(
        self,
        *,
        name: builtins.str,
        region_name: builtins.str,
        protocol_policy: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param name: The name of the origin resource. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#name LightsailDistribution#name}
        :param region_name: The AWS Region name of the origin resource. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#region_name LightsailDistribution#region_name}
        :param protocol_policy: The protocol that your Amazon Lightsail distribution uses when establishing a connection with your origin to pull content. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#protocol_policy LightsailDistribution#protocol_policy}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5535b3cd76c0ecbf00916a1950816997d2774ea4afdf4416cfd83281babe592c)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument region_name", value=region_name, expected_type=type_hints["region_name"])
            check_type(argname="argument protocol_policy", value=protocol_policy, expected_type=type_hints["protocol_policy"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "region_name": region_name,
        }
        if protocol_policy is not None:
            self._values["protocol_policy"] = protocol_policy

    @builtins.property
    def name(self) -> builtins.str:
        '''The name of the origin resource.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#name LightsailDistribution#name}
        '''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def region_name(self) -> builtins.str:
        '''The AWS Region name of the origin resource.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#region_name LightsailDistribution#region_name}
        '''
        result = self._values.get("region_name")
        assert result is not None, "Required property 'region_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def protocol_policy(self) -> typing.Optional[builtins.str]:
        '''The protocol that your Amazon Lightsail distribution uses when establishing a connection with your origin to pull content.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#protocol_policy LightsailDistribution#protocol_policy}
        '''
        result = self._values.get("protocol_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LightsailDistributionOrigin(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LightsailDistributionOriginOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lightsailDistribution.LightsailDistributionOriginOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b45d48bc1a16154360d13aa096207efb8d447d207080b6dba2a1f9339cd83a83)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetProtocolPolicy")
    def reset_protocol_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProtocolPolicy", []))

    @builtins.property
    @jsii.member(jsii_name="resourceType")
    def resource_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resourceType"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="protocolPolicyInput")
    def protocol_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "protocolPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="regionNameInput")
    def region_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regionNameInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0693ac054c0553e3c8f73b64b06e6832e8dd436988ad7208a3c287c2a66639f7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="protocolPolicy")
    def protocol_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "protocolPolicy"))

    @protocol_policy.setter
    def protocol_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6025f7b6c97e26ce91d42ce8691813da8414d541ff0886b2d6b3a9f2fac0933)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "protocolPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="regionName")
    def region_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "regionName"))

    @region_name.setter
    def region_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3496ce6c8d8d7f3e29f6737459f0774fa536ff0c67f075d4ab40de1c6cd74409)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "regionName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[LightsailDistributionOrigin]:
        return typing.cast(typing.Optional[LightsailDistributionOrigin], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LightsailDistributionOrigin],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b6e0429da80d7e424d60249da75d93e39d217eee83f71fbff8da54676f68a045)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lightsailDistribution.LightsailDistributionTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class LightsailDistributionTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#create LightsailDistribution#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#delete LightsailDistribution#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#update LightsailDistribution#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9f028597ecd67a7a787e62fe07efcf01c0a52b46115ead82e06b55de6dbb2064)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#create LightsailDistribution#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#delete LightsailDistribution#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#update LightsailDistribution#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LightsailDistributionTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LightsailDistributionTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lightsailDistribution.LightsailDistributionTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1b566ff22971016d939cca0f06ddcd72e2cb3229986699be2c159429177c53b8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__13171fc8320f4027130d76ae27a213e8e9c4b1ab3ffc16165c89336745d4d456)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ff5be73e05c385b6ebff145e7e110adb6c09dfeae3bbef770cb1a80f814e626)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a227dcddb4ff4d7fc8dbcbafea0c4f813df5848fa9280a77b7681c3dffdc3856)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LightsailDistributionTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LightsailDistributionTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LightsailDistributionTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a22ef3fa7761f77b2e421002f1858c990f0500b7231f7bfed404d1528a3c5ee9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "LightsailDistribution",
    "LightsailDistributionCacheBehavior",
    "LightsailDistributionCacheBehaviorList",
    "LightsailDistributionCacheBehaviorOutputReference",
    "LightsailDistributionCacheBehaviorSettings",
    "LightsailDistributionCacheBehaviorSettingsForwardedCookies",
    "LightsailDistributionCacheBehaviorSettingsForwardedCookiesOutputReference",
    "LightsailDistributionCacheBehaviorSettingsForwardedHeaders",
    "LightsailDistributionCacheBehaviorSettingsForwardedHeadersOutputReference",
    "LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings",
    "LightsailDistributionCacheBehaviorSettingsForwardedQueryStringsOutputReference",
    "LightsailDistributionCacheBehaviorSettingsOutputReference",
    "LightsailDistributionConfig",
    "LightsailDistributionDefaultCacheBehavior",
    "LightsailDistributionDefaultCacheBehaviorOutputReference",
    "LightsailDistributionLocation",
    "LightsailDistributionLocationList",
    "LightsailDistributionLocationOutputReference",
    "LightsailDistributionOrigin",
    "LightsailDistributionOriginOutputReference",
    "LightsailDistributionTimeouts",
    "LightsailDistributionTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__8219c5df890e37ce76fe18d8a4f43b08d0dd2f5480d31ff429a643ac6bd8190c(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    bundle_id: builtins.str,
    default_cache_behavior: typing.Union[LightsailDistributionDefaultCacheBehavior, typing.Dict[builtins.str, typing.Any]],
    name: builtins.str,
    origin: typing.Union[LightsailDistributionOrigin, typing.Dict[builtins.str, typing.Any]],
    cache_behavior: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LightsailDistributionCacheBehavior, typing.Dict[builtins.str, typing.Any]]]]] = None,
    cache_behavior_settings: typing.Optional[typing.Union[LightsailDistributionCacheBehaviorSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    certificate_name: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    ip_address_type: typing.Optional[builtins.str] = None,
    is_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[LightsailDistributionTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__81c7da33d97bacbc5758ea77dd2c32cab48988b9f8be07be39455ff196e78b1f(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__58328195f86c6853eada88ffe840aeac377cb7c73a1ef224486b6238a4edf0eb(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LightsailDistributionCacheBehavior, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c65137e129bdab915dc22e71b2204df153066a406fe50145296c4b8fa20230ec(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d34ae901eef2d32e057a68998e4d098f927d8d42f3013eb5f246594ef4ee5aa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__786770455acf024b1a90c990647841cc1d0182ccec6c8a7a8c75988add62f956(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0e7b581b70b81f54ac029b72b66fa97ce0ba323b0246392da0bd738bfebc1cd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15de40ac783dc3e985826a14bb4fe7109519adc4fa6d61f7dc43f311c8a1b020(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__631e83d680c6647b3cee336d0cae513f70ab7e0353323d92507d0eed59356b44(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4fcedab4ae7d266b69a39f76bbd7a1b36f51945f746845f8b352c22bcd0d72dc(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82a1b24b0ff021de520c133f221101ab9177d59561d424b1c4f1d6596eb42753(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4adb17f4bf497ef341a63dfb5b7c860836c49bbe1bc1b41a485bbfa23171c0ce(
    *,
    behavior: builtins.str,
    path: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__965de12cc25f711caca03e2d986f9899f4fd3022790926162e6a1177d9cbcf56(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef45cc51e04b709377bb68b96a3def877ffc5be2741328a950a73894799331ef(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9e5467d7943b057ea1cc8dbf126475870aab3b657da57340d927e95c5a02413(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e45c11a474a19ffc16a97c1a8ac356cc69f195fb707549d19a63791ac5b3395(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc5ea4459c74bea5277b6a1c73da5412fe826943e42ab87654d4aba9f89a722d(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__71ff31e274fc7cf36afdb1d32c844213d638a3de12cf84121a5639aff9d5df72(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LightsailDistributionCacheBehavior]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__063ad7b16bd93207c13f13f14be311251eb45bb49a1bf0c95a25378108a3203a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__adb2c901731e8db3128fb838ed0e94925dd517047c8ba75739ec4339b2403aa7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a898695961dc5d478da021308b85454468edada05bc831a0e7e3aa5185878a3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__39173709aab0007ec52af56c3a8e7a7d03894d23eb48f5159873f8e1ebc8e533(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LightsailDistributionCacheBehavior]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__275a03ca767ccfbdef4a079289593cdf3cf436768acaccfe31c46d4756195c7e(
    *,
    allowed_http_methods: typing.Optional[builtins.str] = None,
    cached_http_methods: typing.Optional[builtins.str] = None,
    default_ttl: typing.Optional[jsii.Number] = None,
    forwarded_cookies: typing.Optional[typing.Union[LightsailDistributionCacheBehaviorSettingsForwardedCookies, typing.Dict[builtins.str, typing.Any]]] = None,
    forwarded_headers: typing.Optional[typing.Union[LightsailDistributionCacheBehaviorSettingsForwardedHeaders, typing.Dict[builtins.str, typing.Any]]] = None,
    forwarded_query_strings: typing.Optional[typing.Union[LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings, typing.Dict[builtins.str, typing.Any]]] = None,
    maximum_ttl: typing.Optional[jsii.Number] = None,
    minimum_ttl: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b607a66fdd6fcd4c7846069673c01fa88c72ee055b513b2a64b6ded80fa68544(
    *,
    cookies_allow_list: typing.Optional[typing.Sequence[builtins.str]] = None,
    option: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af134bc2d70752090c423b0fa5198af06d0384cf1ee72657caea3d38eba85fd0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0fb522d5f6431e66821a9510d30b76640b83a39360fe487526026460a98cda90(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b97ea6818973c4b52e8270d1c3c78d07cb9840910bf50165d4e670d04a18bb5a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9156912e41e2258b6cec588100cff47672c9bf56e858e5a1a11ab0f215d03d0(
    value: typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedCookies],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1e479f419a07f0a403ea055979304e9eecf9862608d92a01b1e01ca66c45f88(
    *,
    headers_allow_list: typing.Optional[typing.Sequence[builtins.str]] = None,
    option: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed8ad76b4610ad7587d2e272902cc2914ebed9b03ae67b322dc1b2cfd8327e8f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ffcad4808625c44ef52b37936783e024f7e7cf9e1c1435a22a8d416609e62152(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__faf3eabb8258acfef0a2f40dff6bf77dbc3d5a6148a52fb57e612b9e02a1795b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6461c479024083f647d83ea932a7f369c5f34a280dc889762dac2369da4bb7f2(
    value: typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedHeaders],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7081b51a2e7d99781af292802ef1c5a701037a6ad47af3a131e8e9b2e047b9d(
    *,
    option: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    query_strings_allowed_list: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3a398ff94a213125e446a24faca650f98657ed530028f233a081a976e92e15f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e73f4532e1ef1047336ef111d609b34af048a07856f4123f9731d7fbf19057c9(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7af7fb6dcc247a5a20110129f50fda2c35bcb4d1b85003b501be0bfba67349e2(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d7814f3e9b2dbfb64e963d4cd629597cd1ea4be3e642ff8aa5eea3e81af5186(
    value: typing.Optional[LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2985abeb46f5076d9a65407b65ed8e116f6c934db481a3de0f57a19a4f4517d7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44910c0a8595023fae13b0d6194fb7c226bcc8d27e11b2764fc3704a624bfc14(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9726c892e2b7d48e42aed31207313b477626e9d6ddcd229699ca3ce6f3073c16(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b54d5fb9580c828d9d4a6c26ac64bbb7e650be9160c77b8a59011a69fcfd5893(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e9bd870b14d9200966bd164f87b6b3633653439a633726c6eb997bca4d15277(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d013414fd25fd1f058a68816fa5ef518d696ac1727b9051c8c80bbd1f5e55777(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f55fc29c9bce0583d43f7d30e2433db2f7887ac210dc1d103e29c45e9d6174c5(
    value: typing.Optional[LightsailDistributionCacheBehaviorSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab9637631e77ffb7ec867c0d6a2eb6a293ea054e7714af230ec73cc831583def(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    bundle_id: builtins.str,
    default_cache_behavior: typing.Union[LightsailDistributionDefaultCacheBehavior, typing.Dict[builtins.str, typing.Any]],
    name: builtins.str,
    origin: typing.Union[LightsailDistributionOrigin, typing.Dict[builtins.str, typing.Any]],
    cache_behavior: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LightsailDistributionCacheBehavior, typing.Dict[builtins.str, typing.Any]]]]] = None,
    cache_behavior_settings: typing.Optional[typing.Union[LightsailDistributionCacheBehaviorSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    certificate_name: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    ip_address_type: typing.Optional[builtins.str] = None,
    is_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[LightsailDistributionTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e29a442a0660792de46ec5c8860461645b384c06e316ddd17a3f60b0633f54f4(
    *,
    behavior: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d6aa54776e797a468ffebdb3831d080275c027cf0c2db494bb659a16b6fcec1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e9a09ac3faa3403fad93cce82d8e42557273854b29bb0306b9fb2f2c6d9b55a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2336c1a2879038ca03b7ef8917ff06418d7388858a1b15934ffef7e1d87df29d(
    value: typing.Optional[LightsailDistributionDefaultCacheBehavior],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5414c53f03ac32bb2688b42d60b45da4da5e24522a9e32c61637b34de59160b2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__17eddd0ea20a67e2bd9721134ffe7aa484c7e1159074db4464ddbfeda6aa41fd(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3630896b1ad4df5087cded397b350bde44ed19375cf750acef952bbb55c6202c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01e81aa411aade7fbc6458ea43a5dc4d9c8451195377b31c6571fd01d78cff92(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3c6d0eedd582981733318ad95fe1c5a1c17db28c2c2c11e6df2341d1021e8359(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00268b895915375f776b2b2363cbfeb38011f76b3c69ef805ee7804fa47bd38b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18789a89f0e69d3ae9406888cb472fbdd7f8f2d03d6d604581679e4bdcf5cc02(
    value: typing.Optional[LightsailDistributionLocation],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5535b3cd76c0ecbf00916a1950816997d2774ea4afdf4416cfd83281babe592c(
    *,
    name: builtins.str,
    region_name: builtins.str,
    protocol_policy: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b45d48bc1a16154360d13aa096207efb8d447d207080b6dba2a1f9339cd83a83(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0693ac054c0553e3c8f73b64b06e6832e8dd436988ad7208a3c287c2a66639f7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6025f7b6c97e26ce91d42ce8691813da8414d541ff0886b2d6b3a9f2fac0933(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3496ce6c8d8d7f3e29f6737459f0774fa536ff0c67f075d4ab40de1c6cd74409(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6e0429da80d7e424d60249da75d93e39d217eee83f71fbff8da54676f68a045(
    value: typing.Optional[LightsailDistributionOrigin],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f028597ecd67a7a787e62fe07efcf01c0a52b46115ead82e06b55de6dbb2064(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b566ff22971016d939cca0f06ddcd72e2cb3229986699be2c159429177c53b8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__13171fc8320f4027130d76ae27a213e8e9c4b1ab3ffc16165c89336745d4d456(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ff5be73e05c385b6ebff145e7e110adb6c09dfeae3bbef770cb1a80f814e626(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a227dcddb4ff4d7fc8dbcbafea0c4f813df5848fa9280a77b7681c3dffdc3856(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a22ef3fa7761f77b2e421002f1858c990f0500b7231f7bfed404d1528a3c5ee9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LightsailDistributionTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
