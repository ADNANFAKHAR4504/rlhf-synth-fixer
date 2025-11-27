r'''
# `aws_codedeploy_deployment_config`

Refer to the Terraform Registry for docs: [`aws_codedeploy_deployment_config`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config).
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


class CodedeployDeploymentConfig(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfig",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config aws_codedeploy_deployment_config}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        deployment_config_name: builtins.str,
        compute_platform: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        minimum_healthy_hosts: typing.Optional[typing.Union["CodedeployDeploymentConfigMinimumHealthyHosts", typing.Dict[builtins.str, typing.Any]]] = None,
        traffic_routing_config: typing.Optional[typing.Union["CodedeployDeploymentConfigTrafficRoutingConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        zonal_config: typing.Optional[typing.Union["CodedeployDeploymentConfigZonalConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config aws_codedeploy_deployment_config} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param deployment_config_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#deployment_config_name CodedeployDeploymentConfig#deployment_config_name}.
        :param compute_platform: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#compute_platform CodedeployDeploymentConfig#compute_platform}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#id CodedeployDeploymentConfig#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param minimum_healthy_hosts: minimum_healthy_hosts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#minimum_healthy_hosts CodedeployDeploymentConfig#minimum_healthy_hosts}
        :param traffic_routing_config: traffic_routing_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#traffic_routing_config CodedeployDeploymentConfig#traffic_routing_config}
        :param zonal_config: zonal_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#zonal_config CodedeployDeploymentConfig#zonal_config}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2249797098671db4a9d8c099d7edda913269c18283bdcc28012d856ae5ef51b0)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = CodedeployDeploymentConfigConfig(
            deployment_config_name=deployment_config_name,
            compute_platform=compute_platform,
            id=id,
            minimum_healthy_hosts=minimum_healthy_hosts,
            traffic_routing_config=traffic_routing_config,
            zonal_config=zonal_config,
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
        '''Generates CDKTF code for importing a CodedeployDeploymentConfig resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the CodedeployDeploymentConfig to import.
        :param import_from_id: The id of the existing CodedeployDeploymentConfig that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the CodedeployDeploymentConfig to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e17fa068dea15b4a55bc97ca08aa918f42ca0b10d7f1f70b6e476f011edda23)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putMinimumHealthyHosts")
    def put_minimum_healthy_hosts(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
        value: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#type CodedeployDeploymentConfig#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#value CodedeployDeploymentConfig#value}.
        '''
        value_ = CodedeployDeploymentConfigMinimumHealthyHosts(type=type, value=value)

        return typing.cast(None, jsii.invoke(self, "putMinimumHealthyHosts", [value_]))

    @jsii.member(jsii_name="putTrafficRoutingConfig")
    def put_traffic_routing_config(
        self,
        *,
        time_based_canary: typing.Optional[typing.Union["CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary", typing.Dict[builtins.str, typing.Any]]] = None,
        time_based_linear: typing.Optional[typing.Union["CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear", typing.Dict[builtins.str, typing.Any]]] = None,
        type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param time_based_canary: time_based_canary block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#time_based_canary CodedeployDeploymentConfig#time_based_canary}
        :param time_based_linear: time_based_linear block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#time_based_linear CodedeployDeploymentConfig#time_based_linear}
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#type CodedeployDeploymentConfig#type}.
        '''
        value = CodedeployDeploymentConfigTrafficRoutingConfig(
            time_based_canary=time_based_canary,
            time_based_linear=time_based_linear,
            type=type,
        )

        return typing.cast(None, jsii.invoke(self, "putTrafficRoutingConfig", [value]))

    @jsii.member(jsii_name="putZonalConfig")
    def put_zonal_config(
        self,
        *,
        first_zone_monitor_duration_in_seconds: typing.Optional[jsii.Number] = None,
        minimum_healthy_hosts_per_zone: typing.Optional[typing.Union["CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone", typing.Dict[builtins.str, typing.Any]]] = None,
        monitor_duration_in_seconds: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param first_zone_monitor_duration_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#first_zone_monitor_duration_in_seconds CodedeployDeploymentConfig#first_zone_monitor_duration_in_seconds}.
        :param minimum_healthy_hosts_per_zone: minimum_healthy_hosts_per_zone block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#minimum_healthy_hosts_per_zone CodedeployDeploymentConfig#minimum_healthy_hosts_per_zone}
        :param monitor_duration_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#monitor_duration_in_seconds CodedeployDeploymentConfig#monitor_duration_in_seconds}.
        '''
        value = CodedeployDeploymentConfigZonalConfig(
            first_zone_monitor_duration_in_seconds=first_zone_monitor_duration_in_seconds,
            minimum_healthy_hosts_per_zone=minimum_healthy_hosts_per_zone,
            monitor_duration_in_seconds=monitor_duration_in_seconds,
        )

        return typing.cast(None, jsii.invoke(self, "putZonalConfig", [value]))

    @jsii.member(jsii_name="resetComputePlatform")
    def reset_compute_platform(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetComputePlatform", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetMinimumHealthyHosts")
    def reset_minimum_healthy_hosts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinimumHealthyHosts", []))

    @jsii.member(jsii_name="resetTrafficRoutingConfig")
    def reset_traffic_routing_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTrafficRoutingConfig", []))

    @jsii.member(jsii_name="resetZonalConfig")
    def reset_zonal_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetZonalConfig", []))

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
    @jsii.member(jsii_name="deploymentConfigId")
    def deployment_config_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deploymentConfigId"))

    @builtins.property
    @jsii.member(jsii_name="minimumHealthyHosts")
    def minimum_healthy_hosts(
        self,
    ) -> "CodedeployDeploymentConfigMinimumHealthyHostsOutputReference":
        return typing.cast("CodedeployDeploymentConfigMinimumHealthyHostsOutputReference", jsii.get(self, "minimumHealthyHosts"))

    @builtins.property
    @jsii.member(jsii_name="trafficRoutingConfig")
    def traffic_routing_config(
        self,
    ) -> "CodedeployDeploymentConfigTrafficRoutingConfigOutputReference":
        return typing.cast("CodedeployDeploymentConfigTrafficRoutingConfigOutputReference", jsii.get(self, "trafficRoutingConfig"))

    @builtins.property
    @jsii.member(jsii_name="zonalConfig")
    def zonal_config(self) -> "CodedeployDeploymentConfigZonalConfigOutputReference":
        return typing.cast("CodedeployDeploymentConfigZonalConfigOutputReference", jsii.get(self, "zonalConfig"))

    @builtins.property
    @jsii.member(jsii_name="computePlatformInput")
    def compute_platform_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "computePlatformInput"))

    @builtins.property
    @jsii.member(jsii_name="deploymentConfigNameInput")
    def deployment_config_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deploymentConfigNameInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="minimumHealthyHostsInput")
    def minimum_healthy_hosts_input(
        self,
    ) -> typing.Optional["CodedeployDeploymentConfigMinimumHealthyHosts"]:
        return typing.cast(typing.Optional["CodedeployDeploymentConfigMinimumHealthyHosts"], jsii.get(self, "minimumHealthyHostsInput"))

    @builtins.property
    @jsii.member(jsii_name="trafficRoutingConfigInput")
    def traffic_routing_config_input(
        self,
    ) -> typing.Optional["CodedeployDeploymentConfigTrafficRoutingConfig"]:
        return typing.cast(typing.Optional["CodedeployDeploymentConfigTrafficRoutingConfig"], jsii.get(self, "trafficRoutingConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="zonalConfigInput")
    def zonal_config_input(
        self,
    ) -> typing.Optional["CodedeployDeploymentConfigZonalConfig"]:
        return typing.cast(typing.Optional["CodedeployDeploymentConfigZonalConfig"], jsii.get(self, "zonalConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="computePlatform")
    def compute_platform(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "computePlatform"))

    @compute_platform.setter
    def compute_platform(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e26048a64c30e5f3057e2af69dcd09991e951cc996dce62bd50f9111d2b4b5a5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "computePlatform", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deploymentConfigName")
    def deployment_config_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deploymentConfigName"))

    @deployment_config_name.setter
    def deployment_config_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c761aef07c132be76c91c15c24deba600438971d6380826bafbd3e7a1fabcf73)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deploymentConfigName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32143a42ba726a125d9b9c52244f4f78fdd29ba4bc442bb98fdf7364a49d5721)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "deployment_config_name": "deploymentConfigName",
        "compute_platform": "computePlatform",
        "id": "id",
        "minimum_healthy_hosts": "minimumHealthyHosts",
        "traffic_routing_config": "trafficRoutingConfig",
        "zonal_config": "zonalConfig",
    },
)
class CodedeployDeploymentConfigConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        deployment_config_name: builtins.str,
        compute_platform: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        minimum_healthy_hosts: typing.Optional[typing.Union["CodedeployDeploymentConfigMinimumHealthyHosts", typing.Dict[builtins.str, typing.Any]]] = None,
        traffic_routing_config: typing.Optional[typing.Union["CodedeployDeploymentConfigTrafficRoutingConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        zonal_config: typing.Optional[typing.Union["CodedeployDeploymentConfigZonalConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param deployment_config_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#deployment_config_name CodedeployDeploymentConfig#deployment_config_name}.
        :param compute_platform: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#compute_platform CodedeployDeploymentConfig#compute_platform}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#id CodedeployDeploymentConfig#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param minimum_healthy_hosts: minimum_healthy_hosts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#minimum_healthy_hosts CodedeployDeploymentConfig#minimum_healthy_hosts}
        :param traffic_routing_config: traffic_routing_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#traffic_routing_config CodedeployDeploymentConfig#traffic_routing_config}
        :param zonal_config: zonal_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#zonal_config CodedeployDeploymentConfig#zonal_config}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(minimum_healthy_hosts, dict):
            minimum_healthy_hosts = CodedeployDeploymentConfigMinimumHealthyHosts(**minimum_healthy_hosts)
        if isinstance(traffic_routing_config, dict):
            traffic_routing_config = CodedeployDeploymentConfigTrafficRoutingConfig(**traffic_routing_config)
        if isinstance(zonal_config, dict):
            zonal_config = CodedeployDeploymentConfigZonalConfig(**zonal_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9a2893221fdba4db43fd7dce48c80a6208a2cb3782a80330cc40185492d40b0)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument deployment_config_name", value=deployment_config_name, expected_type=type_hints["deployment_config_name"])
            check_type(argname="argument compute_platform", value=compute_platform, expected_type=type_hints["compute_platform"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument minimum_healthy_hosts", value=minimum_healthy_hosts, expected_type=type_hints["minimum_healthy_hosts"])
            check_type(argname="argument traffic_routing_config", value=traffic_routing_config, expected_type=type_hints["traffic_routing_config"])
            check_type(argname="argument zonal_config", value=zonal_config, expected_type=type_hints["zonal_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "deployment_config_name": deployment_config_name,
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
        if compute_platform is not None:
            self._values["compute_platform"] = compute_platform
        if id is not None:
            self._values["id"] = id
        if minimum_healthy_hosts is not None:
            self._values["minimum_healthy_hosts"] = minimum_healthy_hosts
        if traffic_routing_config is not None:
            self._values["traffic_routing_config"] = traffic_routing_config
        if zonal_config is not None:
            self._values["zonal_config"] = zonal_config

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
    def deployment_config_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#deployment_config_name CodedeployDeploymentConfig#deployment_config_name}.'''
        result = self._values.get("deployment_config_name")
        assert result is not None, "Required property 'deployment_config_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def compute_platform(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#compute_platform CodedeployDeploymentConfig#compute_platform}.'''
        result = self._values.get("compute_platform")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#id CodedeployDeploymentConfig#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def minimum_healthy_hosts(
        self,
    ) -> typing.Optional["CodedeployDeploymentConfigMinimumHealthyHosts"]:
        '''minimum_healthy_hosts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#minimum_healthy_hosts CodedeployDeploymentConfig#minimum_healthy_hosts}
        '''
        result = self._values.get("minimum_healthy_hosts")
        return typing.cast(typing.Optional["CodedeployDeploymentConfigMinimumHealthyHosts"], result)

    @builtins.property
    def traffic_routing_config(
        self,
    ) -> typing.Optional["CodedeployDeploymentConfigTrafficRoutingConfig"]:
        '''traffic_routing_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#traffic_routing_config CodedeployDeploymentConfig#traffic_routing_config}
        '''
        result = self._values.get("traffic_routing_config")
        return typing.cast(typing.Optional["CodedeployDeploymentConfigTrafficRoutingConfig"], result)

    @builtins.property
    def zonal_config(self) -> typing.Optional["CodedeployDeploymentConfigZonalConfig"]:
        '''zonal_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#zonal_config CodedeployDeploymentConfig#zonal_config}
        '''
        result = self._values.get("zonal_config")
        return typing.cast(typing.Optional["CodedeployDeploymentConfigZonalConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodedeployDeploymentConfigConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigMinimumHealthyHosts",
    jsii_struct_bases=[],
    name_mapping={"type": "type", "value": "value"},
)
class CodedeployDeploymentConfigMinimumHealthyHosts:
    def __init__(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
        value: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#type CodedeployDeploymentConfig#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#value CodedeployDeploymentConfig#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6eb74ab08961f31c44968f6a293208f169b0ee2ef87cb2a0624fa5313a17d859)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if type is not None:
            self._values["type"] = type
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#type CodedeployDeploymentConfig#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#value CodedeployDeploymentConfig#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodedeployDeploymentConfigMinimumHealthyHosts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodedeployDeploymentConfigMinimumHealthyHostsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigMinimumHealthyHostsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3da8d807227c8db94443004a3f010bd151e0c76fcd75b62080a552688472c286)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3729d5174f5937175b076032e2480f3e6bffa5f2fd8a75329f14a75c0df3d52f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @value.setter
    def value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a1a422f4e0237da384799537c4d3b96e47b1a160159803c1f087cb61050dfc3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodedeployDeploymentConfigMinimumHealthyHosts]:
        return typing.cast(typing.Optional[CodedeployDeploymentConfigMinimumHealthyHosts], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodedeployDeploymentConfigMinimumHealthyHosts],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d40d54faadc7c54cf2df0966004651b87b1e00a3f9c69852d6dde70174032e1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigTrafficRoutingConfig",
    jsii_struct_bases=[],
    name_mapping={
        "time_based_canary": "timeBasedCanary",
        "time_based_linear": "timeBasedLinear",
        "type": "type",
    },
)
class CodedeployDeploymentConfigTrafficRoutingConfig:
    def __init__(
        self,
        *,
        time_based_canary: typing.Optional[typing.Union["CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary", typing.Dict[builtins.str, typing.Any]]] = None,
        time_based_linear: typing.Optional[typing.Union["CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear", typing.Dict[builtins.str, typing.Any]]] = None,
        type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param time_based_canary: time_based_canary block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#time_based_canary CodedeployDeploymentConfig#time_based_canary}
        :param time_based_linear: time_based_linear block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#time_based_linear CodedeployDeploymentConfig#time_based_linear}
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#type CodedeployDeploymentConfig#type}.
        '''
        if isinstance(time_based_canary, dict):
            time_based_canary = CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary(**time_based_canary)
        if isinstance(time_based_linear, dict):
            time_based_linear = CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear(**time_based_linear)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__432bc4cc6dd4e8191363d44c34b905fca0d47ceab98114b9a960f687ba08c258)
            check_type(argname="argument time_based_canary", value=time_based_canary, expected_type=type_hints["time_based_canary"])
            check_type(argname="argument time_based_linear", value=time_based_linear, expected_type=type_hints["time_based_linear"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if time_based_canary is not None:
            self._values["time_based_canary"] = time_based_canary
        if time_based_linear is not None:
            self._values["time_based_linear"] = time_based_linear
        if type is not None:
            self._values["type"] = type

    @builtins.property
    def time_based_canary(
        self,
    ) -> typing.Optional["CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary"]:
        '''time_based_canary block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#time_based_canary CodedeployDeploymentConfig#time_based_canary}
        '''
        result = self._values.get("time_based_canary")
        return typing.cast(typing.Optional["CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary"], result)

    @builtins.property
    def time_based_linear(
        self,
    ) -> typing.Optional["CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear"]:
        '''time_based_linear block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#time_based_linear CodedeployDeploymentConfig#time_based_linear}
        '''
        result = self._values.get("time_based_linear")
        return typing.cast(typing.Optional["CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear"], result)

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#type CodedeployDeploymentConfig#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodedeployDeploymentConfigTrafficRoutingConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodedeployDeploymentConfigTrafficRoutingConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigTrafficRoutingConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9bd5aea974079133645c53d139d3e0d35cdeebc7ef02b082e49ec123722d0a4e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putTimeBasedCanary")
    def put_time_based_canary(
        self,
        *,
        interval: typing.Optional[jsii.Number] = None,
        percentage: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param interval: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#interval CodedeployDeploymentConfig#interval}.
        :param percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#percentage CodedeployDeploymentConfig#percentage}.
        '''
        value = CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary(
            interval=interval, percentage=percentage
        )

        return typing.cast(None, jsii.invoke(self, "putTimeBasedCanary", [value]))

    @jsii.member(jsii_name="putTimeBasedLinear")
    def put_time_based_linear(
        self,
        *,
        interval: typing.Optional[jsii.Number] = None,
        percentage: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param interval: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#interval CodedeployDeploymentConfig#interval}.
        :param percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#percentage CodedeployDeploymentConfig#percentage}.
        '''
        value = CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear(
            interval=interval, percentage=percentage
        )

        return typing.cast(None, jsii.invoke(self, "putTimeBasedLinear", [value]))

    @jsii.member(jsii_name="resetTimeBasedCanary")
    def reset_time_based_canary(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeBasedCanary", []))

    @jsii.member(jsii_name="resetTimeBasedLinear")
    def reset_time_based_linear(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeBasedLinear", []))

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @builtins.property
    @jsii.member(jsii_name="timeBasedCanary")
    def time_based_canary(
        self,
    ) -> "CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanaryOutputReference":
        return typing.cast("CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanaryOutputReference", jsii.get(self, "timeBasedCanary"))

    @builtins.property
    @jsii.member(jsii_name="timeBasedLinear")
    def time_based_linear(
        self,
    ) -> "CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinearOutputReference":
        return typing.cast("CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinearOutputReference", jsii.get(self, "timeBasedLinear"))

    @builtins.property
    @jsii.member(jsii_name="timeBasedCanaryInput")
    def time_based_canary_input(
        self,
    ) -> typing.Optional["CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary"]:
        return typing.cast(typing.Optional["CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary"], jsii.get(self, "timeBasedCanaryInput"))

    @builtins.property
    @jsii.member(jsii_name="timeBasedLinearInput")
    def time_based_linear_input(
        self,
    ) -> typing.Optional["CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear"]:
        return typing.cast(typing.Optional["CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear"], jsii.get(self, "timeBasedLinearInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff10a54a21659b4369999bab2a02d8f923fc18221dc2e234736cf459bacb9d1e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodedeployDeploymentConfigTrafficRoutingConfig]:
        return typing.cast(typing.Optional[CodedeployDeploymentConfigTrafficRoutingConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodedeployDeploymentConfigTrafficRoutingConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ba090822b78decddc947aa91308db356efb81d8ca1d3152e69ce5861913e2d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary",
    jsii_struct_bases=[],
    name_mapping={"interval": "interval", "percentage": "percentage"},
)
class CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary:
    def __init__(
        self,
        *,
        interval: typing.Optional[jsii.Number] = None,
        percentage: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param interval: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#interval CodedeployDeploymentConfig#interval}.
        :param percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#percentage CodedeployDeploymentConfig#percentage}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ad91c69dfbfd47fd30dc838bdbc3947fd76ce738487dd8983cdfb7b75cf69e2)
            check_type(argname="argument interval", value=interval, expected_type=type_hints["interval"])
            check_type(argname="argument percentage", value=percentage, expected_type=type_hints["percentage"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if interval is not None:
            self._values["interval"] = interval
        if percentage is not None:
            self._values["percentage"] = percentage

    @builtins.property
    def interval(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#interval CodedeployDeploymentConfig#interval}.'''
        result = self._values.get("interval")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def percentage(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#percentage CodedeployDeploymentConfig#percentage}.'''
        result = self._values.get("percentage")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanaryOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanaryOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b13f3de83f3156d707250d1d677e805080fb323b6196a6d3ee13ffcbb621f6cb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetInterval")
    def reset_interval(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInterval", []))

    @jsii.member(jsii_name="resetPercentage")
    def reset_percentage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPercentage", []))

    @builtins.property
    @jsii.member(jsii_name="intervalInput")
    def interval_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "intervalInput"))

    @builtins.property
    @jsii.member(jsii_name="percentageInput")
    def percentage_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "percentageInput"))

    @builtins.property
    @jsii.member(jsii_name="interval")
    def interval(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "interval"))

    @interval.setter
    def interval(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c691a53b4e4b69d68b3aa9df4ab5c44bd86bac6e9ba7d1258cde40facea941a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "interval", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="percentage")
    def percentage(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "percentage"))

    @percentage.setter
    def percentage(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__394bf747e9d2a7904ffc1fe6515494d2823cd9d29674087f6cb5f852bf827b12)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "percentage", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary]:
        return typing.cast(typing.Optional[CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae1e243b9f0e6f97d0d4e7a2fc0faa8e43c68472ebcbf7accc0d2132076f82cf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear",
    jsii_struct_bases=[],
    name_mapping={"interval": "interval", "percentage": "percentage"},
)
class CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear:
    def __init__(
        self,
        *,
        interval: typing.Optional[jsii.Number] = None,
        percentage: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param interval: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#interval CodedeployDeploymentConfig#interval}.
        :param percentage: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#percentage CodedeployDeploymentConfig#percentage}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__024223099463053e6618e0aa380999a47b2c8adfdaee806e11e19575bd951db1)
            check_type(argname="argument interval", value=interval, expected_type=type_hints["interval"])
            check_type(argname="argument percentage", value=percentage, expected_type=type_hints["percentage"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if interval is not None:
            self._values["interval"] = interval
        if percentage is not None:
            self._values["percentage"] = percentage

    @builtins.property
    def interval(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#interval CodedeployDeploymentConfig#interval}.'''
        result = self._values.get("interval")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def percentage(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#percentage CodedeployDeploymentConfig#percentage}.'''
        result = self._values.get("percentage")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinearOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinearOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e2e549bbd3077ce2badd40e5702b5adc7cfd4287d579b2c95481c31bd12f8dce)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetInterval")
    def reset_interval(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInterval", []))

    @jsii.member(jsii_name="resetPercentage")
    def reset_percentage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPercentage", []))

    @builtins.property
    @jsii.member(jsii_name="intervalInput")
    def interval_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "intervalInput"))

    @builtins.property
    @jsii.member(jsii_name="percentageInput")
    def percentage_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "percentageInput"))

    @builtins.property
    @jsii.member(jsii_name="interval")
    def interval(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "interval"))

    @interval.setter
    def interval(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c46f38b74b630333cd2a044abde93219020e76c12251838c93f774ec5a06ba81)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "interval", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="percentage")
    def percentage(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "percentage"))

    @percentage.setter
    def percentage(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec7bc64d98df08ee9bd29b793cd5f13f4314ca11b9bf0b8c25c5f652a81ceaaa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "percentage", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear]:
        return typing.cast(typing.Optional[CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc6d167bb6cf0d4070fc643a6c466a6994ec89604a18ab17a2b0746d40237afc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigZonalConfig",
    jsii_struct_bases=[],
    name_mapping={
        "first_zone_monitor_duration_in_seconds": "firstZoneMonitorDurationInSeconds",
        "minimum_healthy_hosts_per_zone": "minimumHealthyHostsPerZone",
        "monitor_duration_in_seconds": "monitorDurationInSeconds",
    },
)
class CodedeployDeploymentConfigZonalConfig:
    def __init__(
        self,
        *,
        first_zone_monitor_duration_in_seconds: typing.Optional[jsii.Number] = None,
        minimum_healthy_hosts_per_zone: typing.Optional[typing.Union["CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone", typing.Dict[builtins.str, typing.Any]]] = None,
        monitor_duration_in_seconds: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param first_zone_monitor_duration_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#first_zone_monitor_duration_in_seconds CodedeployDeploymentConfig#first_zone_monitor_duration_in_seconds}.
        :param minimum_healthy_hosts_per_zone: minimum_healthy_hosts_per_zone block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#minimum_healthy_hosts_per_zone CodedeployDeploymentConfig#minimum_healthy_hosts_per_zone}
        :param monitor_duration_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#monitor_duration_in_seconds CodedeployDeploymentConfig#monitor_duration_in_seconds}.
        '''
        if isinstance(minimum_healthy_hosts_per_zone, dict):
            minimum_healthy_hosts_per_zone = CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone(**minimum_healthy_hosts_per_zone)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f715d0d803033a15d9bf27b60ee5c1b7397452a7894976a12a94ae5835ef3bc2)
            check_type(argname="argument first_zone_monitor_duration_in_seconds", value=first_zone_monitor_duration_in_seconds, expected_type=type_hints["first_zone_monitor_duration_in_seconds"])
            check_type(argname="argument minimum_healthy_hosts_per_zone", value=minimum_healthy_hosts_per_zone, expected_type=type_hints["minimum_healthy_hosts_per_zone"])
            check_type(argname="argument monitor_duration_in_seconds", value=monitor_duration_in_seconds, expected_type=type_hints["monitor_duration_in_seconds"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if first_zone_monitor_duration_in_seconds is not None:
            self._values["first_zone_monitor_duration_in_seconds"] = first_zone_monitor_duration_in_seconds
        if minimum_healthy_hosts_per_zone is not None:
            self._values["minimum_healthy_hosts_per_zone"] = minimum_healthy_hosts_per_zone
        if monitor_duration_in_seconds is not None:
            self._values["monitor_duration_in_seconds"] = monitor_duration_in_seconds

    @builtins.property
    def first_zone_monitor_duration_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#first_zone_monitor_duration_in_seconds CodedeployDeploymentConfig#first_zone_monitor_duration_in_seconds}.'''
        result = self._values.get("first_zone_monitor_duration_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def minimum_healthy_hosts_per_zone(
        self,
    ) -> typing.Optional["CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone"]:
        '''minimum_healthy_hosts_per_zone block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#minimum_healthy_hosts_per_zone CodedeployDeploymentConfig#minimum_healthy_hosts_per_zone}
        '''
        result = self._values.get("minimum_healthy_hosts_per_zone")
        return typing.cast(typing.Optional["CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone"], result)

    @builtins.property
    def monitor_duration_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#monitor_duration_in_seconds CodedeployDeploymentConfig#monitor_duration_in_seconds}.'''
        result = self._values.get("monitor_duration_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodedeployDeploymentConfigZonalConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone",
    jsii_struct_bases=[],
    name_mapping={"type": "type", "value": "value"},
)
class CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone:
    def __init__(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
        value: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#type CodedeployDeploymentConfig#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#value CodedeployDeploymentConfig#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__53cbb81799d1e254b5276e6d043f433e5b4b0bb88223c13ffefaab13eb5d2ab3)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if type is not None:
            self._values["type"] = type
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#type CodedeployDeploymentConfig#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#value CodedeployDeploymentConfig#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZoneOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZoneOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__80de1fcf5ae0f2a8248535d4dee8bd37266072ec56c78c3b859f036702d16f3e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__48eece48ebef472c73e545146df18efe129b49327f8fdd7300ac06cd1434d3eb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @value.setter
    def value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec5467068b86b82eac0e69e4a1972b39dfa81cb8bf2bb3944b496eccd6949b62)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone]:
        return typing.cast(typing.Optional[CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fdb820a166a3229a4c0db14bc95369c7a1b1a0499bb44821ce4f95e01a0dd4ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodedeployDeploymentConfigZonalConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codedeployDeploymentConfig.CodedeployDeploymentConfigZonalConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c37f68cb44027ac909ffd7bfb9dbf7331c512090b2a163853afcdc4af5348ca8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putMinimumHealthyHostsPerZone")
    def put_minimum_healthy_hosts_per_zone(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
        value: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#type CodedeployDeploymentConfig#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#value CodedeployDeploymentConfig#value}.
        '''
        value_ = CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone(
            type=type, value=value
        )

        return typing.cast(None, jsii.invoke(self, "putMinimumHealthyHostsPerZone", [value_]))

    @jsii.member(jsii_name="resetFirstZoneMonitorDurationInSeconds")
    def reset_first_zone_monitor_duration_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFirstZoneMonitorDurationInSeconds", []))

    @jsii.member(jsii_name="resetMinimumHealthyHostsPerZone")
    def reset_minimum_healthy_hosts_per_zone(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinimumHealthyHostsPerZone", []))

    @jsii.member(jsii_name="resetMonitorDurationInSeconds")
    def reset_monitor_duration_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMonitorDurationInSeconds", []))

    @builtins.property
    @jsii.member(jsii_name="minimumHealthyHostsPerZone")
    def minimum_healthy_hosts_per_zone(
        self,
    ) -> CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZoneOutputReference:
        return typing.cast(CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZoneOutputReference, jsii.get(self, "minimumHealthyHostsPerZone"))

    @builtins.property
    @jsii.member(jsii_name="firstZoneMonitorDurationInSecondsInput")
    def first_zone_monitor_duration_in_seconds_input(
        self,
    ) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "firstZoneMonitorDurationInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="minimumHealthyHostsPerZoneInput")
    def minimum_healthy_hosts_per_zone_input(
        self,
    ) -> typing.Optional[CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone]:
        return typing.cast(typing.Optional[CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone], jsii.get(self, "minimumHealthyHostsPerZoneInput"))

    @builtins.property
    @jsii.member(jsii_name="monitorDurationInSecondsInput")
    def monitor_duration_in_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "monitorDurationInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="firstZoneMonitorDurationInSeconds")
    def first_zone_monitor_duration_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "firstZoneMonitorDurationInSeconds"))

    @first_zone_monitor_duration_in_seconds.setter
    def first_zone_monitor_duration_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb57d01a321e5e06523634ae3f91045002bcb7e1efa0b9cb7aad090936e8704e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "firstZoneMonitorDurationInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="monitorDurationInSeconds")
    def monitor_duration_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "monitorDurationInSeconds"))

    @monitor_duration_in_seconds.setter
    def monitor_duration_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b6a77547a0df33f4c8cacf653a12ef627e665ab0c6a40812312d400e00b0a440)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "monitorDurationInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CodedeployDeploymentConfigZonalConfig]:
        return typing.cast(typing.Optional[CodedeployDeploymentConfigZonalConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodedeployDeploymentConfigZonalConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__44bfc9f6d8bd997e469ddf0a2e8eee36ef26a80f63184c63ce750e519491bd5b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "CodedeployDeploymentConfig",
    "CodedeployDeploymentConfigConfig",
    "CodedeployDeploymentConfigMinimumHealthyHosts",
    "CodedeployDeploymentConfigMinimumHealthyHostsOutputReference",
    "CodedeployDeploymentConfigTrafficRoutingConfig",
    "CodedeployDeploymentConfigTrafficRoutingConfigOutputReference",
    "CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary",
    "CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanaryOutputReference",
    "CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear",
    "CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinearOutputReference",
    "CodedeployDeploymentConfigZonalConfig",
    "CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone",
    "CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZoneOutputReference",
    "CodedeployDeploymentConfigZonalConfigOutputReference",
]

publication.publish()

def _typecheckingstub__2249797098671db4a9d8c099d7edda913269c18283bdcc28012d856ae5ef51b0(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    deployment_config_name: builtins.str,
    compute_platform: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    minimum_healthy_hosts: typing.Optional[typing.Union[CodedeployDeploymentConfigMinimumHealthyHosts, typing.Dict[builtins.str, typing.Any]]] = None,
    traffic_routing_config: typing.Optional[typing.Union[CodedeployDeploymentConfigTrafficRoutingConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    zonal_config: typing.Optional[typing.Union[CodedeployDeploymentConfigZonalConfig, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__4e17fa068dea15b4a55bc97ca08aa918f42ca0b10d7f1f70b6e476f011edda23(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e26048a64c30e5f3057e2af69dcd09991e951cc996dce62bd50f9111d2b4b5a5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c761aef07c132be76c91c15c24deba600438971d6380826bafbd3e7a1fabcf73(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32143a42ba726a125d9b9c52244f4f78fdd29ba4bc442bb98fdf7364a49d5721(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9a2893221fdba4db43fd7dce48c80a6208a2cb3782a80330cc40185492d40b0(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    deployment_config_name: builtins.str,
    compute_platform: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    minimum_healthy_hosts: typing.Optional[typing.Union[CodedeployDeploymentConfigMinimumHealthyHosts, typing.Dict[builtins.str, typing.Any]]] = None,
    traffic_routing_config: typing.Optional[typing.Union[CodedeployDeploymentConfigTrafficRoutingConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    zonal_config: typing.Optional[typing.Union[CodedeployDeploymentConfigZonalConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6eb74ab08961f31c44968f6a293208f169b0ee2ef87cb2a0624fa5313a17d859(
    *,
    type: typing.Optional[builtins.str] = None,
    value: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3da8d807227c8db94443004a3f010bd151e0c76fcd75b62080a552688472c286(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3729d5174f5937175b076032e2480f3e6bffa5f2fd8a75329f14a75c0df3d52f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a1a422f4e0237da384799537c4d3b96e47b1a160159803c1f087cb61050dfc3(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d40d54faadc7c54cf2df0966004651b87b1e00a3f9c69852d6dde70174032e1(
    value: typing.Optional[CodedeployDeploymentConfigMinimumHealthyHosts],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__432bc4cc6dd4e8191363d44c34b905fca0d47ceab98114b9a960f687ba08c258(
    *,
    time_based_canary: typing.Optional[typing.Union[CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary, typing.Dict[builtins.str, typing.Any]]] = None,
    time_based_linear: typing.Optional[typing.Union[CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear, typing.Dict[builtins.str, typing.Any]]] = None,
    type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9bd5aea974079133645c53d139d3e0d35cdeebc7ef02b082e49ec123722d0a4e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff10a54a21659b4369999bab2a02d8f923fc18221dc2e234736cf459bacb9d1e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ba090822b78decddc947aa91308db356efb81d8ca1d3152e69ce5861913e2d9(
    value: typing.Optional[CodedeployDeploymentConfigTrafficRoutingConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ad91c69dfbfd47fd30dc838bdbc3947fd76ce738487dd8983cdfb7b75cf69e2(
    *,
    interval: typing.Optional[jsii.Number] = None,
    percentage: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b13f3de83f3156d707250d1d677e805080fb323b6196a6d3ee13ffcbb621f6cb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c691a53b4e4b69d68b3aa9df4ab5c44bd86bac6e9ba7d1258cde40facea941a(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__394bf747e9d2a7904ffc1fe6515494d2823cd9d29674087f6cb5f852bf827b12(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae1e243b9f0e6f97d0d4e7a2fc0faa8e43c68472ebcbf7accc0d2132076f82cf(
    value: typing.Optional[CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__024223099463053e6618e0aa380999a47b2c8adfdaee806e11e19575bd951db1(
    *,
    interval: typing.Optional[jsii.Number] = None,
    percentage: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2e549bbd3077ce2badd40e5702b5adc7cfd4287d579b2c95481c31bd12f8dce(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c46f38b74b630333cd2a044abde93219020e76c12251838c93f774ec5a06ba81(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec7bc64d98df08ee9bd29b793cd5f13f4314ca11b9bf0b8c25c5f652a81ceaaa(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc6d167bb6cf0d4070fc643a6c466a6994ec89604a18ab17a2b0746d40237afc(
    value: typing.Optional[CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f715d0d803033a15d9bf27b60ee5c1b7397452a7894976a12a94ae5835ef3bc2(
    *,
    first_zone_monitor_duration_in_seconds: typing.Optional[jsii.Number] = None,
    minimum_healthy_hosts_per_zone: typing.Optional[typing.Union[CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone, typing.Dict[builtins.str, typing.Any]]] = None,
    monitor_duration_in_seconds: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53cbb81799d1e254b5276e6d043f433e5b4b0bb88223c13ffefaab13eb5d2ab3(
    *,
    type: typing.Optional[builtins.str] = None,
    value: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__80de1fcf5ae0f2a8248535d4dee8bd37266072ec56c78c3b859f036702d16f3e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__48eece48ebef472c73e545146df18efe129b49327f8fdd7300ac06cd1434d3eb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec5467068b86b82eac0e69e4a1972b39dfa81cb8bf2bb3944b496eccd6949b62(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdb820a166a3229a4c0db14bc95369c7a1b1a0499bb44821ce4f95e01a0dd4ce(
    value: typing.Optional[CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c37f68cb44027ac909ffd7bfb9dbf7331c512090b2a163853afcdc4af5348ca8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb57d01a321e5e06523634ae3f91045002bcb7e1efa0b9cb7aad090936e8704e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6a77547a0df33f4c8cacf653a12ef627e665ab0c6a40812312d400e00b0a440(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44bfc9f6d8bd997e469ddf0a2e8eee36ef26a80f63184c63ce750e519491bd5b(
    value: typing.Optional[CodedeployDeploymentConfigZonalConfig],
) -> None:
    """Type checking stubs"""
    pass
