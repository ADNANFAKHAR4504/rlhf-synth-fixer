r'''
# `aws_route53_records_exclusive`

Refer to the Terraform Registry for docs: [`aws_route53_records_exclusive`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive).
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


class Route53RecordsExclusive(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusive",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive aws_route53_records_exclusive}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        zone_id: builtins.str,
        resource_record_set: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53RecordsExclusiveResourceRecordSet", typing.Dict[builtins.str, typing.Any]]]]] = None,
        timeouts: typing.Optional[typing.Union["Route53RecordsExclusiveTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive aws_route53_records_exclusive} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param zone_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#zone_id Route53RecordsExclusive#zone_id}.
        :param resource_record_set: resource_record_set block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#resource_record_set Route53RecordsExclusive#resource_record_set}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#timeouts Route53RecordsExclusive#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__53b15250817d17f0ccdd44337d64f87295e1ab5e3036c407a1f9abae588751f9)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = Route53RecordsExclusiveConfig(
            zone_id=zone_id,
            resource_record_set=resource_record_set,
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
        '''Generates CDKTF code for importing a Route53RecordsExclusive resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Route53RecordsExclusive to import.
        :param import_from_id: The id of the existing Route53RecordsExclusive that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Route53RecordsExclusive to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0984df3c6004ee996c5e612ad26e1fdddfceb9fc7b07afa0ce5b46b3b5b7be3)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putResourceRecordSet")
    def put_resource_record_set(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53RecordsExclusiveResourceRecordSet", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__015b4908778d8a861008ab0dde0791fb3d0ada9c5121d68d9a290cde972b5199)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceRecordSet", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#create Route53RecordsExclusive#create}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#update Route53RecordsExclusive#update}
        '''
        value = Route53RecordsExclusiveTimeouts(create=create, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetResourceRecordSet")
    def reset_resource_record_set(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceRecordSet", []))

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
    @jsii.member(jsii_name="resourceRecordSet")
    def resource_record_set(self) -> "Route53RecordsExclusiveResourceRecordSetList":
        return typing.cast("Route53RecordsExclusiveResourceRecordSetList", jsii.get(self, "resourceRecordSet"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "Route53RecordsExclusiveTimeoutsOutputReference":
        return typing.cast("Route53RecordsExclusiveTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="resourceRecordSetInput")
    def resource_record_set_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSet"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSet"]]], jsii.get(self, "resourceRecordSetInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "Route53RecordsExclusiveTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "Route53RecordsExclusiveTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="zoneIdInput")
    def zone_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "zoneIdInput"))

    @builtins.property
    @jsii.member(jsii_name="zoneId")
    def zone_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "zoneId"))

    @zone_id.setter
    def zone_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5f56e758df43129284009fbc8acebd70289d39f68dbb62d05563ef0b5d087f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "zoneId", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "zone_id": "zoneId",
        "resource_record_set": "resourceRecordSet",
        "timeouts": "timeouts",
    },
)
class Route53RecordsExclusiveConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        zone_id: builtins.str,
        resource_record_set: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53RecordsExclusiveResourceRecordSet", typing.Dict[builtins.str, typing.Any]]]]] = None,
        timeouts: typing.Optional[typing.Union["Route53RecordsExclusiveTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param zone_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#zone_id Route53RecordsExclusive#zone_id}.
        :param resource_record_set: resource_record_set block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#resource_record_set Route53RecordsExclusive#resource_record_set}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#timeouts Route53RecordsExclusive#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(timeouts, dict):
            timeouts = Route53RecordsExclusiveTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__283ca435ae9ccc4676d82e9eb9a0298e38cb5f3840988e76c9130b5441e8c3bb)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument zone_id", value=zone_id, expected_type=type_hints["zone_id"])
            check_type(argname="argument resource_record_set", value=resource_record_set, expected_type=type_hints["resource_record_set"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "zone_id": zone_id,
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
        if resource_record_set is not None:
            self._values["resource_record_set"] = resource_record_set
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
    def zone_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#zone_id Route53RecordsExclusive#zone_id}.'''
        result = self._values.get("zone_id")
        assert result is not None, "Required property 'zone_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def resource_record_set(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSet"]]]:
        '''resource_record_set block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#resource_record_set Route53RecordsExclusive#resource_record_set}
        '''
        result = self._values.get("resource_record_set")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSet"]]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["Route53RecordsExclusiveTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#timeouts Route53RecordsExclusive#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["Route53RecordsExclusiveTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53RecordsExclusiveConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSet",
    jsii_struct_bases=[],
    name_mapping={
        "name": "name",
        "alias_target": "aliasTarget",
        "cidr_routing_config": "cidrRoutingConfig",
        "failover": "failover",
        "geolocation": "geolocation",
        "geoproximity_location": "geoproximityLocation",
        "health_check_id": "healthCheckId",
        "multi_value_answer": "multiValueAnswer",
        "region": "region",
        "resource_records": "resourceRecords",
        "set_identifier": "setIdentifier",
        "traffic_policy_instance_id": "trafficPolicyInstanceId",
        "ttl": "ttl",
        "type": "type",
        "weight": "weight",
    },
)
class Route53RecordsExclusiveResourceRecordSet:
    def __init__(
        self,
        *,
        name: builtins.str,
        alias_target: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53RecordsExclusiveResourceRecordSetAliasTarget", typing.Dict[builtins.str, typing.Any]]]]] = None,
        cidr_routing_config: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig", typing.Dict[builtins.str, typing.Any]]]]] = None,
        failover: typing.Optional[builtins.str] = None,
        geolocation: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53RecordsExclusiveResourceRecordSetGeolocation", typing.Dict[builtins.str, typing.Any]]]]] = None,
        geoproximity_location: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53RecordsExclusiveResourceRecordSetGeoproximityLocation", typing.Dict[builtins.str, typing.Any]]]]] = None,
        health_check_id: typing.Optional[builtins.str] = None,
        multi_value_answer: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        region: typing.Optional[builtins.str] = None,
        resource_records: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53RecordsExclusiveResourceRecordSetResourceRecords", typing.Dict[builtins.str, typing.Any]]]]] = None,
        set_identifier: typing.Optional[builtins.str] = None,
        traffic_policy_instance_id: typing.Optional[builtins.str] = None,
        ttl: typing.Optional[jsii.Number] = None,
        type: typing.Optional[builtins.str] = None,
        weight: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#name Route53RecordsExclusive#name}.
        :param alias_target: alias_target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#alias_target Route53RecordsExclusive#alias_target}
        :param cidr_routing_config: cidr_routing_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#cidr_routing_config Route53RecordsExclusive#cidr_routing_config}
        :param failover: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#failover Route53RecordsExclusive#failover}.
        :param geolocation: geolocation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#geolocation Route53RecordsExclusive#geolocation}
        :param geoproximity_location: geoproximity_location block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#geoproximity_location Route53RecordsExclusive#geoproximity_location}
        :param health_check_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#health_check_id Route53RecordsExclusive#health_check_id}.
        :param multi_value_answer: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#multi_value_answer Route53RecordsExclusive#multi_value_answer}.
        :param region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#region Route53RecordsExclusive#region}.
        :param resource_records: resource_records block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#resource_records Route53RecordsExclusive#resource_records}
        :param set_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#set_identifier Route53RecordsExclusive#set_identifier}.
        :param traffic_policy_instance_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#traffic_policy_instance_id Route53RecordsExclusive#traffic_policy_instance_id}.
        :param ttl: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#ttl Route53RecordsExclusive#ttl}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#type Route53RecordsExclusive#type}.
        :param weight: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#weight Route53RecordsExclusive#weight}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e9ca586c1270bd569847611b1c8bbf8fc99b018c289ea313badae8be15bd6ce)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument alias_target", value=alias_target, expected_type=type_hints["alias_target"])
            check_type(argname="argument cidr_routing_config", value=cidr_routing_config, expected_type=type_hints["cidr_routing_config"])
            check_type(argname="argument failover", value=failover, expected_type=type_hints["failover"])
            check_type(argname="argument geolocation", value=geolocation, expected_type=type_hints["geolocation"])
            check_type(argname="argument geoproximity_location", value=geoproximity_location, expected_type=type_hints["geoproximity_location"])
            check_type(argname="argument health_check_id", value=health_check_id, expected_type=type_hints["health_check_id"])
            check_type(argname="argument multi_value_answer", value=multi_value_answer, expected_type=type_hints["multi_value_answer"])
            check_type(argname="argument region", value=region, expected_type=type_hints["region"])
            check_type(argname="argument resource_records", value=resource_records, expected_type=type_hints["resource_records"])
            check_type(argname="argument set_identifier", value=set_identifier, expected_type=type_hints["set_identifier"])
            check_type(argname="argument traffic_policy_instance_id", value=traffic_policy_instance_id, expected_type=type_hints["traffic_policy_instance_id"])
            check_type(argname="argument ttl", value=ttl, expected_type=type_hints["ttl"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument weight", value=weight, expected_type=type_hints["weight"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
        }
        if alias_target is not None:
            self._values["alias_target"] = alias_target
        if cidr_routing_config is not None:
            self._values["cidr_routing_config"] = cidr_routing_config
        if failover is not None:
            self._values["failover"] = failover
        if geolocation is not None:
            self._values["geolocation"] = geolocation
        if geoproximity_location is not None:
            self._values["geoproximity_location"] = geoproximity_location
        if health_check_id is not None:
            self._values["health_check_id"] = health_check_id
        if multi_value_answer is not None:
            self._values["multi_value_answer"] = multi_value_answer
        if region is not None:
            self._values["region"] = region
        if resource_records is not None:
            self._values["resource_records"] = resource_records
        if set_identifier is not None:
            self._values["set_identifier"] = set_identifier
        if traffic_policy_instance_id is not None:
            self._values["traffic_policy_instance_id"] = traffic_policy_instance_id
        if ttl is not None:
            self._values["ttl"] = ttl
        if type is not None:
            self._values["type"] = type
        if weight is not None:
            self._values["weight"] = weight

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#name Route53RecordsExclusive#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def alias_target(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetAliasTarget"]]]:
        '''alias_target block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#alias_target Route53RecordsExclusive#alias_target}
        '''
        result = self._values.get("alias_target")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetAliasTarget"]]], result)

    @builtins.property
    def cidr_routing_config(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig"]]]:
        '''cidr_routing_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#cidr_routing_config Route53RecordsExclusive#cidr_routing_config}
        '''
        result = self._values.get("cidr_routing_config")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig"]]], result)

    @builtins.property
    def failover(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#failover Route53RecordsExclusive#failover}.'''
        result = self._values.get("failover")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def geolocation(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetGeolocation"]]]:
        '''geolocation block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#geolocation Route53RecordsExclusive#geolocation}
        '''
        result = self._values.get("geolocation")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetGeolocation"]]], result)

    @builtins.property
    def geoproximity_location(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetGeoproximityLocation"]]]:
        '''geoproximity_location block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#geoproximity_location Route53RecordsExclusive#geoproximity_location}
        '''
        result = self._values.get("geoproximity_location")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetGeoproximityLocation"]]], result)

    @builtins.property
    def health_check_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#health_check_id Route53RecordsExclusive#health_check_id}.'''
        result = self._values.get("health_check_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def multi_value_answer(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#multi_value_answer Route53RecordsExclusive#multi_value_answer}.'''
        result = self._values.get("multi_value_answer")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def region(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#region Route53RecordsExclusive#region}.'''
        result = self._values.get("region")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def resource_records(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetResourceRecords"]]]:
        '''resource_records block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#resource_records Route53RecordsExclusive#resource_records}
        '''
        result = self._values.get("resource_records")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetResourceRecords"]]], result)

    @builtins.property
    def set_identifier(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#set_identifier Route53RecordsExclusive#set_identifier}.'''
        result = self._values.get("set_identifier")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def traffic_policy_instance_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#traffic_policy_instance_id Route53RecordsExclusive#traffic_policy_instance_id}.'''
        result = self._values.get("traffic_policy_instance_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ttl(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#ttl Route53RecordsExclusive#ttl}.'''
        result = self._values.get("ttl")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#type Route53RecordsExclusive#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def weight(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#weight Route53RecordsExclusive#weight}.'''
        result = self._values.get("weight")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53RecordsExclusiveResourceRecordSet(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetAliasTarget",
    jsii_struct_bases=[],
    name_mapping={
        "dns_name": "dnsName",
        "evaluate_target_health": "evaluateTargetHealth",
        "hosted_zone_id": "hostedZoneId",
    },
)
class Route53RecordsExclusiveResourceRecordSetAliasTarget:
    def __init__(
        self,
        *,
        dns_name: builtins.str,
        evaluate_target_health: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        hosted_zone_id: builtins.str,
    ) -> None:
        '''
        :param dns_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#dns_name Route53RecordsExclusive#dns_name}.
        :param evaluate_target_health: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#evaluate_target_health Route53RecordsExclusive#evaluate_target_health}.
        :param hosted_zone_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#hosted_zone_id Route53RecordsExclusive#hosted_zone_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81c9512e7c8910f01299fb221b3e4259356eba9f1e399cbe2d9e3fc080cf8adf)
            check_type(argname="argument dns_name", value=dns_name, expected_type=type_hints["dns_name"])
            check_type(argname="argument evaluate_target_health", value=evaluate_target_health, expected_type=type_hints["evaluate_target_health"])
            check_type(argname="argument hosted_zone_id", value=hosted_zone_id, expected_type=type_hints["hosted_zone_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "dns_name": dns_name,
            "evaluate_target_health": evaluate_target_health,
            "hosted_zone_id": hosted_zone_id,
        }

    @builtins.property
    def dns_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#dns_name Route53RecordsExclusive#dns_name}.'''
        result = self._values.get("dns_name")
        assert result is not None, "Required property 'dns_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def evaluate_target_health(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#evaluate_target_health Route53RecordsExclusive#evaluate_target_health}.'''
        result = self._values.get("evaluate_target_health")
        assert result is not None, "Required property 'evaluate_target_health' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    @builtins.property
    def hosted_zone_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#hosted_zone_id Route53RecordsExclusive#hosted_zone_id}.'''
        result = self._values.get("hosted_zone_id")
        assert result is not None, "Required property 'hosted_zone_id' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53RecordsExclusiveResourceRecordSetAliasTarget(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Route53RecordsExclusiveResourceRecordSetAliasTargetList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetAliasTargetList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2eeecd5550aba65d591ec1ae4bf95c62c0697bafb163e67a500db14d90b0c9b0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53RecordsExclusiveResourceRecordSetAliasTargetOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4e0599657e793e6b2ed1844308945a433a60c304baf0d352e72903407ef7d6a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53RecordsExclusiveResourceRecordSetAliasTargetOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9316a7f465a21fa93fde414c853066f2367d24ee3bf77fc39a08e5fb7ce8998)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4d85c3a3d8d514d0fc530ccb528d4875bfc33f41440af8f0a245ef74da2cae6c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__27ded9cab6bf2b94fcf8b40026411f47e54d0bc3863dce96bbcdebef2dc2676b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetAliasTarget]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetAliasTarget]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetAliasTarget]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46eeeca5946b4eb93c5a68aaa6189cbd8887358f5f0dfd6434831ed331a703ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53RecordsExclusiveResourceRecordSetAliasTargetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetAliasTargetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__704f5d712c4bba9cb2a31d263247dfff47a8a0222fc79bf2d3614850ff14258a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="dnsNameInput")
    def dns_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dnsNameInput"))

    @builtins.property
    @jsii.member(jsii_name="evaluateTargetHealthInput")
    def evaluate_target_health_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "evaluateTargetHealthInput"))

    @builtins.property
    @jsii.member(jsii_name="hostedZoneIdInput")
    def hosted_zone_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "hostedZoneIdInput"))

    @builtins.property
    @jsii.member(jsii_name="dnsName")
    def dns_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dnsName"))

    @dns_name.setter
    def dns_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9c37116eaf4c724870715f0401bc620fa9bf0110aabab241d18b2b9dbd82714)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dnsName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="evaluateTargetHealth")
    def evaluate_target_health(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "evaluateTargetHealth"))

    @evaluate_target_health.setter
    def evaluate_target_health(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99f1493d605c09b3f2fb6999f63e8c44445d15d2e9c2a54a7f6c4d45f291f2f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "evaluateTargetHealth", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="hostedZoneId")
    def hosted_zone_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "hostedZoneId"))

    @hosted_zone_id.setter
    def hosted_zone_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d0acb99eea67e847e591be0915044e0680f677236c57077a1557d20c253419f6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "hostedZoneId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetAliasTarget]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetAliasTarget]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetAliasTarget]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ce69b6cf274ce1e35eb035e55f410b28854317a5deecfb93515df0b16ebf86f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig",
    jsii_struct_bases=[],
    name_mapping={"collection_id": "collectionId", "location_name": "locationName"},
)
class Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig:
    def __init__(
        self,
        *,
        collection_id: builtins.str,
        location_name: builtins.str,
    ) -> None:
        '''
        :param collection_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#collection_id Route53RecordsExclusive#collection_id}.
        :param location_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#location_name Route53RecordsExclusive#location_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c637a0a2e6efda6672d2bf694eb621b23195265162105da10430234bd703fbcd)
            check_type(argname="argument collection_id", value=collection_id, expected_type=type_hints["collection_id"])
            check_type(argname="argument location_name", value=location_name, expected_type=type_hints["location_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "collection_id": collection_id,
            "location_name": location_name,
        }

    @builtins.property
    def collection_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#collection_id Route53RecordsExclusive#collection_id}.'''
        result = self._values.get("collection_id")
        assert result is not None, "Required property 'collection_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def location_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#location_name Route53RecordsExclusive#location_name}.'''
        result = self._values.get("location_name")
        assert result is not None, "Required property 'location_name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Route53RecordsExclusiveResourceRecordSetCidrRoutingConfigList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetCidrRoutingConfigList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4f58508f99c439b83b4993adee627c5db1781a824d5cf24536f6acb527bd40af)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53RecordsExclusiveResourceRecordSetCidrRoutingConfigOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab1f6280d043780b31223016de046419d1f0d6a65f332c1bac5f489dd084240f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53RecordsExclusiveResourceRecordSetCidrRoutingConfigOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df8a6706eac232537aee1fc990bedbe235ade0e145a105cb120771bf68af6952)
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
            type_hints = typing.get_type_hints(_typecheckingstub__51f9f11d494a8338c0d4e98228073e7c7737f4241c4bcd854a954a7817865532)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d45a35604a55e328e63d183bed3579cc2fa999dca2a698ddb7fdbc3845cc8479)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a012bc1905c03e55618d0bf64c2737e45835fb81747a77bf165a0ae74fe1771a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53RecordsExclusiveResourceRecordSetCidrRoutingConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetCidrRoutingConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__271716dd516ba854801638e5559f86cb5a9859017b8cc9eea7a8e0fcbcc7cb19)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="collectionIdInput")
    def collection_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "collectionIdInput"))

    @builtins.property
    @jsii.member(jsii_name="locationNameInput")
    def location_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "locationNameInput"))

    @builtins.property
    @jsii.member(jsii_name="collectionId")
    def collection_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "collectionId"))

    @collection_id.setter
    def collection_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df03c2b34f0cedb7c25e3d6cab90fb39b37eeee08eeb2f02e57bf255329405a9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "collectionId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="locationName")
    def location_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "locationName"))

    @location_name.setter
    def location_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a2096be1e57b9c262eb9d871461fd1ce76b65a871166258203f5fdc14598b74)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "locationName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32033e604edcec1f385b0f2fbe705acb435798ab5e2f819b19ed2f22e180e476)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeolocation",
    jsii_struct_bases=[],
    name_mapping={
        "continent_code": "continentCode",
        "country_code": "countryCode",
        "subdivision_code": "subdivisionCode",
    },
)
class Route53RecordsExclusiveResourceRecordSetGeolocation:
    def __init__(
        self,
        *,
        continent_code: typing.Optional[builtins.str] = None,
        country_code: typing.Optional[builtins.str] = None,
        subdivision_code: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param continent_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#continent_code Route53RecordsExclusive#continent_code}.
        :param country_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#country_code Route53RecordsExclusive#country_code}.
        :param subdivision_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#subdivision_code Route53RecordsExclusive#subdivision_code}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0651f1f9af8304450d011e2f94eea53658da1bda1244037ee3df0ee05be38ac1)
            check_type(argname="argument continent_code", value=continent_code, expected_type=type_hints["continent_code"])
            check_type(argname="argument country_code", value=country_code, expected_type=type_hints["country_code"])
            check_type(argname="argument subdivision_code", value=subdivision_code, expected_type=type_hints["subdivision_code"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if continent_code is not None:
            self._values["continent_code"] = continent_code
        if country_code is not None:
            self._values["country_code"] = country_code
        if subdivision_code is not None:
            self._values["subdivision_code"] = subdivision_code

    @builtins.property
    def continent_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#continent_code Route53RecordsExclusive#continent_code}.'''
        result = self._values.get("continent_code")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def country_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#country_code Route53RecordsExclusive#country_code}.'''
        result = self._values.get("country_code")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def subdivision_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#subdivision_code Route53RecordsExclusive#subdivision_code}.'''
        result = self._values.get("subdivision_code")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53RecordsExclusiveResourceRecordSetGeolocation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Route53RecordsExclusiveResourceRecordSetGeolocationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeolocationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ea6c5db74390059085762eff69adf2ccfa8c6ae7d327b19c64fcc4fbc51c8dfa)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53RecordsExclusiveResourceRecordSetGeolocationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d78cf5544de87ae412910114553102a37614d6e3598b5defb92268a8af782901)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53RecordsExclusiveResourceRecordSetGeolocationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6355b82fc1046c3784b15e131b2f5858b0fe2952dc5a6e37c5df4246dbe1a37f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f4e2f0d4e937d907aeecaa16adf2ae7a2e9c4bab6ed5429e519017689ab0ab35)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f154f402d570c4bc74d05c6cf7782f421b5617a69c82183778c67316bfd6b564)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeolocation]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeolocation]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeolocation]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fef950b4d98148929a8b3313b5c3f77e5a7b5bfe15031d73ec46b33d47479ddc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53RecordsExclusiveResourceRecordSetGeolocationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeolocationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dcd8444fe436649eaf5cee8c0378a343de4d302db519885a405fed0c1b18dc6e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetContinentCode")
    def reset_continent_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContinentCode", []))

    @jsii.member(jsii_name="resetCountryCode")
    def reset_country_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCountryCode", []))

    @jsii.member(jsii_name="resetSubdivisionCode")
    def reset_subdivision_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSubdivisionCode", []))

    @builtins.property
    @jsii.member(jsii_name="continentCodeInput")
    def continent_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "continentCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="countryCodeInput")
    def country_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "countryCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="subdivisionCodeInput")
    def subdivision_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "subdivisionCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="continentCode")
    def continent_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "continentCode"))

    @continent_code.setter
    def continent_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__302db97d6952d0ffe9590392e0d0748908649263f28db1b1b91dcffe06d051e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "continentCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="countryCode")
    def country_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "countryCode"))

    @country_code.setter
    def country_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3c5ae715741ea405850f0e0fd98b23bb2a7e105b6ae8c6eebed76fc4901a0d6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "countryCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subdivisionCode")
    def subdivision_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "subdivisionCode"))

    @subdivision_code.setter
    def subdivision_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f38e296d385e99175e103bd35e8d42a3897782ee6c9cceaadbe94595b73d912a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subdivisionCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetGeolocation]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetGeolocation]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetGeolocation]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__962eeff505b9ecc3b05d208403091b7028f5659f5df90cb52bd144049f4ecf14)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocation",
    jsii_struct_bases=[],
    name_mapping={
        "aws_region": "awsRegion",
        "bias": "bias",
        "coordinates": "coordinates",
        "local_zone_group": "localZoneGroup",
    },
)
class Route53RecordsExclusiveResourceRecordSetGeoproximityLocation:
    def __init__(
        self,
        *,
        aws_region: typing.Optional[builtins.str] = None,
        bias: typing.Optional[jsii.Number] = None,
        coordinates: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates", typing.Dict[builtins.str, typing.Any]]]]] = None,
        local_zone_group: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param aws_region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#aws_region Route53RecordsExclusive#aws_region}.
        :param bias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#bias Route53RecordsExclusive#bias}.
        :param coordinates: coordinates block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#coordinates Route53RecordsExclusive#coordinates}
        :param local_zone_group: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#local_zone_group Route53RecordsExclusive#local_zone_group}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__546db16a887c5e3fedbedd59b8578c48d11139d1c96f2fd51ec535b02e39d2ea)
            check_type(argname="argument aws_region", value=aws_region, expected_type=type_hints["aws_region"])
            check_type(argname="argument bias", value=bias, expected_type=type_hints["bias"])
            check_type(argname="argument coordinates", value=coordinates, expected_type=type_hints["coordinates"])
            check_type(argname="argument local_zone_group", value=local_zone_group, expected_type=type_hints["local_zone_group"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if aws_region is not None:
            self._values["aws_region"] = aws_region
        if bias is not None:
            self._values["bias"] = bias
        if coordinates is not None:
            self._values["coordinates"] = coordinates
        if local_zone_group is not None:
            self._values["local_zone_group"] = local_zone_group

    @builtins.property
    def aws_region(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#aws_region Route53RecordsExclusive#aws_region}.'''
        result = self._values.get("aws_region")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def bias(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#bias Route53RecordsExclusive#bias}.'''
        result = self._values.get("bias")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def coordinates(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates"]]]:
        '''coordinates block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#coordinates Route53RecordsExclusive#coordinates}
        '''
        result = self._values.get("coordinates")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates"]]], result)

    @builtins.property
    def local_zone_group(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#local_zone_group Route53RecordsExclusive#local_zone_group}.'''
        result = self._values.get("local_zone_group")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53RecordsExclusiveResourceRecordSetGeoproximityLocation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates",
    jsii_struct_bases=[],
    name_mapping={"latitude": "latitude", "longitude": "longitude"},
)
class Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates:
    def __init__(self, *, latitude: builtins.str, longitude: builtins.str) -> None:
        '''
        :param latitude: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#latitude Route53RecordsExclusive#latitude}.
        :param longitude: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#longitude Route53RecordsExclusive#longitude}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed02a870ca434838b428a41080ebb46f94b13eeccc9206582afadda3cefcba02)
            check_type(argname="argument latitude", value=latitude, expected_type=type_hints["latitude"])
            check_type(argname="argument longitude", value=longitude, expected_type=type_hints["longitude"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "latitude": latitude,
            "longitude": longitude,
        }

    @builtins.property
    def latitude(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#latitude Route53RecordsExclusive#latitude}.'''
        result = self._values.get("latitude")
        assert result is not None, "Required property 'latitude' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def longitude(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#longitude Route53RecordsExclusive#longitude}.'''
        result = self._values.get("longitude")
        assert result is not None, "Required property 'longitude' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinatesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinatesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__49403a3f6c8c73120105398c84871f87591a5b293029944d06eb3aaf0d49be9c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinatesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3dec36d9f56ab90d79162fff4aad29fb815c92612a97242c4063ac9a727a8b50)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinatesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2b70c03e3b6c9500d4d0ab11a7d12e07f51a51344e201c80c1f06a374986df7c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8ba681bc613f01de47d0b9652b05d2f29af591d80fa7908ba30cb9e67bf14718)
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
            type_hints = typing.get_type_hints(_typecheckingstub__05335406897ac04b95227e3a37c6dfd204935524e7832bedfc258189b390bb44)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__65a45913d64e1ccea0f9b50c752b7f2820e8bd4eb139de57d0c9f61812d838db)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinatesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinatesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__38368b0eb251c0f283d6580fa6da4517d3774adb2eaa6159ccf6a699d7d52df2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="latitudeInput")
    def latitude_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "latitudeInput"))

    @builtins.property
    @jsii.member(jsii_name="longitudeInput")
    def longitude_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "longitudeInput"))

    @builtins.property
    @jsii.member(jsii_name="latitude")
    def latitude(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "latitude"))

    @latitude.setter
    def latitude(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__da4610e73dacf968959f548e42af21aa6a3e08d069c5939dae6ca4c0052209a8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "latitude", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="longitude")
    def longitude(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "longitude"))

    @longitude.setter
    def longitude(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e8d663cb919371d6a80e74b5fb70108dc8055996c6feec230287f8415b9f179)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "longitude", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__616b17ca4e31f26f715475d08b64549d7d2456359f3325a2606fb273fdcdf3a5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53RecordsExclusiveResourceRecordSetGeoproximityLocationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8a76658659a016ba1e9f657e7603bac9779e7654de02994565f9bcd2a6225ae8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53RecordsExclusiveResourceRecordSetGeoproximityLocationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__136e4aceb3341142e8f7064fcbc0ef2657e30b8093c0fe9e982b182b6d8f4917)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53RecordsExclusiveResourceRecordSetGeoproximityLocationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3c30594d732c4a4c32193112f0ff4437f87d602adaa70abf9517f563ea2d0a7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__68d9ed459a4a48c4115da78a9e47fa75f53ef9e39b439a21fe50a06887d1f688)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6d0490d8d7c108aaed728d2473af415698280bbe457918d3c1b22b19d788fed1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeoproximityLocation]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeoproximityLocation]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeoproximityLocation]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5bdb80716bb916d4391b88354f3f73a53e925888376dab96bc35c4bcf1c54b61)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53RecordsExclusiveResourceRecordSetGeoproximityLocationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6b4aacc4cd06026f8c137e026402daba471902fa68f09ab5f24e7bb936a43056)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putCoordinates")
    def put_coordinates(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f5877a5c77fd11678bb1420ac20aec0ddaaaecac125fcf84be3213ef5090bf72)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCoordinates", [value]))

    @jsii.member(jsii_name="resetAwsRegion")
    def reset_aws_region(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAwsRegion", []))

    @jsii.member(jsii_name="resetBias")
    def reset_bias(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBias", []))

    @jsii.member(jsii_name="resetCoordinates")
    def reset_coordinates(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCoordinates", []))

    @jsii.member(jsii_name="resetLocalZoneGroup")
    def reset_local_zone_group(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLocalZoneGroup", []))

    @builtins.property
    @jsii.member(jsii_name="coordinates")
    def coordinates(
        self,
    ) -> Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinatesList:
        return typing.cast(Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinatesList, jsii.get(self, "coordinates"))

    @builtins.property
    @jsii.member(jsii_name="awsRegionInput")
    def aws_region_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "awsRegionInput"))

    @builtins.property
    @jsii.member(jsii_name="biasInput")
    def bias_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "biasInput"))

    @builtins.property
    @jsii.member(jsii_name="coordinatesInput")
    def coordinates_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates]]], jsii.get(self, "coordinatesInput"))

    @builtins.property
    @jsii.member(jsii_name="localZoneGroupInput")
    def local_zone_group_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "localZoneGroupInput"))

    @builtins.property
    @jsii.member(jsii_name="awsRegion")
    def aws_region(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "awsRegion"))

    @aws_region.setter
    def aws_region(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8cbc0d2433bd7e6300b3ddf2d9251459d1cc521d8b5d40f5c14807c29f73ccd9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "awsRegion", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="bias")
    def bias(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "bias"))

    @bias.setter
    def bias(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6a4e35199927476df90a6400053a99c9872e7dfc5f704c5d481baf6ca7ea7b62)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="localZoneGroup")
    def local_zone_group(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "localZoneGroup"))

    @local_zone_group.setter
    def local_zone_group(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6a299f40cc4b72ede85404f02fbb16326b79c1295974aa29c60f219e6fe1f4c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "localZoneGroup", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetGeoproximityLocation]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetGeoproximityLocation]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetGeoproximityLocation]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ca110e748a90939d88f225384faf4f6d4466bdf5ec1c6b441868ec32ad04e0b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53RecordsExclusiveResourceRecordSetList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__075b27dd8b587024adfae3cfbc19e9e65b5995f01133ec5d592b49533d61d6c9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53RecordsExclusiveResourceRecordSetOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e35d1a9633ac9d694705fd1da4a9ad7a3f9975b0cac9ce1a1c50d1ff6aa0e46e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53RecordsExclusiveResourceRecordSetOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f42f7d8c8726e169bc7804a218d7dbea901f7ce90603c242715bd70cc80b84f4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6dc50b53d2134ae952deef190ec7486905d542b077549212f1e205cf8e418e3d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d6b05d0f00533fd6002154d006ce10e7c1b14c19bae2e8e0418c6528af0ac17f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSet]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSet]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSet]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b29453a86595412a11c43c165a3ac7a5c9be66f7e49cf2d07820f94c9e6d805d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53RecordsExclusiveResourceRecordSetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9c9222e344c819203bb710fed09da1bfef1811a3a0672648877d22574b1746fd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putAliasTarget")
    def put_alias_target(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetAliasTarget, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fce8241e6f171f3c4798ba68e4013f41769db0f56d509db814e439b8871dba90)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putAliasTarget", [value]))

    @jsii.member(jsii_name="putCidrRoutingConfig")
    def put_cidr_routing_config(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__acb53a9c3eb04e4979908802163a72743734efc6862ae88ee3ed8cceb099d91e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCidrRoutingConfig", [value]))

    @jsii.member(jsii_name="putGeolocation")
    def put_geolocation(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetGeolocation, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08ddbb4bf962296a1f5c590aa1aadd808dab1cfe4aebaf0aa514f2e67427efc3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putGeolocation", [value]))

    @jsii.member(jsii_name="putGeoproximityLocation")
    def put_geoproximity_location(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetGeoproximityLocation, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5b6b42ee8d824f050e2ce44e2ac60dca396e3ec44b1fa329aa8c783085b1e679)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putGeoproximityLocation", [value]))

    @jsii.member(jsii_name="putResourceRecords")
    def put_resource_records(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Route53RecordsExclusiveResourceRecordSetResourceRecords", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7c724179b4895fbe4bbae9d760fcdbb0f7700792b148dc1e5ce52fbf48f60dd9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceRecords", [value]))

    @jsii.member(jsii_name="resetAliasTarget")
    def reset_alias_target(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAliasTarget", []))

    @jsii.member(jsii_name="resetCidrRoutingConfig")
    def reset_cidr_routing_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCidrRoutingConfig", []))

    @jsii.member(jsii_name="resetFailover")
    def reset_failover(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFailover", []))

    @jsii.member(jsii_name="resetGeolocation")
    def reset_geolocation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGeolocation", []))

    @jsii.member(jsii_name="resetGeoproximityLocation")
    def reset_geoproximity_location(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGeoproximityLocation", []))

    @jsii.member(jsii_name="resetHealthCheckId")
    def reset_health_check_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHealthCheckId", []))

    @jsii.member(jsii_name="resetMultiValueAnswer")
    def reset_multi_value_answer(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMultiValueAnswer", []))

    @jsii.member(jsii_name="resetRegion")
    def reset_region(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegion", []))

    @jsii.member(jsii_name="resetResourceRecords")
    def reset_resource_records(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceRecords", []))

    @jsii.member(jsii_name="resetSetIdentifier")
    def reset_set_identifier(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSetIdentifier", []))

    @jsii.member(jsii_name="resetTrafficPolicyInstanceId")
    def reset_traffic_policy_instance_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTrafficPolicyInstanceId", []))

    @jsii.member(jsii_name="resetTtl")
    def reset_ttl(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTtl", []))

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @jsii.member(jsii_name="resetWeight")
    def reset_weight(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWeight", []))

    @builtins.property
    @jsii.member(jsii_name="aliasTarget")
    def alias_target(self) -> Route53RecordsExclusiveResourceRecordSetAliasTargetList:
        return typing.cast(Route53RecordsExclusiveResourceRecordSetAliasTargetList, jsii.get(self, "aliasTarget"))

    @builtins.property
    @jsii.member(jsii_name="cidrRoutingConfig")
    def cidr_routing_config(
        self,
    ) -> Route53RecordsExclusiveResourceRecordSetCidrRoutingConfigList:
        return typing.cast(Route53RecordsExclusiveResourceRecordSetCidrRoutingConfigList, jsii.get(self, "cidrRoutingConfig"))

    @builtins.property
    @jsii.member(jsii_name="geolocation")
    def geolocation(self) -> Route53RecordsExclusiveResourceRecordSetGeolocationList:
        return typing.cast(Route53RecordsExclusiveResourceRecordSetGeolocationList, jsii.get(self, "geolocation"))

    @builtins.property
    @jsii.member(jsii_name="geoproximityLocation")
    def geoproximity_location(
        self,
    ) -> Route53RecordsExclusiveResourceRecordSetGeoproximityLocationList:
        return typing.cast(Route53RecordsExclusiveResourceRecordSetGeoproximityLocationList, jsii.get(self, "geoproximityLocation"))

    @builtins.property
    @jsii.member(jsii_name="resourceRecords")
    def resource_records(
        self,
    ) -> "Route53RecordsExclusiveResourceRecordSetResourceRecordsList":
        return typing.cast("Route53RecordsExclusiveResourceRecordSetResourceRecordsList", jsii.get(self, "resourceRecords"))

    @builtins.property
    @jsii.member(jsii_name="aliasTargetInput")
    def alias_target_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetAliasTarget]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetAliasTarget]]], jsii.get(self, "aliasTargetInput"))

    @builtins.property
    @jsii.member(jsii_name="cidrRoutingConfigInput")
    def cidr_routing_config_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig]]], jsii.get(self, "cidrRoutingConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="failoverInput")
    def failover_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "failoverInput"))

    @builtins.property
    @jsii.member(jsii_name="geolocationInput")
    def geolocation_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeolocation]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeolocation]]], jsii.get(self, "geolocationInput"))

    @builtins.property
    @jsii.member(jsii_name="geoproximityLocationInput")
    def geoproximity_location_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeoproximityLocation]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeoproximityLocation]]], jsii.get(self, "geoproximityLocationInput"))

    @builtins.property
    @jsii.member(jsii_name="healthCheckIdInput")
    def health_check_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "healthCheckIdInput"))

    @builtins.property
    @jsii.member(jsii_name="multiValueAnswerInput")
    def multi_value_answer_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "multiValueAnswerInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="regionInput")
    def region_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regionInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceRecordsInput")
    def resource_records_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetResourceRecords"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Route53RecordsExclusiveResourceRecordSetResourceRecords"]]], jsii.get(self, "resourceRecordsInput"))

    @builtins.property
    @jsii.member(jsii_name="setIdentifierInput")
    def set_identifier_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "setIdentifierInput"))

    @builtins.property
    @jsii.member(jsii_name="trafficPolicyInstanceIdInput")
    def traffic_policy_instance_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "trafficPolicyInstanceIdInput"))

    @builtins.property
    @jsii.member(jsii_name="ttlInput")
    def ttl_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "ttlInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="weightInput")
    def weight_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "weightInput"))

    @builtins.property
    @jsii.member(jsii_name="failover")
    def failover(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "failover"))

    @failover.setter
    def failover(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fa53ca1a0a5c5348f51b5a64984275685d498b4debb2ec86fa2c360570523e21)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "failover", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="healthCheckId")
    def health_check_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "healthCheckId"))

    @health_check_id.setter
    def health_check_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b2d84cdf130a0bc4db0171b4f8767208dfd104a40f789f56c645a3efebd5bbd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "healthCheckId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="multiValueAnswer")
    def multi_value_answer(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "multiValueAnswer"))

    @multi_value_answer.setter
    def multi_value_answer(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2de382e1d2435fb301286c135f900d9a5fbc4e3728724fd4813b60f55ec3d1ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "multiValueAnswer", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e4f6e05e2caac02e38e66f2ff895798f464da8803c5b463434168f0b13853df0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="region")
    def region(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "region"))

    @region.setter
    def region(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d2b0467840c7896678f52d0c548ee605201002a66b165626af31eb29f7ac7647)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "region", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="setIdentifier")
    def set_identifier(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "setIdentifier"))

    @set_identifier.setter
    def set_identifier(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b170b032a97e7f963ebad006638cbcd3f567f77ad561df8e2b428552e3ccdfe6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "setIdentifier", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="trafficPolicyInstanceId")
    def traffic_policy_instance_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "trafficPolicyInstanceId"))

    @traffic_policy_instance_id.setter
    def traffic_policy_instance_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c61f9c7c54ee528a8aee6311e3101ec8fcd0bfcba7fdc1b37aab159f0d37dfe0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "trafficPolicyInstanceId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ttl")
    def ttl(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "ttl"))

    @ttl.setter
    def ttl(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ce5025ebf9e543fda11eb975239b738cea441cff13e2533a60797e33fc4be48)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ttl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d6832c80f9f715dd130692743a75891b8b860627237d51d5be4b6f1a6c8fae5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="weight")
    def weight(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "weight"))

    @weight.setter
    def weight(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f86983e77358589e2a3db45874ef09aa55822c49c7ef5da6534d1d40f00c9be)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "weight", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSet]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSet]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSet]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a453641d0cbe348e9e1e277b6efc4475efcd6ee1e85171283851a45aae0d3999)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetResourceRecords",
    jsii_struct_bases=[],
    name_mapping={"value": "value"},
)
class Route53RecordsExclusiveResourceRecordSetResourceRecords:
    def __init__(self, *, value: builtins.str) -> None:
        '''
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#value Route53RecordsExclusive#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4fc68b071d69aa37e92e37601ac046f296a18b52d879eac710284ee0187c7b2c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "value": value,
        }

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#value Route53RecordsExclusive#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53RecordsExclusiveResourceRecordSetResourceRecords(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Route53RecordsExclusiveResourceRecordSetResourceRecordsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetResourceRecordsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e569fbda6aab18c0ab7989dff88cf79c914f5d1d47218105bd424589a6f94528)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Route53RecordsExclusiveResourceRecordSetResourceRecordsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__471ba0fa620a7864df65db5faf96fc7de570619387b877fd7dbc7d7b0b656343)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Route53RecordsExclusiveResourceRecordSetResourceRecordsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c4d809754a227f62e9962fc6c0c83468ca5cc75ee96004fbda2c959c82d1f61)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6bcd274f94d5dd1333ea6ae39c5be7b2746d83af4a24cab5d645e4c380100066)
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
            type_hints = typing.get_type_hints(_typecheckingstub__15da9d506c6ffebbfac68be0d585ef4a7ee6d87ecc3f815f88a28d46af4aebc6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetResourceRecords]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetResourceRecords]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetResourceRecords]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__80f8e2224fa69d2accca372699cd296a1c12b6ab64a5951dafbbfb1cdaf37b5b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Route53RecordsExclusiveResourceRecordSetResourceRecordsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetResourceRecordsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c2efb1789e914ed80103fa02ac5f14f079aaab631003482c1aafee1a0c74f5b5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__724a2f7433783a45012039814cefd8b222b9f11235f3f7c0eb0d906f4be672f3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetResourceRecords]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetResourceRecords]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetResourceRecords]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f1a3d9e8e3e2235eedceef4f605715b1c3975c1033da583964b1079fdaeae97a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "update": "update"},
)
class Route53RecordsExclusiveTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#create Route53RecordsExclusive#create}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#update Route53RecordsExclusive#update}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba0f42531728da8f698a4cb2ad3d56219931c1348a74eba2a806e0ada5cf92ea)
            check_type(argname="argument create", value=create, expected_type=type_hints["create"])
            check_type(argname="argument update", value=update, expected_type=type_hints["update"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if create is not None:
            self._values["create"] = create
        if update is not None:
            self._values["update"] = update

    @builtins.property
    def create(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#create Route53RecordsExclusive#create}
        '''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#update Route53RecordsExclusive#update}
        '''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Route53RecordsExclusiveTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Route53RecordsExclusiveTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.route53RecordsExclusive.Route53RecordsExclusiveTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0b66a1026a695a60f07dc937dcd03601e501353322a02770f165440c1ab7d36f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCreate")
    def reset_create(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCreate", []))

    @jsii.member(jsii_name="resetUpdate")
    def reset_update(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUpdate", []))

    @builtins.property
    @jsii.member(jsii_name="createInput")
    def create_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "createInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__4f89aa954bf032a8751c01bebed687bd4bd73d1178a4ff2f5c704f6ad1de0b27)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d1167e7c2ff82e9863dac476fb19cb8d2c60e8d3913ee571c0dc4a8aa340b16a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__20a82df35ec3ebb628ae3ad4dadeaf2cb3a2d98e78b5a26bd363b5071f8ea6ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Route53RecordsExclusive",
    "Route53RecordsExclusiveConfig",
    "Route53RecordsExclusiveResourceRecordSet",
    "Route53RecordsExclusiveResourceRecordSetAliasTarget",
    "Route53RecordsExclusiveResourceRecordSetAliasTargetList",
    "Route53RecordsExclusiveResourceRecordSetAliasTargetOutputReference",
    "Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig",
    "Route53RecordsExclusiveResourceRecordSetCidrRoutingConfigList",
    "Route53RecordsExclusiveResourceRecordSetCidrRoutingConfigOutputReference",
    "Route53RecordsExclusiveResourceRecordSetGeolocation",
    "Route53RecordsExclusiveResourceRecordSetGeolocationList",
    "Route53RecordsExclusiveResourceRecordSetGeolocationOutputReference",
    "Route53RecordsExclusiveResourceRecordSetGeoproximityLocation",
    "Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates",
    "Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinatesList",
    "Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinatesOutputReference",
    "Route53RecordsExclusiveResourceRecordSetGeoproximityLocationList",
    "Route53RecordsExclusiveResourceRecordSetGeoproximityLocationOutputReference",
    "Route53RecordsExclusiveResourceRecordSetList",
    "Route53RecordsExclusiveResourceRecordSetOutputReference",
    "Route53RecordsExclusiveResourceRecordSetResourceRecords",
    "Route53RecordsExclusiveResourceRecordSetResourceRecordsList",
    "Route53RecordsExclusiveResourceRecordSetResourceRecordsOutputReference",
    "Route53RecordsExclusiveTimeouts",
    "Route53RecordsExclusiveTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__53b15250817d17f0ccdd44337d64f87295e1ab5e3036c407a1f9abae588751f9(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    zone_id: builtins.str,
    resource_record_set: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSet, typing.Dict[builtins.str, typing.Any]]]]] = None,
    timeouts: typing.Optional[typing.Union[Route53RecordsExclusiveTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__c0984df3c6004ee996c5e612ad26e1fdddfceb9fc7b07afa0ce5b46b3b5b7be3(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__015b4908778d8a861008ab0dde0791fb3d0ada9c5121d68d9a290cde972b5199(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSet, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5f56e758df43129284009fbc8acebd70289d39f68dbb62d05563ef0b5d087f1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__283ca435ae9ccc4676d82e9eb9a0298e38cb5f3840988e76c9130b5441e8c3bb(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    zone_id: builtins.str,
    resource_record_set: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSet, typing.Dict[builtins.str, typing.Any]]]]] = None,
    timeouts: typing.Optional[typing.Union[Route53RecordsExclusiveTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e9ca586c1270bd569847611b1c8bbf8fc99b018c289ea313badae8be15bd6ce(
    *,
    name: builtins.str,
    alias_target: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetAliasTarget, typing.Dict[builtins.str, typing.Any]]]]] = None,
    cidr_routing_config: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig, typing.Dict[builtins.str, typing.Any]]]]] = None,
    failover: typing.Optional[builtins.str] = None,
    geolocation: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetGeolocation, typing.Dict[builtins.str, typing.Any]]]]] = None,
    geoproximity_location: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetGeoproximityLocation, typing.Dict[builtins.str, typing.Any]]]]] = None,
    health_check_id: typing.Optional[builtins.str] = None,
    multi_value_answer: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    region: typing.Optional[builtins.str] = None,
    resource_records: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetResourceRecords, typing.Dict[builtins.str, typing.Any]]]]] = None,
    set_identifier: typing.Optional[builtins.str] = None,
    traffic_policy_instance_id: typing.Optional[builtins.str] = None,
    ttl: typing.Optional[jsii.Number] = None,
    type: typing.Optional[builtins.str] = None,
    weight: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81c9512e7c8910f01299fb221b3e4259356eba9f1e399cbe2d9e3fc080cf8adf(
    *,
    dns_name: builtins.str,
    evaluate_target_health: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    hosted_zone_id: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2eeecd5550aba65d591ec1ae4bf95c62c0697bafb163e67a500db14d90b0c9b0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4e0599657e793e6b2ed1844308945a433a60c304baf0d352e72903407ef7d6a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9316a7f465a21fa93fde414c853066f2367d24ee3bf77fc39a08e5fb7ce8998(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d85c3a3d8d514d0fc530ccb528d4875bfc33f41440af8f0a245ef74da2cae6c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27ded9cab6bf2b94fcf8b40026411f47e54d0bc3863dce96bbcdebef2dc2676b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46eeeca5946b4eb93c5a68aaa6189cbd8887358f5f0dfd6434831ed331a703ff(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetAliasTarget]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__704f5d712c4bba9cb2a31d263247dfff47a8a0222fc79bf2d3614850ff14258a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9c37116eaf4c724870715f0401bc620fa9bf0110aabab241d18b2b9dbd82714(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99f1493d605c09b3f2fb6999f63e8c44445d15d2e9c2a54a7f6c4d45f291f2f5(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0acb99eea67e847e591be0915044e0680f677236c57077a1557d20c253419f6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ce69b6cf274ce1e35eb035e55f410b28854317a5deecfb93515df0b16ebf86f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetAliasTarget]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c637a0a2e6efda6672d2bf694eb621b23195265162105da10430234bd703fbcd(
    *,
    collection_id: builtins.str,
    location_name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f58508f99c439b83b4993adee627c5db1781a824d5cf24536f6acb527bd40af(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab1f6280d043780b31223016de046419d1f0d6a65f332c1bac5f489dd084240f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df8a6706eac232537aee1fc990bedbe235ade0e145a105cb120771bf68af6952(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__51f9f11d494a8338c0d4e98228073e7c7737f4241c4bcd854a954a7817865532(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d45a35604a55e328e63d183bed3579cc2fa999dca2a698ddb7fdbc3845cc8479(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a012bc1905c03e55618d0bf64c2737e45835fb81747a77bf165a0ae74fe1771a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__271716dd516ba854801638e5559f86cb5a9859017b8cc9eea7a8e0fcbcc7cb19(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df03c2b34f0cedb7c25e3d6cab90fb39b37eeee08eeb2f02e57bf255329405a9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a2096be1e57b9c262eb9d871461fd1ce76b65a871166258203f5fdc14598b74(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32033e604edcec1f385b0f2fbe705acb435798ab5e2f819b19ed2f22e180e476(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0651f1f9af8304450d011e2f94eea53658da1bda1244037ee3df0ee05be38ac1(
    *,
    continent_code: typing.Optional[builtins.str] = None,
    country_code: typing.Optional[builtins.str] = None,
    subdivision_code: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea6c5db74390059085762eff69adf2ccfa8c6ae7d327b19c64fcc4fbc51c8dfa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d78cf5544de87ae412910114553102a37614d6e3598b5defb92268a8af782901(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6355b82fc1046c3784b15e131b2f5858b0fe2952dc5a6e37c5df4246dbe1a37f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4e2f0d4e937d907aeecaa16adf2ae7a2e9c4bab6ed5429e519017689ab0ab35(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f154f402d570c4bc74d05c6cf7782f421b5617a69c82183778c67316bfd6b564(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fef950b4d98148929a8b3313b5c3f77e5a7b5bfe15031d73ec46b33d47479ddc(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeolocation]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dcd8444fe436649eaf5cee8c0378a343de4d302db519885a405fed0c1b18dc6e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__302db97d6952d0ffe9590392e0d0748908649263f28db1b1b91dcffe06d051e8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3c5ae715741ea405850f0e0fd98b23bb2a7e105b6ae8c6eebed76fc4901a0d6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f38e296d385e99175e103bd35e8d42a3897782ee6c9cceaadbe94595b73d912a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__962eeff505b9ecc3b05d208403091b7028f5659f5df90cb52bd144049f4ecf14(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetGeolocation]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__546db16a887c5e3fedbedd59b8578c48d11139d1c96f2fd51ec535b02e39d2ea(
    *,
    aws_region: typing.Optional[builtins.str] = None,
    bias: typing.Optional[jsii.Number] = None,
    coordinates: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates, typing.Dict[builtins.str, typing.Any]]]]] = None,
    local_zone_group: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed02a870ca434838b428a41080ebb46f94b13eeccc9206582afadda3cefcba02(
    *,
    latitude: builtins.str,
    longitude: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49403a3f6c8c73120105398c84871f87591a5b293029944d06eb3aaf0d49be9c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3dec36d9f56ab90d79162fff4aad29fb815c92612a97242c4063ac9a727a8b50(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2b70c03e3b6c9500d4d0ab11a7d12e07f51a51344e201c80c1f06a374986df7c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ba681bc613f01de47d0b9652b05d2f29af591d80fa7908ba30cb9e67bf14718(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05335406897ac04b95227e3a37c6dfd204935524e7832bedfc258189b390bb44(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65a45913d64e1ccea0f9b50c752b7f2820e8bd4eb139de57d0c9f61812d838db(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__38368b0eb251c0f283d6580fa6da4517d3774adb2eaa6159ccf6a699d7d52df2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da4610e73dacf968959f548e42af21aa6a3e08d069c5939dae6ca4c0052209a8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e8d663cb919371d6a80e74b5fb70108dc8055996c6feec230287f8415b9f179(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__616b17ca4e31f26f715475d08b64549d7d2456359f3325a2606fb273fdcdf3a5(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a76658659a016ba1e9f657e7603bac9779e7654de02994565f9bcd2a6225ae8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__136e4aceb3341142e8f7064fcbc0ef2657e30b8093c0fe9e982b182b6d8f4917(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3c30594d732c4a4c32193112f0ff4437f87d602adaa70abf9517f563ea2d0a7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68d9ed459a4a48c4115da78a9e47fa75f53ef9e39b439a21fe50a06887d1f688(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d0490d8d7c108aaed728d2473af415698280bbe457918d3c1b22b19d788fed1(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5bdb80716bb916d4391b88354f3f73a53e925888376dab96bc35c4bcf1c54b61(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetGeoproximityLocation]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b4aacc4cd06026f8c137e026402daba471902fa68f09ab5f24e7bb936a43056(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5877a5c77fd11678bb1420ac20aec0ddaaaecac125fcf84be3213ef5090bf72(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetGeoproximityLocationCoordinates, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8cbc0d2433bd7e6300b3ddf2d9251459d1cc521d8b5d40f5c14807c29f73ccd9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6a4e35199927476df90a6400053a99c9872e7dfc5f704c5d481baf6ca7ea7b62(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6a299f40cc4b72ede85404f02fbb16326b79c1295974aa29c60f219e6fe1f4c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ca110e748a90939d88f225384faf4f6d4466bdf5ec1c6b441868ec32ad04e0b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetGeoproximityLocation]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__075b27dd8b587024adfae3cfbc19e9e65b5995f01133ec5d592b49533d61d6c9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e35d1a9633ac9d694705fd1da4a9ad7a3f9975b0cac9ce1a1c50d1ff6aa0e46e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f42f7d8c8726e169bc7804a218d7dbea901f7ce90603c242715bd70cc80b84f4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6dc50b53d2134ae952deef190ec7486905d542b077549212f1e205cf8e418e3d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d6b05d0f00533fd6002154d006ce10e7c1b14c19bae2e8e0418c6528af0ac17f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b29453a86595412a11c43c165a3ac7a5c9be66f7e49cf2d07820f94c9e6d805d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSet]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c9222e344c819203bb710fed09da1bfef1811a3a0672648877d22574b1746fd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fce8241e6f171f3c4798ba68e4013f41769db0f56d509db814e439b8871dba90(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetAliasTarget, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__acb53a9c3eb04e4979908802163a72743734efc6862ae88ee3ed8cceb099d91e(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08ddbb4bf962296a1f5c590aa1aadd808dab1cfe4aebaf0aa514f2e67427efc3(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetGeolocation, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b6b42ee8d824f050e2ce44e2ac60dca396e3ec44b1fa329aa8c783085b1e679(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetGeoproximityLocation, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c724179b4895fbe4bbae9d760fcdbb0f7700792b148dc1e5ce52fbf48f60dd9(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Route53RecordsExclusiveResourceRecordSetResourceRecords, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fa53ca1a0a5c5348f51b5a64984275685d498b4debb2ec86fa2c360570523e21(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b2d84cdf130a0bc4db0171b4f8767208dfd104a40f789f56c645a3efebd5bbd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2de382e1d2435fb301286c135f900d9a5fbc4e3728724fd4813b60f55ec3d1ed(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e4f6e05e2caac02e38e66f2ff895798f464da8803c5b463434168f0b13853df0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2b0467840c7896678f52d0c548ee605201002a66b165626af31eb29f7ac7647(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b170b032a97e7f963ebad006638cbcd3f567f77ad561df8e2b428552e3ccdfe6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c61f9c7c54ee528a8aee6311e3101ec8fcd0bfcba7fdc1b37aab159f0d37dfe0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ce5025ebf9e543fda11eb975239b738cea441cff13e2533a60797e33fc4be48(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d6832c80f9f715dd130692743a75891b8b860627237d51d5be4b6f1a6c8fae5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f86983e77358589e2a3db45874ef09aa55822c49c7ef5da6534d1d40f00c9be(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a453641d0cbe348e9e1e277b6efc4475efcd6ee1e85171283851a45aae0d3999(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSet]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4fc68b071d69aa37e92e37601ac046f296a18b52d879eac710284ee0187c7b2c(
    *,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e569fbda6aab18c0ab7989dff88cf79c914f5d1d47218105bd424589a6f94528(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__471ba0fa620a7864df65db5faf96fc7de570619387b877fd7dbc7d7b0b656343(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c4d809754a227f62e9962fc6c0c83468ca5cc75ee96004fbda2c959c82d1f61(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6bcd274f94d5dd1333ea6ae39c5be7b2746d83af4a24cab5d645e4c380100066(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15da9d506c6ffebbfac68be0d585ef4a7ee6d87ecc3f815f88a28d46af4aebc6(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__80f8e2224fa69d2accca372699cd296a1c12b6ab64a5951dafbbfb1cdaf37b5b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Route53RecordsExclusiveResourceRecordSetResourceRecords]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2efb1789e914ed80103fa02ac5f14f079aaab631003482c1aafee1a0c74f5b5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__724a2f7433783a45012039814cefd8b222b9f11235f3f7c0eb0d906f4be672f3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1a3d9e8e3e2235eedceef4f605715b1c3975c1033da583964b1079fdaeae97a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveResourceRecordSetResourceRecords]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba0f42531728da8f698a4cb2ad3d56219931c1348a74eba2a806e0ada5cf92ea(
    *,
    create: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b66a1026a695a60f07dc937dcd03601e501353322a02770f165440c1ab7d36f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f89aa954bf032a8751c01bebed687bd4bd73d1178a4ff2f5c704f6ad1de0b27(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1167e7c2ff82e9863dac476fb19cb8d2c60e8d3913ee571c0dc4a8aa340b16a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__20a82df35ec3ebb628ae3ad4dadeaf2cb3a2d98e78b5a26bd363b5071f8ea6ff(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Route53RecordsExclusiveTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
