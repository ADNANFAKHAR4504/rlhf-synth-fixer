r'''
# `aws_internetmonitor_monitor`

Refer to the Terraform Registry for docs: [`aws_internetmonitor_monitor`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor).
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


class InternetmonitorMonitor(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.internetmonitorMonitor.InternetmonitorMonitor",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor aws_internetmonitor_monitor}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        monitor_name: builtins.str,
        health_events_config: typing.Optional[typing.Union["InternetmonitorMonitorHealthEventsConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        internet_measurements_log_delivery: typing.Optional[typing.Union["InternetmonitorMonitorInternetMeasurementsLogDelivery", typing.Dict[builtins.str, typing.Any]]] = None,
        max_city_networks_to_monitor: typing.Optional[jsii.Number] = None,
        resources: typing.Optional[typing.Sequence[builtins.str]] = None,
        status: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        traffic_percentage_to_monitor: typing.Optional[jsii.Number] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor aws_internetmonitor_monitor} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param monitor_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#monitor_name InternetmonitorMonitor#monitor_name}.
        :param health_events_config: health_events_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#health_events_config InternetmonitorMonitor#health_events_config}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#id InternetmonitorMonitor#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param internet_measurements_log_delivery: internet_measurements_log_delivery block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#internet_measurements_log_delivery InternetmonitorMonitor#internet_measurements_log_delivery}
        :param max_city_networks_to_monitor: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#max_city_networks_to_monitor InternetmonitorMonitor#max_city_networks_to_monitor}.
        :param resources: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#resources InternetmonitorMonitor#resources}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#status InternetmonitorMonitor#status}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags InternetmonitorMonitor#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags_all InternetmonitorMonitor#tags_all}.
        :param traffic_percentage_to_monitor: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#traffic_percentage_to_monitor InternetmonitorMonitor#traffic_percentage_to_monitor}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d76323c761f7ffe946fa49fddedc940e8f95e4f475461ae21bb75b43ef09467)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = InternetmonitorMonitorConfig(
            monitor_name=monitor_name,
            health_events_config=health_events_config,
            id=id,
            internet_measurements_log_delivery=internet_measurements_log_delivery,
            max_city_networks_to_monitor=max_city_networks_to_monitor,
            resources=resources,
            status=status,
            tags=tags,
            tags_all=tags_all,
            traffic_percentage_to_monitor=traffic_percentage_to_monitor,
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
        '''Generates CDKTF code for importing a InternetmonitorMonitor resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the InternetmonitorMonitor to import.
        :param import_from_id: The id of the existing InternetmonitorMonitor that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the InternetmonitorMonitor to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6abaf52813457b3c36fb0fb1568aa3056f7abccbcc2634eeec079b5fd1082fc)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putHealthEventsConfig")
    def put_health_events_config(
        self,
        *,
        availability_score_threshold: typing.Optional[jsii.Number] = None,
        performance_score_threshold: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param availability_score_threshold: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#availability_score_threshold InternetmonitorMonitor#availability_score_threshold}.
        :param performance_score_threshold: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#performance_score_threshold InternetmonitorMonitor#performance_score_threshold}.
        '''
        value = InternetmonitorMonitorHealthEventsConfig(
            availability_score_threshold=availability_score_threshold,
            performance_score_threshold=performance_score_threshold,
        )

        return typing.cast(None, jsii.invoke(self, "putHealthEventsConfig", [value]))

    @jsii.member(jsii_name="putInternetMeasurementsLogDelivery")
    def put_internet_measurements_log_delivery(
        self,
        *,
        s3_config: typing.Optional[typing.Union["InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param s3_config: s3_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#s3_config InternetmonitorMonitor#s3_config}
        '''
        value = InternetmonitorMonitorInternetMeasurementsLogDelivery(
            s3_config=s3_config
        )

        return typing.cast(None, jsii.invoke(self, "putInternetMeasurementsLogDelivery", [value]))

    @jsii.member(jsii_name="resetHealthEventsConfig")
    def reset_health_events_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHealthEventsConfig", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetInternetMeasurementsLogDelivery")
    def reset_internet_measurements_log_delivery(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInternetMeasurementsLogDelivery", []))

    @jsii.member(jsii_name="resetMaxCityNetworksToMonitor")
    def reset_max_city_networks_to_monitor(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxCityNetworksToMonitor", []))

    @jsii.member(jsii_name="resetResources")
    def reset_resources(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResources", []))

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTrafficPercentageToMonitor")
    def reset_traffic_percentage_to_monitor(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTrafficPercentageToMonitor", []))

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
    @jsii.member(jsii_name="healthEventsConfig")
    def health_events_config(
        self,
    ) -> "InternetmonitorMonitorHealthEventsConfigOutputReference":
        return typing.cast("InternetmonitorMonitorHealthEventsConfigOutputReference", jsii.get(self, "healthEventsConfig"))

    @builtins.property
    @jsii.member(jsii_name="internetMeasurementsLogDelivery")
    def internet_measurements_log_delivery(
        self,
    ) -> "InternetmonitorMonitorInternetMeasurementsLogDeliveryOutputReference":
        return typing.cast("InternetmonitorMonitorInternetMeasurementsLogDeliveryOutputReference", jsii.get(self, "internetMeasurementsLogDelivery"))

    @builtins.property
    @jsii.member(jsii_name="healthEventsConfigInput")
    def health_events_config_input(
        self,
    ) -> typing.Optional["InternetmonitorMonitorHealthEventsConfig"]:
        return typing.cast(typing.Optional["InternetmonitorMonitorHealthEventsConfig"], jsii.get(self, "healthEventsConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="internetMeasurementsLogDeliveryInput")
    def internet_measurements_log_delivery_input(
        self,
    ) -> typing.Optional["InternetmonitorMonitorInternetMeasurementsLogDelivery"]:
        return typing.cast(typing.Optional["InternetmonitorMonitorInternetMeasurementsLogDelivery"], jsii.get(self, "internetMeasurementsLogDeliveryInput"))

    @builtins.property
    @jsii.member(jsii_name="maxCityNetworksToMonitorInput")
    def max_city_networks_to_monitor_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxCityNetworksToMonitorInput"))

    @builtins.property
    @jsii.member(jsii_name="monitorNameInput")
    def monitor_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "monitorNameInput"))

    @builtins.property
    @jsii.member(jsii_name="resourcesInput")
    def resources_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "resourcesInput"))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

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
    @jsii.member(jsii_name="trafficPercentageToMonitorInput")
    def traffic_percentage_to_monitor_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "trafficPercentageToMonitorInput"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__09c367a303652337fbbe11e8b89db803a6c7495a076e394dee06dfb1292a592a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxCityNetworksToMonitor")
    def max_city_networks_to_monitor(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxCityNetworksToMonitor"))

    @max_city_networks_to_monitor.setter
    def max_city_networks_to_monitor(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e43cb5ff4a2c5357afc8c2b5ba0db0802d10d8b6c11f631db321ea4028bdda30)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxCityNetworksToMonitor", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="monitorName")
    def monitor_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "monitorName"))

    @monitor_name.setter
    def monitor_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9c92a9c1c4d00bad8b6d6d3db66b74bdb1679d3499f4f2ea9adf1e373e3aff24)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "monitorName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resources")
    def resources(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "resources"))

    @resources.setter
    def resources(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f2fa83f5a754e5dc63c1dd0ccaab1b577726932f4d5fe25d30293e3d4bd3c503)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resources", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5fedc5c9227c70ad9c6f3425770741906d5d3c6a460377f8a27776fa25739dc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce9c0515059d321840927355f8f325831e1651b66631f49e56b209217c244e93)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a4602380c75dafc872c9c3b8f8c370a2bf39f8563acb442e040d575f5e8b4e77)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="trafficPercentageToMonitor")
    def traffic_percentage_to_monitor(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "trafficPercentageToMonitor"))

    @traffic_percentage_to_monitor.setter
    def traffic_percentage_to_monitor(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__53fe25aa31a3ffdd56a01dc2cdec13d23d9d3782d822054a270f13b30764749a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "trafficPercentageToMonitor", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.internetmonitorMonitor.InternetmonitorMonitorConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "monitor_name": "monitorName",
        "health_events_config": "healthEventsConfig",
        "id": "id",
        "internet_measurements_log_delivery": "internetMeasurementsLogDelivery",
        "max_city_networks_to_monitor": "maxCityNetworksToMonitor",
        "resources": "resources",
        "status": "status",
        "tags": "tags",
        "tags_all": "tagsAll",
        "traffic_percentage_to_monitor": "trafficPercentageToMonitor",
    },
)
class InternetmonitorMonitorConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        monitor_name: builtins.str,
        health_events_config: typing.Optional[typing.Union["InternetmonitorMonitorHealthEventsConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        internet_measurements_log_delivery: typing.Optional[typing.Union["InternetmonitorMonitorInternetMeasurementsLogDelivery", typing.Dict[builtins.str, typing.Any]]] = None,
        max_city_networks_to_monitor: typing.Optional[jsii.Number] = None,
        resources: typing.Optional[typing.Sequence[builtins.str]] = None,
        status: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        traffic_percentage_to_monitor: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param monitor_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#monitor_name InternetmonitorMonitor#monitor_name}.
        :param health_events_config: health_events_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#health_events_config InternetmonitorMonitor#health_events_config}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#id InternetmonitorMonitor#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param internet_measurements_log_delivery: internet_measurements_log_delivery block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#internet_measurements_log_delivery InternetmonitorMonitor#internet_measurements_log_delivery}
        :param max_city_networks_to_monitor: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#max_city_networks_to_monitor InternetmonitorMonitor#max_city_networks_to_monitor}.
        :param resources: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#resources InternetmonitorMonitor#resources}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#status InternetmonitorMonitor#status}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags InternetmonitorMonitor#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags_all InternetmonitorMonitor#tags_all}.
        :param traffic_percentage_to_monitor: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#traffic_percentage_to_monitor InternetmonitorMonitor#traffic_percentage_to_monitor}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(health_events_config, dict):
            health_events_config = InternetmonitorMonitorHealthEventsConfig(**health_events_config)
        if isinstance(internet_measurements_log_delivery, dict):
            internet_measurements_log_delivery = InternetmonitorMonitorInternetMeasurementsLogDelivery(**internet_measurements_log_delivery)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4531c97e28865f879c056c97ef83b3bc6cd3f2e4a8be53ec7ee731113c3ecf7)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument monitor_name", value=monitor_name, expected_type=type_hints["monitor_name"])
            check_type(argname="argument health_events_config", value=health_events_config, expected_type=type_hints["health_events_config"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument internet_measurements_log_delivery", value=internet_measurements_log_delivery, expected_type=type_hints["internet_measurements_log_delivery"])
            check_type(argname="argument max_city_networks_to_monitor", value=max_city_networks_to_monitor, expected_type=type_hints["max_city_networks_to_monitor"])
            check_type(argname="argument resources", value=resources, expected_type=type_hints["resources"])
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument traffic_percentage_to_monitor", value=traffic_percentage_to_monitor, expected_type=type_hints["traffic_percentage_to_monitor"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "monitor_name": monitor_name,
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
        if health_events_config is not None:
            self._values["health_events_config"] = health_events_config
        if id is not None:
            self._values["id"] = id
        if internet_measurements_log_delivery is not None:
            self._values["internet_measurements_log_delivery"] = internet_measurements_log_delivery
        if max_city_networks_to_monitor is not None:
            self._values["max_city_networks_to_monitor"] = max_city_networks_to_monitor
        if resources is not None:
            self._values["resources"] = resources
        if status is not None:
            self._values["status"] = status
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if traffic_percentage_to_monitor is not None:
            self._values["traffic_percentage_to_monitor"] = traffic_percentage_to_monitor

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
    def monitor_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#monitor_name InternetmonitorMonitor#monitor_name}.'''
        result = self._values.get("monitor_name")
        assert result is not None, "Required property 'monitor_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def health_events_config(
        self,
    ) -> typing.Optional["InternetmonitorMonitorHealthEventsConfig"]:
        '''health_events_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#health_events_config InternetmonitorMonitor#health_events_config}
        '''
        result = self._values.get("health_events_config")
        return typing.cast(typing.Optional["InternetmonitorMonitorHealthEventsConfig"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#id InternetmonitorMonitor#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def internet_measurements_log_delivery(
        self,
    ) -> typing.Optional["InternetmonitorMonitorInternetMeasurementsLogDelivery"]:
        '''internet_measurements_log_delivery block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#internet_measurements_log_delivery InternetmonitorMonitor#internet_measurements_log_delivery}
        '''
        result = self._values.get("internet_measurements_log_delivery")
        return typing.cast(typing.Optional["InternetmonitorMonitorInternetMeasurementsLogDelivery"], result)

    @builtins.property
    def max_city_networks_to_monitor(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#max_city_networks_to_monitor InternetmonitorMonitor#max_city_networks_to_monitor}.'''
        result = self._values.get("max_city_networks_to_monitor")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def resources(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#resources InternetmonitorMonitor#resources}.'''
        result = self._values.get("resources")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#status InternetmonitorMonitor#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags InternetmonitorMonitor#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#tags_all InternetmonitorMonitor#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def traffic_percentage_to_monitor(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#traffic_percentage_to_monitor InternetmonitorMonitor#traffic_percentage_to_monitor}.'''
        result = self._values.get("traffic_percentage_to_monitor")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "InternetmonitorMonitorConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.internetmonitorMonitor.InternetmonitorMonitorHealthEventsConfig",
    jsii_struct_bases=[],
    name_mapping={
        "availability_score_threshold": "availabilityScoreThreshold",
        "performance_score_threshold": "performanceScoreThreshold",
    },
)
class InternetmonitorMonitorHealthEventsConfig:
    def __init__(
        self,
        *,
        availability_score_threshold: typing.Optional[jsii.Number] = None,
        performance_score_threshold: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param availability_score_threshold: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#availability_score_threshold InternetmonitorMonitor#availability_score_threshold}.
        :param performance_score_threshold: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#performance_score_threshold InternetmonitorMonitor#performance_score_threshold}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa6f1b4a9a596ae48de2ae15af9cd286a90e81503173ac824b171e0b083cfa03)
            check_type(argname="argument availability_score_threshold", value=availability_score_threshold, expected_type=type_hints["availability_score_threshold"])
            check_type(argname="argument performance_score_threshold", value=performance_score_threshold, expected_type=type_hints["performance_score_threshold"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if availability_score_threshold is not None:
            self._values["availability_score_threshold"] = availability_score_threshold
        if performance_score_threshold is not None:
            self._values["performance_score_threshold"] = performance_score_threshold

    @builtins.property
    def availability_score_threshold(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#availability_score_threshold InternetmonitorMonitor#availability_score_threshold}.'''
        result = self._values.get("availability_score_threshold")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def performance_score_threshold(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#performance_score_threshold InternetmonitorMonitor#performance_score_threshold}.'''
        result = self._values.get("performance_score_threshold")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "InternetmonitorMonitorHealthEventsConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class InternetmonitorMonitorHealthEventsConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.internetmonitorMonitor.InternetmonitorMonitorHealthEventsConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8650a81055138315282302fb65ff460fb46cfe434999bcfadab4202db67be05b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAvailabilityScoreThreshold")
    def reset_availability_score_threshold(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityScoreThreshold", []))

    @jsii.member(jsii_name="resetPerformanceScoreThreshold")
    def reset_performance_score_threshold(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPerformanceScoreThreshold", []))

    @builtins.property
    @jsii.member(jsii_name="availabilityScoreThresholdInput")
    def availability_score_threshold_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "availabilityScoreThresholdInput"))

    @builtins.property
    @jsii.member(jsii_name="performanceScoreThresholdInput")
    def performance_score_threshold_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "performanceScoreThresholdInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityScoreThreshold")
    def availability_score_threshold(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "availabilityScoreThreshold"))

    @availability_score_threshold.setter
    def availability_score_threshold(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3548f68b7a29ae0d0e0083796d3a3a0d6d0c91462f7d2135be89bfdb721308e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityScoreThreshold", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="performanceScoreThreshold")
    def performance_score_threshold(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "performanceScoreThreshold"))

    @performance_score_threshold.setter
    def performance_score_threshold(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__03a253652154d8765a4e482eb352df25ff70e936710317af50a931b31ea9c07c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "performanceScoreThreshold", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[InternetmonitorMonitorHealthEventsConfig]:
        return typing.cast(typing.Optional[InternetmonitorMonitorHealthEventsConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[InternetmonitorMonitorHealthEventsConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e944d4253a7cfbd5619fcaa4492b13fc06b26f15eef6d104ca876b116795da45)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.internetmonitorMonitor.InternetmonitorMonitorInternetMeasurementsLogDelivery",
    jsii_struct_bases=[],
    name_mapping={"s3_config": "s3Config"},
)
class InternetmonitorMonitorInternetMeasurementsLogDelivery:
    def __init__(
        self,
        *,
        s3_config: typing.Optional[typing.Union["InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param s3_config: s3_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#s3_config InternetmonitorMonitor#s3_config}
        '''
        if isinstance(s3_config, dict):
            s3_config = InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config(**s3_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__17acbdd64af8107b0a31a7742e7cf41fddbb9b01ec79edbb9dd3b7394699b3be)
            check_type(argname="argument s3_config", value=s3_config, expected_type=type_hints["s3_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if s3_config is not None:
            self._values["s3_config"] = s3_config

    @builtins.property
    def s3_config(
        self,
    ) -> typing.Optional["InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config"]:
        '''s3_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#s3_config InternetmonitorMonitor#s3_config}
        '''
        result = self._values.get("s3_config")
        return typing.cast(typing.Optional["InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "InternetmonitorMonitorInternetMeasurementsLogDelivery(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class InternetmonitorMonitorInternetMeasurementsLogDeliveryOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.internetmonitorMonitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b4f8b0a31e7a11b11ffe23a501facab26be33cac04d23d59071d90b72fa7b9fe)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putS3Config")
    def put_s3_config(
        self,
        *,
        bucket_name: builtins.str,
        bucket_prefix: typing.Optional[builtins.str] = None,
        log_delivery_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#bucket_name InternetmonitorMonitor#bucket_name}.
        :param bucket_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#bucket_prefix InternetmonitorMonitor#bucket_prefix}.
        :param log_delivery_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#log_delivery_status InternetmonitorMonitor#log_delivery_status}.
        '''
        value = InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config(
            bucket_name=bucket_name,
            bucket_prefix=bucket_prefix,
            log_delivery_status=log_delivery_status,
        )

        return typing.cast(None, jsii.invoke(self, "putS3Config", [value]))

    @jsii.member(jsii_name="resetS3Config")
    def reset_s3_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3Config", []))

    @builtins.property
    @jsii.member(jsii_name="s3Config")
    def s3_config(
        self,
    ) -> "InternetmonitorMonitorInternetMeasurementsLogDeliveryS3ConfigOutputReference":
        return typing.cast("InternetmonitorMonitorInternetMeasurementsLogDeliveryS3ConfigOutputReference", jsii.get(self, "s3Config"))

    @builtins.property
    @jsii.member(jsii_name="s3ConfigInput")
    def s3_config_input(
        self,
    ) -> typing.Optional["InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config"]:
        return typing.cast(typing.Optional["InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config"], jsii.get(self, "s3ConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[InternetmonitorMonitorInternetMeasurementsLogDelivery]:
        return typing.cast(typing.Optional[InternetmonitorMonitorInternetMeasurementsLogDelivery], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[InternetmonitorMonitorInternetMeasurementsLogDelivery],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96e197d056b60bc682e99d7513b5c1e7246e2ba13db7cd1125b83f378ca47263)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.internetmonitorMonitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config",
    jsii_struct_bases=[],
    name_mapping={
        "bucket_name": "bucketName",
        "bucket_prefix": "bucketPrefix",
        "log_delivery_status": "logDeliveryStatus",
    },
)
class InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config:
    def __init__(
        self,
        *,
        bucket_name: builtins.str,
        bucket_prefix: typing.Optional[builtins.str] = None,
        log_delivery_status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#bucket_name InternetmonitorMonitor#bucket_name}.
        :param bucket_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#bucket_prefix InternetmonitorMonitor#bucket_prefix}.
        :param log_delivery_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#log_delivery_status InternetmonitorMonitor#log_delivery_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2183cbe830be5dfb9a840dad8725d439b9bd380bbbf962e69f17864e96a7da0)
            check_type(argname="argument bucket_name", value=bucket_name, expected_type=type_hints["bucket_name"])
            check_type(argname="argument bucket_prefix", value=bucket_prefix, expected_type=type_hints["bucket_prefix"])
            check_type(argname="argument log_delivery_status", value=log_delivery_status, expected_type=type_hints["log_delivery_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "bucket_name": bucket_name,
        }
        if bucket_prefix is not None:
            self._values["bucket_prefix"] = bucket_prefix
        if log_delivery_status is not None:
            self._values["log_delivery_status"] = log_delivery_status

    @builtins.property
    def bucket_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#bucket_name InternetmonitorMonitor#bucket_name}.'''
        result = self._values.get("bucket_name")
        assert result is not None, "Required property 'bucket_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def bucket_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#bucket_prefix InternetmonitorMonitor#bucket_prefix}.'''
        result = self._values.get("bucket_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def log_delivery_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#log_delivery_status InternetmonitorMonitor#log_delivery_status}.'''
        result = self._values.get("log_delivery_status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class InternetmonitorMonitorInternetMeasurementsLogDeliveryS3ConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.internetmonitorMonitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3ConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ce0d3c381392db94521688f37ae16b20ba75c0a42c1961aa6eacc7c3100308fa)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetBucketPrefix")
    def reset_bucket_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBucketPrefix", []))

    @jsii.member(jsii_name="resetLogDeliveryStatus")
    def reset_log_delivery_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLogDeliveryStatus", []))

    @builtins.property
    @jsii.member(jsii_name="bucketNameInput")
    def bucket_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bucketNameInput"))

    @builtins.property
    @jsii.member(jsii_name="bucketPrefixInput")
    def bucket_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bucketPrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="logDeliveryStatusInput")
    def log_delivery_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "logDeliveryStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="bucketName")
    def bucket_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucketName"))

    @bucket_name.setter
    def bucket_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__27e1645927b92e5ef8f69ef83c8ff0b744aa0a1327613f19c0c8a1b690c80c70)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bucketName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="bucketPrefix")
    def bucket_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucketPrefix"))

    @bucket_prefix.setter
    def bucket_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8badacc39e6da8c602e420096a69489c07f16a1d0df127067d23101c7c99da0c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bucketPrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="logDeliveryStatus")
    def log_delivery_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "logDeliveryStatus"))

    @log_delivery_status.setter
    def log_delivery_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d93b1c79b76ae7519de28af4d0a8077b8b027ed3a7061ec60eab6b22cb832e4b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "logDeliveryStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config]:
        return typing.cast(typing.Optional[InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b13401dc09421d2826b379628495455f7b23587a7031dc26934d59b0630ef1f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "InternetmonitorMonitor",
    "InternetmonitorMonitorConfig",
    "InternetmonitorMonitorHealthEventsConfig",
    "InternetmonitorMonitorHealthEventsConfigOutputReference",
    "InternetmonitorMonitorInternetMeasurementsLogDelivery",
    "InternetmonitorMonitorInternetMeasurementsLogDeliveryOutputReference",
    "InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config",
    "InternetmonitorMonitorInternetMeasurementsLogDeliveryS3ConfigOutputReference",
]

publication.publish()

def _typecheckingstub__7d76323c761f7ffe946fa49fddedc940e8f95e4f475461ae21bb75b43ef09467(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    monitor_name: builtins.str,
    health_events_config: typing.Optional[typing.Union[InternetmonitorMonitorHealthEventsConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    internet_measurements_log_delivery: typing.Optional[typing.Union[InternetmonitorMonitorInternetMeasurementsLogDelivery, typing.Dict[builtins.str, typing.Any]]] = None,
    max_city_networks_to_monitor: typing.Optional[jsii.Number] = None,
    resources: typing.Optional[typing.Sequence[builtins.str]] = None,
    status: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    traffic_percentage_to_monitor: typing.Optional[jsii.Number] = None,
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

def _typecheckingstub__c6abaf52813457b3c36fb0fb1568aa3056f7abccbcc2634eeec079b5fd1082fc(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09c367a303652337fbbe11e8b89db803a6c7495a076e394dee06dfb1292a592a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e43cb5ff4a2c5357afc8c2b5ba0db0802d10d8b6c11f631db321ea4028bdda30(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c92a9c1c4d00bad8b6d6d3db66b74bdb1679d3499f4f2ea9adf1e373e3aff24(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f2fa83f5a754e5dc63c1dd0ccaab1b577726932f4d5fe25d30293e3d4bd3c503(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5fedc5c9227c70ad9c6f3425770741906d5d3c6a460377f8a27776fa25739dc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce9c0515059d321840927355f8f325831e1651b66631f49e56b209217c244e93(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a4602380c75dafc872c9c3b8f8c370a2bf39f8563acb442e040d575f5e8b4e77(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53fe25aa31a3ffdd56a01dc2cdec13d23d9d3782d822054a270f13b30764749a(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4531c97e28865f879c056c97ef83b3bc6cd3f2e4a8be53ec7ee731113c3ecf7(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    monitor_name: builtins.str,
    health_events_config: typing.Optional[typing.Union[InternetmonitorMonitorHealthEventsConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    internet_measurements_log_delivery: typing.Optional[typing.Union[InternetmonitorMonitorInternetMeasurementsLogDelivery, typing.Dict[builtins.str, typing.Any]]] = None,
    max_city_networks_to_monitor: typing.Optional[jsii.Number] = None,
    resources: typing.Optional[typing.Sequence[builtins.str]] = None,
    status: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    traffic_percentage_to_monitor: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa6f1b4a9a596ae48de2ae15af9cd286a90e81503173ac824b171e0b083cfa03(
    *,
    availability_score_threshold: typing.Optional[jsii.Number] = None,
    performance_score_threshold: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8650a81055138315282302fb65ff460fb46cfe434999bcfadab4202db67be05b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3548f68b7a29ae0d0e0083796d3a3a0d6d0c91462f7d2135be89bfdb721308e6(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__03a253652154d8765a4e482eb352df25ff70e936710317af50a931b31ea9c07c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e944d4253a7cfbd5619fcaa4492b13fc06b26f15eef6d104ca876b116795da45(
    value: typing.Optional[InternetmonitorMonitorHealthEventsConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__17acbdd64af8107b0a31a7742e7cf41fddbb9b01ec79edbb9dd3b7394699b3be(
    *,
    s3_config: typing.Optional[typing.Union[InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b4f8b0a31e7a11b11ffe23a501facab26be33cac04d23d59071d90b72fa7b9fe(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96e197d056b60bc682e99d7513b5c1e7246e2ba13db7cd1125b83f378ca47263(
    value: typing.Optional[InternetmonitorMonitorInternetMeasurementsLogDelivery],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2183cbe830be5dfb9a840dad8725d439b9bd380bbbf962e69f17864e96a7da0(
    *,
    bucket_name: builtins.str,
    bucket_prefix: typing.Optional[builtins.str] = None,
    log_delivery_status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce0d3c381392db94521688f37ae16b20ba75c0a42c1961aa6eacc7c3100308fa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27e1645927b92e5ef8f69ef83c8ff0b744aa0a1327613f19c0c8a1b690c80c70(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8badacc39e6da8c602e420096a69489c07f16a1d0df127067d23101c7c99da0c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d93b1c79b76ae7519de28af4d0a8077b8b027ed3a7061ec60eab6b22cb832e4b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b13401dc09421d2826b379628495455f7b23587a7031dc26934d59b0630ef1f(
    value: typing.Optional[InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config],
) -> None:
    """Type checking stubs"""
    pass
