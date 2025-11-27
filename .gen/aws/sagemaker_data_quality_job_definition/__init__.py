r'''
# `aws_sagemaker_data_quality_job_definition`

Refer to the Terraform Registry for docs: [`aws_sagemaker_data_quality_job_definition`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition).
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


class SagemakerDataQualityJobDefinition(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinition",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition aws_sagemaker_data_quality_job_definition}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        data_quality_app_specification: typing.Union["SagemakerDataQualityJobDefinitionDataQualityAppSpecification", typing.Dict[builtins.str, typing.Any]],
        data_quality_job_input: typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobInput", typing.Dict[builtins.str, typing.Any]],
        data_quality_job_output_config: typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig", typing.Dict[builtins.str, typing.Any]],
        job_resources: typing.Union["SagemakerDataQualityJobDefinitionJobResources", typing.Dict[builtins.str, typing.Any]],
        role_arn: builtins.str,
        data_quality_baseline_config: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionDataQualityBaselineConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        network_config: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionNetworkConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        stopping_condition: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionStoppingCondition", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition aws_sagemaker_data_quality_job_definition} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param data_quality_app_specification: data_quality_app_specification block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_app_specification SagemakerDataQualityJobDefinition#data_quality_app_specification}
        :param data_quality_job_input: data_quality_job_input block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_job_input SagemakerDataQualityJobDefinition#data_quality_job_input}
        :param data_quality_job_output_config: data_quality_job_output_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_job_output_config SagemakerDataQualityJobDefinition#data_quality_job_output_config}
        :param job_resources: job_resources block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#job_resources SagemakerDataQualityJobDefinition#job_resources}
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#role_arn SagemakerDataQualityJobDefinition#role_arn}.
        :param data_quality_baseline_config: data_quality_baseline_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_baseline_config SagemakerDataQualityJobDefinition#data_quality_baseline_config}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#id SagemakerDataQualityJobDefinition#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#name SagemakerDataQualityJobDefinition#name}.
        :param network_config: network_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#network_config SagemakerDataQualityJobDefinition#network_config}
        :param stopping_condition: stopping_condition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#stopping_condition SagemakerDataQualityJobDefinition#stopping_condition}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#tags SagemakerDataQualityJobDefinition#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#tags_all SagemakerDataQualityJobDefinition#tags_all}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df91bbd4b7260748df3f8efed50d4a84a012df1ce9b62c9cdb2bf27585f6c5f5)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = SagemakerDataQualityJobDefinitionConfig(
            data_quality_app_specification=data_quality_app_specification,
            data_quality_job_input=data_quality_job_input,
            data_quality_job_output_config=data_quality_job_output_config,
            job_resources=job_resources,
            role_arn=role_arn,
            data_quality_baseline_config=data_quality_baseline_config,
            id=id,
            name=name,
            network_config=network_config,
            stopping_condition=stopping_condition,
            tags=tags,
            tags_all=tags_all,
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
        '''Generates CDKTF code for importing a SagemakerDataQualityJobDefinition resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the SagemakerDataQualityJobDefinition to import.
        :param import_from_id: The id of the existing SagemakerDataQualityJobDefinition that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the SagemakerDataQualityJobDefinition to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e3250f7aa48a6ea010e4556b63f1bdeb6fb4c5b689a4638a5425582077cde4ae)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putDataQualityAppSpecification")
    def put_data_quality_app_specification(
        self,
        *,
        image_uri: builtins.str,
        environment: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        post_analytics_processor_source_uri: typing.Optional[builtins.str] = None,
        record_preprocessor_source_uri: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param image_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#image_uri SagemakerDataQualityJobDefinition#image_uri}.
        :param environment: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#environment SagemakerDataQualityJobDefinition#environment}.
        :param post_analytics_processor_source_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#post_analytics_processor_source_uri SagemakerDataQualityJobDefinition#post_analytics_processor_source_uri}.
        :param record_preprocessor_source_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#record_preprocessor_source_uri SagemakerDataQualityJobDefinition#record_preprocessor_source_uri}.
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityAppSpecification(
            image_uri=image_uri,
            environment=environment,
            post_analytics_processor_source_uri=post_analytics_processor_source_uri,
            record_preprocessor_source_uri=record_preprocessor_source_uri,
        )

        return typing.cast(None, jsii.invoke(self, "putDataQualityAppSpecification", [value]))

    @jsii.member(jsii_name="putDataQualityBaselineConfig")
    def put_data_quality_baseline_config(
        self,
        *,
        constraints_resource: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource", typing.Dict[builtins.str, typing.Any]]] = None,
        statistics_resource: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param constraints_resource: constraints_resource block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#constraints_resource SagemakerDataQualityJobDefinition#constraints_resource}
        :param statistics_resource: statistics_resource block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#statistics_resource SagemakerDataQualityJobDefinition#statistics_resource}
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityBaselineConfig(
            constraints_resource=constraints_resource,
            statistics_resource=statistics_resource,
        )

        return typing.cast(None, jsii.invoke(self, "putDataQualityBaselineConfig", [value]))

    @jsii.member(jsii_name="putDataQualityJobInput")
    def put_data_quality_job_input(
        self,
        *,
        batch_transform_input: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput", typing.Dict[builtins.str, typing.Any]]] = None,
        endpoint_input: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param batch_transform_input: batch_transform_input block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#batch_transform_input SagemakerDataQualityJobDefinition#batch_transform_input}
        :param endpoint_input: endpoint_input block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#endpoint_input SagemakerDataQualityJobDefinition#endpoint_input}
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityJobInput(
            batch_transform_input=batch_transform_input, endpoint_input=endpoint_input
        )

        return typing.cast(None, jsii.invoke(self, "putDataQualityJobInput", [value]))

    @jsii.member(jsii_name="putDataQualityJobOutputConfig")
    def put_data_quality_job_output_config(
        self,
        *,
        monitoring_outputs: typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs", typing.Dict[builtins.str, typing.Any]],
        kms_key_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param monitoring_outputs: monitoring_outputs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#monitoring_outputs SagemakerDataQualityJobDefinition#monitoring_outputs}
        :param kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#kms_key_id SagemakerDataQualityJobDefinition#kms_key_id}.
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig(
            monitoring_outputs=monitoring_outputs, kms_key_id=kms_key_id
        )

        return typing.cast(None, jsii.invoke(self, "putDataQualityJobOutputConfig", [value]))

    @jsii.member(jsii_name="putJobResources")
    def put_job_resources(
        self,
        *,
        cluster_config: typing.Union["SagemakerDataQualityJobDefinitionJobResourcesClusterConfig", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param cluster_config: cluster_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#cluster_config SagemakerDataQualityJobDefinition#cluster_config}
        '''
        value = SagemakerDataQualityJobDefinitionJobResources(
            cluster_config=cluster_config
        )

        return typing.cast(None, jsii.invoke(self, "putJobResources", [value]))

    @jsii.member(jsii_name="putNetworkConfig")
    def put_network_config(
        self,
        *,
        enable_inter_container_traffic_encryption: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_network_isolation: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        vpc_config: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param enable_inter_container_traffic_encryption: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#enable_inter_container_traffic_encryption SagemakerDataQualityJobDefinition#enable_inter_container_traffic_encryption}.
        :param enable_network_isolation: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#enable_network_isolation SagemakerDataQualityJobDefinition#enable_network_isolation}.
        :param vpc_config: vpc_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#vpc_config SagemakerDataQualityJobDefinition#vpc_config}
        '''
        value = SagemakerDataQualityJobDefinitionNetworkConfig(
            enable_inter_container_traffic_encryption=enable_inter_container_traffic_encryption,
            enable_network_isolation=enable_network_isolation,
            vpc_config=vpc_config,
        )

        return typing.cast(None, jsii.invoke(self, "putNetworkConfig", [value]))

    @jsii.member(jsii_name="putStoppingCondition")
    def put_stopping_condition(
        self,
        *,
        max_runtime_in_seconds: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max_runtime_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#max_runtime_in_seconds SagemakerDataQualityJobDefinition#max_runtime_in_seconds}.
        '''
        value = SagemakerDataQualityJobDefinitionStoppingCondition(
            max_runtime_in_seconds=max_runtime_in_seconds
        )

        return typing.cast(None, jsii.invoke(self, "putStoppingCondition", [value]))

    @jsii.member(jsii_name="resetDataQualityBaselineConfig")
    def reset_data_quality_baseline_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataQualityBaselineConfig", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetNetworkConfig")
    def reset_network_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNetworkConfig", []))

    @jsii.member(jsii_name="resetStoppingCondition")
    def reset_stopping_condition(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStoppingCondition", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

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
    @jsii.member(jsii_name="dataQualityAppSpecification")
    def data_quality_app_specification(
        self,
    ) -> "SagemakerDataQualityJobDefinitionDataQualityAppSpecificationOutputReference":
        return typing.cast("SagemakerDataQualityJobDefinitionDataQualityAppSpecificationOutputReference", jsii.get(self, "dataQualityAppSpecification"))

    @builtins.property
    @jsii.member(jsii_name="dataQualityBaselineConfig")
    def data_quality_baseline_config(
        self,
    ) -> "SagemakerDataQualityJobDefinitionDataQualityBaselineConfigOutputReference":
        return typing.cast("SagemakerDataQualityJobDefinitionDataQualityBaselineConfigOutputReference", jsii.get(self, "dataQualityBaselineConfig"))

    @builtins.property
    @jsii.member(jsii_name="dataQualityJobInput")
    def data_quality_job_input(
        self,
    ) -> "SagemakerDataQualityJobDefinitionDataQualityJobInputOutputReference":
        return typing.cast("SagemakerDataQualityJobDefinitionDataQualityJobInputOutputReference", jsii.get(self, "dataQualityJobInput"))

    @builtins.property
    @jsii.member(jsii_name="dataQualityJobOutputConfig")
    def data_quality_job_output_config(
        self,
    ) -> "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigOutputReference":
        return typing.cast("SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigOutputReference", jsii.get(self, "dataQualityJobOutputConfig"))

    @builtins.property
    @jsii.member(jsii_name="jobResources")
    def job_resources(
        self,
    ) -> "SagemakerDataQualityJobDefinitionJobResourcesOutputReference":
        return typing.cast("SagemakerDataQualityJobDefinitionJobResourcesOutputReference", jsii.get(self, "jobResources"))

    @builtins.property
    @jsii.member(jsii_name="networkConfig")
    def network_config(
        self,
    ) -> "SagemakerDataQualityJobDefinitionNetworkConfigOutputReference":
        return typing.cast("SagemakerDataQualityJobDefinitionNetworkConfigOutputReference", jsii.get(self, "networkConfig"))

    @builtins.property
    @jsii.member(jsii_name="stoppingCondition")
    def stopping_condition(
        self,
    ) -> "SagemakerDataQualityJobDefinitionStoppingConditionOutputReference":
        return typing.cast("SagemakerDataQualityJobDefinitionStoppingConditionOutputReference", jsii.get(self, "stoppingCondition"))

    @builtins.property
    @jsii.member(jsii_name="dataQualityAppSpecificationInput")
    def data_quality_app_specification_input(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityAppSpecification"]:
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityAppSpecification"], jsii.get(self, "dataQualityAppSpecificationInput"))

    @builtins.property
    @jsii.member(jsii_name="dataQualityBaselineConfigInput")
    def data_quality_baseline_config_input(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityBaselineConfig"]:
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityBaselineConfig"], jsii.get(self, "dataQualityBaselineConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="dataQualityJobInputInput")
    def data_quality_job_input_input(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobInput"]:
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobInput"], jsii.get(self, "dataQualityJobInputInput"))

    @builtins.property
    @jsii.member(jsii_name="dataQualityJobOutputConfigInput")
    def data_quality_job_output_config_input(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig"]:
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig"], jsii.get(self, "dataQualityJobOutputConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="jobResourcesInput")
    def job_resources_input(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionJobResources"]:
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionJobResources"], jsii.get(self, "jobResourcesInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="networkConfigInput")
    def network_config_input(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionNetworkConfig"]:
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionNetworkConfig"], jsii.get(self, "networkConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="stoppingConditionInput")
    def stopping_condition_input(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionStoppingCondition"]:
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionStoppingCondition"], jsii.get(self, "stoppingConditionInput"))

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
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2606015202807d80a6d893c1df768b9ad140dabdc435326a360f5b3bfd376795)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37197cbcee5c4df39264020f695b85783617d91fd6282a180673e7e6ab3a147c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__53691516e0a17200e7d1e07095d49197405d59789aa8078e7da6aced2c622585)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d1721ee951c7df864d69f6456d6b82bcad5d62aca6a2bc7c5f211547f609cfff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__30b1d9fa2a4a8b199a935a8ed524cfeb75d24ed9961f3594a823f20c944d153f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "data_quality_app_specification": "dataQualityAppSpecification",
        "data_quality_job_input": "dataQualityJobInput",
        "data_quality_job_output_config": "dataQualityJobOutputConfig",
        "job_resources": "jobResources",
        "role_arn": "roleArn",
        "data_quality_baseline_config": "dataQualityBaselineConfig",
        "id": "id",
        "name": "name",
        "network_config": "networkConfig",
        "stopping_condition": "stoppingCondition",
        "tags": "tags",
        "tags_all": "tagsAll",
    },
)
class SagemakerDataQualityJobDefinitionConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        data_quality_app_specification: typing.Union["SagemakerDataQualityJobDefinitionDataQualityAppSpecification", typing.Dict[builtins.str, typing.Any]],
        data_quality_job_input: typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobInput", typing.Dict[builtins.str, typing.Any]],
        data_quality_job_output_config: typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig", typing.Dict[builtins.str, typing.Any]],
        job_resources: typing.Union["SagemakerDataQualityJobDefinitionJobResources", typing.Dict[builtins.str, typing.Any]],
        role_arn: builtins.str,
        data_quality_baseline_config: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionDataQualityBaselineConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        network_config: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionNetworkConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        stopping_condition: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionStoppingCondition", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param data_quality_app_specification: data_quality_app_specification block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_app_specification SagemakerDataQualityJobDefinition#data_quality_app_specification}
        :param data_quality_job_input: data_quality_job_input block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_job_input SagemakerDataQualityJobDefinition#data_quality_job_input}
        :param data_quality_job_output_config: data_quality_job_output_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_job_output_config SagemakerDataQualityJobDefinition#data_quality_job_output_config}
        :param job_resources: job_resources block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#job_resources SagemakerDataQualityJobDefinition#job_resources}
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#role_arn SagemakerDataQualityJobDefinition#role_arn}.
        :param data_quality_baseline_config: data_quality_baseline_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_baseline_config SagemakerDataQualityJobDefinition#data_quality_baseline_config}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#id SagemakerDataQualityJobDefinition#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#name SagemakerDataQualityJobDefinition#name}.
        :param network_config: network_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#network_config SagemakerDataQualityJobDefinition#network_config}
        :param stopping_condition: stopping_condition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#stopping_condition SagemakerDataQualityJobDefinition#stopping_condition}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#tags SagemakerDataQualityJobDefinition#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#tags_all SagemakerDataQualityJobDefinition#tags_all}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(data_quality_app_specification, dict):
            data_quality_app_specification = SagemakerDataQualityJobDefinitionDataQualityAppSpecification(**data_quality_app_specification)
        if isinstance(data_quality_job_input, dict):
            data_quality_job_input = SagemakerDataQualityJobDefinitionDataQualityJobInput(**data_quality_job_input)
        if isinstance(data_quality_job_output_config, dict):
            data_quality_job_output_config = SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig(**data_quality_job_output_config)
        if isinstance(job_resources, dict):
            job_resources = SagemakerDataQualityJobDefinitionJobResources(**job_resources)
        if isinstance(data_quality_baseline_config, dict):
            data_quality_baseline_config = SagemakerDataQualityJobDefinitionDataQualityBaselineConfig(**data_quality_baseline_config)
        if isinstance(network_config, dict):
            network_config = SagemakerDataQualityJobDefinitionNetworkConfig(**network_config)
        if isinstance(stopping_condition, dict):
            stopping_condition = SagemakerDataQualityJobDefinitionStoppingCondition(**stopping_condition)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04781b5757522a636cc3a75de336ccdca1241b9fac7fa8ec4474bb5b5d15cae4)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument data_quality_app_specification", value=data_quality_app_specification, expected_type=type_hints["data_quality_app_specification"])
            check_type(argname="argument data_quality_job_input", value=data_quality_job_input, expected_type=type_hints["data_quality_job_input"])
            check_type(argname="argument data_quality_job_output_config", value=data_quality_job_output_config, expected_type=type_hints["data_quality_job_output_config"])
            check_type(argname="argument job_resources", value=job_resources, expected_type=type_hints["job_resources"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument data_quality_baseline_config", value=data_quality_baseline_config, expected_type=type_hints["data_quality_baseline_config"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument network_config", value=network_config, expected_type=type_hints["network_config"])
            check_type(argname="argument stopping_condition", value=stopping_condition, expected_type=type_hints["stopping_condition"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "data_quality_app_specification": data_quality_app_specification,
            "data_quality_job_input": data_quality_job_input,
            "data_quality_job_output_config": data_quality_job_output_config,
            "job_resources": job_resources,
            "role_arn": role_arn,
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
        if data_quality_baseline_config is not None:
            self._values["data_quality_baseline_config"] = data_quality_baseline_config
        if id is not None:
            self._values["id"] = id
        if name is not None:
            self._values["name"] = name
        if network_config is not None:
            self._values["network_config"] = network_config
        if stopping_condition is not None:
            self._values["stopping_condition"] = stopping_condition
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all

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
    def data_quality_app_specification(
        self,
    ) -> "SagemakerDataQualityJobDefinitionDataQualityAppSpecification":
        '''data_quality_app_specification block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_app_specification SagemakerDataQualityJobDefinition#data_quality_app_specification}
        '''
        result = self._values.get("data_quality_app_specification")
        assert result is not None, "Required property 'data_quality_app_specification' is missing"
        return typing.cast("SagemakerDataQualityJobDefinitionDataQualityAppSpecification", result)

    @builtins.property
    def data_quality_job_input(
        self,
    ) -> "SagemakerDataQualityJobDefinitionDataQualityJobInput":
        '''data_quality_job_input block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_job_input SagemakerDataQualityJobDefinition#data_quality_job_input}
        '''
        result = self._values.get("data_quality_job_input")
        assert result is not None, "Required property 'data_quality_job_input' is missing"
        return typing.cast("SagemakerDataQualityJobDefinitionDataQualityJobInput", result)

    @builtins.property
    def data_quality_job_output_config(
        self,
    ) -> "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig":
        '''data_quality_job_output_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_job_output_config SagemakerDataQualityJobDefinition#data_quality_job_output_config}
        '''
        result = self._values.get("data_quality_job_output_config")
        assert result is not None, "Required property 'data_quality_job_output_config' is missing"
        return typing.cast("SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig", result)

    @builtins.property
    def job_resources(self) -> "SagemakerDataQualityJobDefinitionJobResources":
        '''job_resources block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#job_resources SagemakerDataQualityJobDefinition#job_resources}
        '''
        result = self._values.get("job_resources")
        assert result is not None, "Required property 'job_resources' is missing"
        return typing.cast("SagemakerDataQualityJobDefinitionJobResources", result)

    @builtins.property
    def role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#role_arn SagemakerDataQualityJobDefinition#role_arn}.'''
        result = self._values.get("role_arn")
        assert result is not None, "Required property 'role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def data_quality_baseline_config(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityBaselineConfig"]:
        '''data_quality_baseline_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_baseline_config SagemakerDataQualityJobDefinition#data_quality_baseline_config}
        '''
        result = self._values.get("data_quality_baseline_config")
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityBaselineConfig"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#id SagemakerDataQualityJobDefinition#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#name SagemakerDataQualityJobDefinition#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def network_config(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionNetworkConfig"]:
        '''network_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#network_config SagemakerDataQualityJobDefinition#network_config}
        '''
        result = self._values.get("network_config")
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionNetworkConfig"], result)

    @builtins.property
    def stopping_condition(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionStoppingCondition"]:
        '''stopping_condition block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#stopping_condition SagemakerDataQualityJobDefinition#stopping_condition}
        '''
        result = self._values.get("stopping_condition")
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionStoppingCondition"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#tags SagemakerDataQualityJobDefinition#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#tags_all SagemakerDataQualityJobDefinition#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityAppSpecification",
    jsii_struct_bases=[],
    name_mapping={
        "image_uri": "imageUri",
        "environment": "environment",
        "post_analytics_processor_source_uri": "postAnalyticsProcessorSourceUri",
        "record_preprocessor_source_uri": "recordPreprocessorSourceUri",
    },
)
class SagemakerDataQualityJobDefinitionDataQualityAppSpecification:
    def __init__(
        self,
        *,
        image_uri: builtins.str,
        environment: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        post_analytics_processor_source_uri: typing.Optional[builtins.str] = None,
        record_preprocessor_source_uri: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param image_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#image_uri SagemakerDataQualityJobDefinition#image_uri}.
        :param environment: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#environment SagemakerDataQualityJobDefinition#environment}.
        :param post_analytics_processor_source_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#post_analytics_processor_source_uri SagemakerDataQualityJobDefinition#post_analytics_processor_source_uri}.
        :param record_preprocessor_source_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#record_preprocessor_source_uri SagemakerDataQualityJobDefinition#record_preprocessor_source_uri}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__85166a3bd8f40b9a1e62d2fef44e759d839229d55d46e6f1c61aeb0f8a0a5977)
            check_type(argname="argument image_uri", value=image_uri, expected_type=type_hints["image_uri"])
            check_type(argname="argument environment", value=environment, expected_type=type_hints["environment"])
            check_type(argname="argument post_analytics_processor_source_uri", value=post_analytics_processor_source_uri, expected_type=type_hints["post_analytics_processor_source_uri"])
            check_type(argname="argument record_preprocessor_source_uri", value=record_preprocessor_source_uri, expected_type=type_hints["record_preprocessor_source_uri"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "image_uri": image_uri,
        }
        if environment is not None:
            self._values["environment"] = environment
        if post_analytics_processor_source_uri is not None:
            self._values["post_analytics_processor_source_uri"] = post_analytics_processor_source_uri
        if record_preprocessor_source_uri is not None:
            self._values["record_preprocessor_source_uri"] = record_preprocessor_source_uri

    @builtins.property
    def image_uri(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#image_uri SagemakerDataQualityJobDefinition#image_uri}.'''
        result = self._values.get("image_uri")
        assert result is not None, "Required property 'image_uri' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def environment(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#environment SagemakerDataQualityJobDefinition#environment}.'''
        result = self._values.get("environment")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def post_analytics_processor_source_uri(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#post_analytics_processor_source_uri SagemakerDataQualityJobDefinition#post_analytics_processor_source_uri}.'''
        result = self._values.get("post_analytics_processor_source_uri")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def record_preprocessor_source_uri(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#record_preprocessor_source_uri SagemakerDataQualityJobDefinition#record_preprocessor_source_uri}.'''
        result = self._values.get("record_preprocessor_source_uri")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityAppSpecification(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerDataQualityJobDefinitionDataQualityAppSpecificationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityAppSpecificationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9d90765a9c593db1dfb7f7fcc723671a20291368562b507617884775fd0ff6f8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetEnvironment")
    def reset_environment(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnvironment", []))

    @jsii.member(jsii_name="resetPostAnalyticsProcessorSourceUri")
    def reset_post_analytics_processor_source_uri(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPostAnalyticsProcessorSourceUri", []))

    @jsii.member(jsii_name="resetRecordPreprocessorSourceUri")
    def reset_record_preprocessor_source_uri(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRecordPreprocessorSourceUri", []))

    @builtins.property
    @jsii.member(jsii_name="environmentInput")
    def environment_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "environmentInput"))

    @builtins.property
    @jsii.member(jsii_name="imageUriInput")
    def image_uri_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "imageUriInput"))

    @builtins.property
    @jsii.member(jsii_name="postAnalyticsProcessorSourceUriInput")
    def post_analytics_processor_source_uri_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "postAnalyticsProcessorSourceUriInput"))

    @builtins.property
    @jsii.member(jsii_name="recordPreprocessorSourceUriInput")
    def record_preprocessor_source_uri_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "recordPreprocessorSourceUriInput"))

    @builtins.property
    @jsii.member(jsii_name="environment")
    def environment(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "environment"))

    @environment.setter
    def environment(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__904b49e3b0a14cb4f01a91892f79498fb2701efdb3b2bd0e3786671dacdd8611)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "environment", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imageUri")
    def image_uri(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "imageUri"))

    @image_uri.setter
    def image_uri(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7444aed0355ed7280cc1caae388fac6929f38e6ebec5c2fb9ec069db374e4f2a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imageUri", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="postAnalyticsProcessorSourceUri")
    def post_analytics_processor_source_uri(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "postAnalyticsProcessorSourceUri"))

    @post_analytics_processor_source_uri.setter
    def post_analytics_processor_source_uri(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__28a464b843848554a9cb70e14bdc59d665a355147fb9caff38b7c7d0d47ad318)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "postAnalyticsProcessorSourceUri", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="recordPreprocessorSourceUri")
    def record_preprocessor_source_uri(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "recordPreprocessorSourceUri"))

    @record_preprocessor_source_uri.setter
    def record_preprocessor_source_uri(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61e2c99372460f3dee1b41ab7f1fd98e8ac5480da4455deb258f22ca67f339ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "recordPreprocessorSourceUri", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityAppSpecification]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityAppSpecification], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityAppSpecification],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__165715bbe7e98375cd5718346a2b7aca0a145777e03a111c5eeb487ed90e0eb9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfig",
    jsii_struct_bases=[],
    name_mapping={
        "constraints_resource": "constraintsResource",
        "statistics_resource": "statisticsResource",
    },
)
class SagemakerDataQualityJobDefinitionDataQualityBaselineConfig:
    def __init__(
        self,
        *,
        constraints_resource: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource", typing.Dict[builtins.str, typing.Any]]] = None,
        statistics_resource: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param constraints_resource: constraints_resource block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#constraints_resource SagemakerDataQualityJobDefinition#constraints_resource}
        :param statistics_resource: statistics_resource block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#statistics_resource SagemakerDataQualityJobDefinition#statistics_resource}
        '''
        if isinstance(constraints_resource, dict):
            constraints_resource = SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource(**constraints_resource)
        if isinstance(statistics_resource, dict):
            statistics_resource = SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource(**statistics_resource)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42c4550e72d8cba493e2c7ad35a3054de96cb8c12d0f97255376163c238cb900)
            check_type(argname="argument constraints_resource", value=constraints_resource, expected_type=type_hints["constraints_resource"])
            check_type(argname="argument statistics_resource", value=statistics_resource, expected_type=type_hints["statistics_resource"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if constraints_resource is not None:
            self._values["constraints_resource"] = constraints_resource
        if statistics_resource is not None:
            self._values["statistics_resource"] = statistics_resource

    @builtins.property
    def constraints_resource(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource"]:
        '''constraints_resource block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#constraints_resource SagemakerDataQualityJobDefinition#constraints_resource}
        '''
        result = self._values.get("constraints_resource")
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource"], result)

    @builtins.property
    def statistics_resource(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource"]:
        '''statistics_resource block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#statistics_resource SagemakerDataQualityJobDefinition#statistics_resource}
        '''
        result = self._values.get("statistics_resource")
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityBaselineConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource",
    jsii_struct_bases=[],
    name_mapping={"s3_uri": "s3Uri"},
)
class SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource:
    def __init__(self, *, s3_uri: typing.Optional[builtins.str] = None) -> None:
        '''
        :param s3_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_uri SagemakerDataQualityJobDefinition#s3_uri}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__974a81ea06f6df20be0aff0f73375acda4777917d129b5f85c470e4eda9cd831)
            check_type(argname="argument s3_uri", value=s3_uri, expected_type=type_hints["s3_uri"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if s3_uri is not None:
            self._values["s3_uri"] = s3_uri

    @builtins.property
    def s3_uri(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_uri SagemakerDataQualityJobDefinition#s3_uri}.'''
        result = self._values.get("s3_uri")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResourceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResourceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8635164d999713f9150c3a90a48c7a5b6f5b8b168ed399c09a0e4048f98aa597)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetS3Uri")
    def reset_s3_uri(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3Uri", []))

    @builtins.property
    @jsii.member(jsii_name="s3UriInput")
    def s3_uri_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3UriInput"))

    @builtins.property
    @jsii.member(jsii_name="s3Uri")
    def s3_uri(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3Uri"))

    @s3_uri.setter
    def s3_uri(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__80bfe07fe689cdd796f032d2b38b8170978cfd5e9e313e9c0a09b3033a1b50e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3Uri", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba2bff35e361bf44981f0d5d7c0cdd13c09a344d801e7dd450d0f0fc3a65b1be)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerDataQualityJobDefinitionDataQualityBaselineConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__86808d83e4d0381f7c24efb8ce658141a93918e9321a4a5810b9571a84d3ae87)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putConstraintsResource")
    def put_constraints_resource(
        self,
        *,
        s3_uri: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_uri SagemakerDataQualityJobDefinition#s3_uri}.
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource(
            s3_uri=s3_uri
        )

        return typing.cast(None, jsii.invoke(self, "putConstraintsResource", [value]))

    @jsii.member(jsii_name="putStatisticsResource")
    def put_statistics_resource(
        self,
        *,
        s3_uri: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_uri SagemakerDataQualityJobDefinition#s3_uri}.
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource(
            s3_uri=s3_uri
        )

        return typing.cast(None, jsii.invoke(self, "putStatisticsResource", [value]))

    @jsii.member(jsii_name="resetConstraintsResource")
    def reset_constraints_resource(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConstraintsResource", []))

    @jsii.member(jsii_name="resetStatisticsResource")
    def reset_statistics_resource(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatisticsResource", []))

    @builtins.property
    @jsii.member(jsii_name="constraintsResource")
    def constraints_resource(
        self,
    ) -> SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResourceOutputReference:
        return typing.cast(SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResourceOutputReference, jsii.get(self, "constraintsResource"))

    @builtins.property
    @jsii.member(jsii_name="statisticsResource")
    def statistics_resource(
        self,
    ) -> "SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResourceOutputReference":
        return typing.cast("SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResourceOutputReference", jsii.get(self, "statisticsResource"))

    @builtins.property
    @jsii.member(jsii_name="constraintsResourceInput")
    def constraints_resource_input(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource], jsii.get(self, "constraintsResourceInput"))

    @builtins.property
    @jsii.member(jsii_name="statisticsResourceInput")
    def statistics_resource_input(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource"]:
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource"], jsii.get(self, "statisticsResourceInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfig]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__539231efe8addf7cd39712bdcecc218ae9c37199203498a0d56ef28e60c8835c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource",
    jsii_struct_bases=[],
    name_mapping={"s3_uri": "s3Uri"},
)
class SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource:
    def __init__(self, *, s3_uri: typing.Optional[builtins.str] = None) -> None:
        '''
        :param s3_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_uri SagemakerDataQualityJobDefinition#s3_uri}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b891dab9dcd15576549b6a3f56a2c6be5c5fa40b4bf3ec8f59a7b3e5771a2de3)
            check_type(argname="argument s3_uri", value=s3_uri, expected_type=type_hints["s3_uri"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if s3_uri is not None:
            self._values["s3_uri"] = s3_uri

    @builtins.property
    def s3_uri(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_uri SagemakerDataQualityJobDefinition#s3_uri}.'''
        result = self._values.get("s3_uri")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResourceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResourceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2f7050bc37a6c0e25783f847cddf68b6338279c2e6c28efc271787b911e4ea3c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetS3Uri")
    def reset_s3_uri(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3Uri", []))

    @builtins.property
    @jsii.member(jsii_name="s3UriInput")
    def s3_uri_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3UriInput"))

    @builtins.property
    @jsii.member(jsii_name="s3Uri")
    def s3_uri(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3Uri"))

    @s3_uri.setter
    def s3_uri(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb00e6050622930cdb4747a036137f6de1d9e3e4f3e51bcb79ddfb5343327c34)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3Uri", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__593bb113700cdd57184ee6d715d9af24ae72174a4b424340bc4116f57136ac0b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInput",
    jsii_struct_bases=[],
    name_mapping={
        "batch_transform_input": "batchTransformInput",
        "endpoint_input": "endpointInput",
    },
)
class SagemakerDataQualityJobDefinitionDataQualityJobInput:
    def __init__(
        self,
        *,
        batch_transform_input: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput", typing.Dict[builtins.str, typing.Any]]] = None,
        endpoint_input: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param batch_transform_input: batch_transform_input block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#batch_transform_input SagemakerDataQualityJobDefinition#batch_transform_input}
        :param endpoint_input: endpoint_input block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#endpoint_input SagemakerDataQualityJobDefinition#endpoint_input}
        '''
        if isinstance(batch_transform_input, dict):
            batch_transform_input = SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput(**batch_transform_input)
        if isinstance(endpoint_input, dict):
            endpoint_input = SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput(**endpoint_input)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__35e68b9b363a0a7d0e01a3ef90d965809186605017be3b0aa89cf2d59fc3f924)
            check_type(argname="argument batch_transform_input", value=batch_transform_input, expected_type=type_hints["batch_transform_input"])
            check_type(argname="argument endpoint_input", value=endpoint_input, expected_type=type_hints["endpoint_input"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if batch_transform_input is not None:
            self._values["batch_transform_input"] = batch_transform_input
        if endpoint_input is not None:
            self._values["endpoint_input"] = endpoint_input

    @builtins.property
    def batch_transform_input(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput"]:
        '''batch_transform_input block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#batch_transform_input SagemakerDataQualityJobDefinition#batch_transform_input}
        '''
        result = self._values.get("batch_transform_input")
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput"], result)

    @builtins.property
    def endpoint_input(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput"]:
        '''endpoint_input block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#endpoint_input SagemakerDataQualityJobDefinition#endpoint_input}
        '''
        result = self._values.get("endpoint_input")
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityJobInput(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput",
    jsii_struct_bases=[],
    name_mapping={
        "data_captured_destination_s3_uri": "dataCapturedDestinationS3Uri",
        "dataset_format": "datasetFormat",
        "local_path": "localPath",
        "s3_data_distribution_type": "s3DataDistributionType",
        "s3_input_mode": "s3InputMode",
    },
)
class SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput:
    def __init__(
        self,
        *,
        data_captured_destination_s3_uri: builtins.str,
        dataset_format: typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat", typing.Dict[builtins.str, typing.Any]],
        local_path: typing.Optional[builtins.str] = None,
        s3_data_distribution_type: typing.Optional[builtins.str] = None,
        s3_input_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param data_captured_destination_s3_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_captured_destination_s3_uri SagemakerDataQualityJobDefinition#data_captured_destination_s3_uri}.
        :param dataset_format: dataset_format block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#dataset_format SagemakerDataQualityJobDefinition#dataset_format}
        :param local_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.
        :param s3_data_distribution_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_data_distribution_type SagemakerDataQualityJobDefinition#s3_data_distribution_type}.
        :param s3_input_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_input_mode SagemakerDataQualityJobDefinition#s3_input_mode}.
        '''
        if isinstance(dataset_format, dict):
            dataset_format = SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat(**dataset_format)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d57f67ea3d71a569cf9d9798cfef52a541d84b3de39dce6fd0f91e2248f4e18)
            check_type(argname="argument data_captured_destination_s3_uri", value=data_captured_destination_s3_uri, expected_type=type_hints["data_captured_destination_s3_uri"])
            check_type(argname="argument dataset_format", value=dataset_format, expected_type=type_hints["dataset_format"])
            check_type(argname="argument local_path", value=local_path, expected_type=type_hints["local_path"])
            check_type(argname="argument s3_data_distribution_type", value=s3_data_distribution_type, expected_type=type_hints["s3_data_distribution_type"])
            check_type(argname="argument s3_input_mode", value=s3_input_mode, expected_type=type_hints["s3_input_mode"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "data_captured_destination_s3_uri": data_captured_destination_s3_uri,
            "dataset_format": dataset_format,
        }
        if local_path is not None:
            self._values["local_path"] = local_path
        if s3_data_distribution_type is not None:
            self._values["s3_data_distribution_type"] = s3_data_distribution_type
        if s3_input_mode is not None:
            self._values["s3_input_mode"] = s3_input_mode

    @builtins.property
    def data_captured_destination_s3_uri(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_captured_destination_s3_uri SagemakerDataQualityJobDefinition#data_captured_destination_s3_uri}.'''
        result = self._values.get("data_captured_destination_s3_uri")
        assert result is not None, "Required property 'data_captured_destination_s3_uri' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def dataset_format(
        self,
    ) -> "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat":
        '''dataset_format block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#dataset_format SagemakerDataQualityJobDefinition#dataset_format}
        '''
        result = self._values.get("dataset_format")
        assert result is not None, "Required property 'dataset_format' is missing"
        return typing.cast("SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat", result)

    @builtins.property
    def local_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.'''
        result = self._values.get("local_path")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def s3_data_distribution_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_data_distribution_type SagemakerDataQualityJobDefinition#s3_data_distribution_type}.'''
        result = self._values.get("s3_data_distribution_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def s3_input_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_input_mode SagemakerDataQualityJobDefinition#s3_input_mode}.'''
        result = self._values.get("s3_input_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat",
    jsii_struct_bases=[],
    name_mapping={"csv": "csv", "json": "json"},
)
class SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat:
    def __init__(
        self,
        *,
        csv: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv", typing.Dict[builtins.str, typing.Any]]] = None,
        json: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param csv: csv block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#csv SagemakerDataQualityJobDefinition#csv}
        :param json: json block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#json SagemakerDataQualityJobDefinition#json}
        '''
        if isinstance(csv, dict):
            csv = SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv(**csv)
        if isinstance(json, dict):
            json = SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson(**json)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c7addf4713cde2b9a7a18b8c93dae85ed1db6cbbf26201f9c8d84b9474528273)
            check_type(argname="argument csv", value=csv, expected_type=type_hints["csv"])
            check_type(argname="argument json", value=json, expected_type=type_hints["json"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if csv is not None:
            self._values["csv"] = csv
        if json is not None:
            self._values["json"] = json

    @builtins.property
    def csv(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv"]:
        '''csv block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#csv SagemakerDataQualityJobDefinition#csv}
        '''
        result = self._values.get("csv")
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv"], result)

    @builtins.property
    def json(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson"]:
        '''json block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#json SagemakerDataQualityJobDefinition#json}
        '''
        result = self._values.get("json")
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv",
    jsii_struct_bases=[],
    name_mapping={"header": "header"},
)
class SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv:
    def __init__(
        self,
        *,
        header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param header: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#header SagemakerDataQualityJobDefinition#header}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1128d7294e63a2b211b81e6ca057955899bc71051e1f1ce52138c659e4d0f606)
            check_type(argname="argument header", value=header, expected_type=type_hints["header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if header is not None:
            self._values["header"] = header

    @builtins.property
    def header(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#header SagemakerDataQualityJobDefinition#header}.'''
        result = self._values.get("header")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsvOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsvOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6deb4760c884fc8de845342d5166f098ac86c2983d55c9b7aeb9fe7c82baa36a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetHeader")
    def reset_header(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHeader", []))

    @builtins.property
    @jsii.member(jsii_name="headerInput")
    def header_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "headerInput"))

    @builtins.property
    @jsii.member(jsii_name="header")
    def header(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "header"))

    @header.setter
    def header(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f268094667a6c60de839a6623796038bf6af8e3b0b77c4614acfcfc94b2ed2f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "header", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__da277f8cf485192262eed3e660cb30171513a9e774d23f85fcbadddebc97ddf7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson",
    jsii_struct_bases=[],
    name_mapping={"line": "line"},
)
class SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson:
    def __init__(
        self,
        *,
        line: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param line: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#line SagemakerDataQualityJobDefinition#line}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df8c3177b2ac517619f9e8f5c285b095f44e9fff94bf2fddc46091baf176cca3)
            check_type(argname="argument line", value=line, expected_type=type_hints["line"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if line is not None:
            self._values["line"] = line

    @builtins.property
    def line(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#line SagemakerDataQualityJobDefinition#line}.'''
        result = self._values.get("line")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJsonOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJsonOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3621d924e8fa7a556909f5793fb1694f51801a068e74d0ac11bcc421b10559d8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetLine")
    def reset_line(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLine", []))

    @builtins.property
    @jsii.member(jsii_name="lineInput")
    def line_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "lineInput"))

    @builtins.property
    @jsii.member(jsii_name="line")
    def line(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "line"))

    @line.setter
    def line(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ada3ad0b97b32889ca42cded599efc32c4e1a97b738f62d7f87c392391fd16bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "line", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96a42b0839e8274cf3a857c3542526533fc3e9b4f937bbeb76b973963be395a3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f6351b274b6f637905584bd6d0eb13a96d3a4aea687acddb5dd2d3a8a6d545e1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCsv")
    def put_csv(
        self,
        *,
        header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param header: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#header SagemakerDataQualityJobDefinition#header}.
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv(
            header=header
        )

        return typing.cast(None, jsii.invoke(self, "putCsv", [value]))

    @jsii.member(jsii_name="putJson")
    def put_json(
        self,
        *,
        line: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param line: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#line SagemakerDataQualityJobDefinition#line}.
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson(
            line=line
        )

        return typing.cast(None, jsii.invoke(self, "putJson", [value]))

    @jsii.member(jsii_name="resetCsv")
    def reset_csv(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCsv", []))

    @jsii.member(jsii_name="resetJson")
    def reset_json(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetJson", []))

    @builtins.property
    @jsii.member(jsii_name="csv")
    def csv(
        self,
    ) -> SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsvOutputReference:
        return typing.cast(SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsvOutputReference, jsii.get(self, "csv"))

    @builtins.property
    @jsii.member(jsii_name="json")
    def json(
        self,
    ) -> SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJsonOutputReference:
        return typing.cast(SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJsonOutputReference, jsii.get(self, "json"))

    @builtins.property
    @jsii.member(jsii_name="csvInput")
    def csv_input(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv], jsii.get(self, "csvInput"))

    @builtins.property
    @jsii.member(jsii_name="jsonInput")
    def json_input(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson], jsii.get(self, "jsonInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49baae7833f4726293ac302719782a15e03993b12eeaa025318b551e302a4aaf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7e738e87e4f09a1bf32b828212932e35dea03c474a1473ea90fa51d107cb67df)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDatasetFormat")
    def put_dataset_format(
        self,
        *,
        csv: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv, typing.Dict[builtins.str, typing.Any]]] = None,
        json: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param csv: csv block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#csv SagemakerDataQualityJobDefinition#csv}
        :param json: json block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#json SagemakerDataQualityJobDefinition#json}
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat(
            csv=csv, json=json
        )

        return typing.cast(None, jsii.invoke(self, "putDatasetFormat", [value]))

    @jsii.member(jsii_name="resetLocalPath")
    def reset_local_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLocalPath", []))

    @jsii.member(jsii_name="resetS3DataDistributionType")
    def reset_s3_data_distribution_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3DataDistributionType", []))

    @jsii.member(jsii_name="resetS3InputMode")
    def reset_s3_input_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3InputMode", []))

    @builtins.property
    @jsii.member(jsii_name="datasetFormat")
    def dataset_format(
        self,
    ) -> SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatOutputReference:
        return typing.cast(SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatOutputReference, jsii.get(self, "datasetFormat"))

    @builtins.property
    @jsii.member(jsii_name="dataCapturedDestinationS3UriInput")
    def data_captured_destination_s3_uri_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataCapturedDestinationS3UriInput"))

    @builtins.property
    @jsii.member(jsii_name="datasetFormatInput")
    def dataset_format_input(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat], jsii.get(self, "datasetFormatInput"))

    @builtins.property
    @jsii.member(jsii_name="localPathInput")
    def local_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "localPathInput"))

    @builtins.property
    @jsii.member(jsii_name="s3DataDistributionTypeInput")
    def s3_data_distribution_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3DataDistributionTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="s3InputModeInput")
    def s3_input_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3InputModeInput"))

    @builtins.property
    @jsii.member(jsii_name="dataCapturedDestinationS3Uri")
    def data_captured_destination_s3_uri(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataCapturedDestinationS3Uri"))

    @data_captured_destination_s3_uri.setter
    def data_captured_destination_s3_uri(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8423371f9b2874b4a5c042358b50dd363007f4cb6fbb4545b4f2efb3e265d312)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataCapturedDestinationS3Uri", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="localPath")
    def local_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "localPath"))

    @local_path.setter
    def local_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6e6f2d048aaccc390ecb62d9fabaf87d508ee7a223c2ae02384340ed96e94a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "localPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3DataDistributionType")
    def s3_data_distribution_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3DataDistributionType"))

    @s3_data_distribution_type.setter
    def s3_data_distribution_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d936bcf0aac12fbcfefde51c89eac4e5314d02525894649627b623b06bbf8ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3DataDistributionType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3InputMode")
    def s3_input_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3InputMode"))

    @s3_input_mode.setter
    def s3_input_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__640d9fa1b69e931441f7172fc77d89643597012651b7c26031dedcbeb63ae25a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3InputMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ef21cf5f60f5f33878e09f8c62d6814fdef77e0836e6e4c67b2afb8a36d89023)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput",
    jsii_struct_bases=[],
    name_mapping={
        "endpoint_name": "endpointName",
        "local_path": "localPath",
        "s3_data_distribution_type": "s3DataDistributionType",
        "s3_input_mode": "s3InputMode",
    },
)
class SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput:
    def __init__(
        self,
        *,
        endpoint_name: builtins.str,
        local_path: typing.Optional[builtins.str] = None,
        s3_data_distribution_type: typing.Optional[builtins.str] = None,
        s3_input_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param endpoint_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#endpoint_name SagemakerDataQualityJobDefinition#endpoint_name}.
        :param local_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.
        :param s3_data_distribution_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_data_distribution_type SagemakerDataQualityJobDefinition#s3_data_distribution_type}.
        :param s3_input_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_input_mode SagemakerDataQualityJobDefinition#s3_input_mode}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d271df5e4e7d38172a74f8b0b037a5e400acc98661ea7545ab4acaff2e7abeaf)
            check_type(argname="argument endpoint_name", value=endpoint_name, expected_type=type_hints["endpoint_name"])
            check_type(argname="argument local_path", value=local_path, expected_type=type_hints["local_path"])
            check_type(argname="argument s3_data_distribution_type", value=s3_data_distribution_type, expected_type=type_hints["s3_data_distribution_type"])
            check_type(argname="argument s3_input_mode", value=s3_input_mode, expected_type=type_hints["s3_input_mode"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "endpoint_name": endpoint_name,
        }
        if local_path is not None:
            self._values["local_path"] = local_path
        if s3_data_distribution_type is not None:
            self._values["s3_data_distribution_type"] = s3_data_distribution_type
        if s3_input_mode is not None:
            self._values["s3_input_mode"] = s3_input_mode

    @builtins.property
    def endpoint_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#endpoint_name SagemakerDataQualityJobDefinition#endpoint_name}.'''
        result = self._values.get("endpoint_name")
        assert result is not None, "Required property 'endpoint_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def local_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.'''
        result = self._values.get("local_path")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def s3_data_distribution_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_data_distribution_type SagemakerDataQualityJobDefinition#s3_data_distribution_type}.'''
        result = self._values.get("s3_data_distribution_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def s3_input_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_input_mode SagemakerDataQualityJobDefinition#s3_input_mode}.'''
        result = self._values.get("s3_input_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInputOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInputOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0258cb14b63540240b066cfee181954b29d5362c13b277dbb026a194204db079)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetLocalPath")
    def reset_local_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLocalPath", []))

    @jsii.member(jsii_name="resetS3DataDistributionType")
    def reset_s3_data_distribution_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3DataDistributionType", []))

    @jsii.member(jsii_name="resetS3InputMode")
    def reset_s3_input_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3InputMode", []))

    @builtins.property
    @jsii.member(jsii_name="endpointNameInput")
    def endpoint_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endpointNameInput"))

    @builtins.property
    @jsii.member(jsii_name="localPathInput")
    def local_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "localPathInput"))

    @builtins.property
    @jsii.member(jsii_name="s3DataDistributionTypeInput")
    def s3_data_distribution_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3DataDistributionTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="s3InputModeInput")
    def s3_input_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3InputModeInput"))

    @builtins.property
    @jsii.member(jsii_name="endpointName")
    def endpoint_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endpointName"))

    @endpoint_name.setter
    def endpoint_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__076c06c71e6801c12bb1a593287f9e7cc9f8aeef71a503057ec5b34c4c9b8ef6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "endpointName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="localPath")
    def local_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "localPath"))

    @local_path.setter
    def local_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06fd07785988028223ca5402da5658b56d364112ca8db0323c60fe84c5eb0503)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "localPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3DataDistributionType")
    def s3_data_distribution_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3DataDistributionType"))

    @s3_data_distribution_type.setter
    def s3_data_distribution_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__64b9bbd5e72ef23fb5556f64ad7094eda29b70a3c65edcdc551258de46cb2790)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3DataDistributionType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3InputMode")
    def s3_input_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3InputMode"))

    @s3_input_mode.setter
    def s3_input_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__102f556aa2a22163e1df2a6cf411024e5a3bc4a0d0aad8dcc563733b5f751e58)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3InputMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__936658f375c23dd9b57aa07fef39c24b0b9904cb530e96a06fe2989dfbfc138d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerDataQualityJobDefinitionDataQualityJobInputOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ba0b128aed4de2cd35d251148fcb5ed85aec30470b0e7e5a6fa6819b5ce2bbfb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putBatchTransformInput")
    def put_batch_transform_input(
        self,
        *,
        data_captured_destination_s3_uri: builtins.str,
        dataset_format: typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat, typing.Dict[builtins.str, typing.Any]],
        local_path: typing.Optional[builtins.str] = None,
        s3_data_distribution_type: typing.Optional[builtins.str] = None,
        s3_input_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param data_captured_destination_s3_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_captured_destination_s3_uri SagemakerDataQualityJobDefinition#data_captured_destination_s3_uri}.
        :param dataset_format: dataset_format block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#dataset_format SagemakerDataQualityJobDefinition#dataset_format}
        :param local_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.
        :param s3_data_distribution_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_data_distribution_type SagemakerDataQualityJobDefinition#s3_data_distribution_type}.
        :param s3_input_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_input_mode SagemakerDataQualityJobDefinition#s3_input_mode}.
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput(
            data_captured_destination_s3_uri=data_captured_destination_s3_uri,
            dataset_format=dataset_format,
            local_path=local_path,
            s3_data_distribution_type=s3_data_distribution_type,
            s3_input_mode=s3_input_mode,
        )

        return typing.cast(None, jsii.invoke(self, "putBatchTransformInput", [value]))

    @jsii.member(jsii_name="putEndpointInput")
    def put_endpoint_input(
        self,
        *,
        endpoint_name: builtins.str,
        local_path: typing.Optional[builtins.str] = None,
        s3_data_distribution_type: typing.Optional[builtins.str] = None,
        s3_input_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param endpoint_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#endpoint_name SagemakerDataQualityJobDefinition#endpoint_name}.
        :param local_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.
        :param s3_data_distribution_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_data_distribution_type SagemakerDataQualityJobDefinition#s3_data_distribution_type}.
        :param s3_input_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_input_mode SagemakerDataQualityJobDefinition#s3_input_mode}.
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput(
            endpoint_name=endpoint_name,
            local_path=local_path,
            s3_data_distribution_type=s3_data_distribution_type,
            s3_input_mode=s3_input_mode,
        )

        return typing.cast(None, jsii.invoke(self, "putEndpointInput", [value]))

    @jsii.member(jsii_name="resetBatchTransformInput")
    def reset_batch_transform_input(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBatchTransformInput", []))

    @jsii.member(jsii_name="resetEndpointInput")
    def reset_endpoint_input(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEndpointInput", []))

    @builtins.property
    @jsii.member(jsii_name="batchTransformInput")
    def batch_transform_input(
        self,
    ) -> SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputOutputReference:
        return typing.cast(SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputOutputReference, jsii.get(self, "batchTransformInput"))

    @builtins.property
    @jsii.member(jsii_name="endpointInput")
    def endpoint_input(
        self,
    ) -> SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInputOutputReference:
        return typing.cast(SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInputOutputReference, jsii.get(self, "endpointInput"))

    @builtins.property
    @jsii.member(jsii_name="batchTransformInputInput")
    def batch_transform_input_input(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput], jsii.get(self, "batchTransformInputInput"))

    @builtins.property
    @jsii.member(jsii_name="endpointInputInput")
    def endpoint_input_input(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput], jsii.get(self, "endpointInputInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInput]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInput], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInput],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efa567399ed43fa5889bbebed2a73956771704dd4cb9674d386711b81ec835aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig",
    jsii_struct_bases=[],
    name_mapping={"monitoring_outputs": "monitoringOutputs", "kms_key_id": "kmsKeyId"},
)
class SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig:
    def __init__(
        self,
        *,
        monitoring_outputs: typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs", typing.Dict[builtins.str, typing.Any]],
        kms_key_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param monitoring_outputs: monitoring_outputs block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#monitoring_outputs SagemakerDataQualityJobDefinition#monitoring_outputs}
        :param kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#kms_key_id SagemakerDataQualityJobDefinition#kms_key_id}.
        '''
        if isinstance(monitoring_outputs, dict):
            monitoring_outputs = SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs(**monitoring_outputs)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d9fd663b1407ebbc089be747ffd2d2535d6e36dd0bfc94812a4802dd4bd9e69)
            check_type(argname="argument monitoring_outputs", value=monitoring_outputs, expected_type=type_hints["monitoring_outputs"])
            check_type(argname="argument kms_key_id", value=kms_key_id, expected_type=type_hints["kms_key_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "monitoring_outputs": monitoring_outputs,
        }
        if kms_key_id is not None:
            self._values["kms_key_id"] = kms_key_id

    @builtins.property
    def monitoring_outputs(
        self,
    ) -> "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs":
        '''monitoring_outputs block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#monitoring_outputs SagemakerDataQualityJobDefinition#monitoring_outputs}
        '''
        result = self._values.get("monitoring_outputs")
        assert result is not None, "Required property 'monitoring_outputs' is missing"
        return typing.cast("SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs", result)

    @builtins.property
    def kms_key_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#kms_key_id SagemakerDataQualityJobDefinition#kms_key_id}.'''
        result = self._values.get("kms_key_id")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs",
    jsii_struct_bases=[],
    name_mapping={"s3_output": "s3Output"},
)
class SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs:
    def __init__(
        self,
        *,
        s3_output: typing.Union["SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param s3_output: s3_output block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_output SagemakerDataQualityJobDefinition#s3_output}
        '''
        if isinstance(s3_output, dict):
            s3_output = SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output(**s3_output)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32273c5bc54809c66b9ea7ad5564cbf1277c15d595179388c2395b035ad5fa3c)
            check_type(argname="argument s3_output", value=s3_output, expected_type=type_hints["s3_output"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "s3_output": s3_output,
        }

    @builtins.property
    def s3_output(
        self,
    ) -> "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output":
        '''s3_output block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_output SagemakerDataQualityJobDefinition#s3_output}
        '''
        result = self._values.get("s3_output")
        assert result is not None, "Required property 's3_output' is missing"
        return typing.cast("SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9766c0ee4e5705d04c0b47ece8cfee44318272d13464ca80464985d72b9e57f2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putS3Output")
    def put_s3_output(
        self,
        *,
        s3_uri: builtins.str,
        local_path: typing.Optional[builtins.str] = None,
        s3_upload_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_uri SagemakerDataQualityJobDefinition#s3_uri}.
        :param local_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.
        :param s3_upload_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_upload_mode SagemakerDataQualityJobDefinition#s3_upload_mode}.
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output(
            s3_uri=s3_uri, local_path=local_path, s3_upload_mode=s3_upload_mode
        )

        return typing.cast(None, jsii.invoke(self, "putS3Output", [value]))

    @builtins.property
    @jsii.member(jsii_name="s3Output")
    def s3_output(
        self,
    ) -> "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3OutputOutputReference":
        return typing.cast("SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3OutputOutputReference", jsii.get(self, "s3Output"))

    @builtins.property
    @jsii.member(jsii_name="s3OutputInput")
    def s3_output_input(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output"]:
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output"], jsii.get(self, "s3OutputInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2471bfe3c6bd0f60e3aa06a211e6975404348e2bdd569e49ab1b895984555d31)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output",
    jsii_struct_bases=[],
    name_mapping={
        "s3_uri": "s3Uri",
        "local_path": "localPath",
        "s3_upload_mode": "s3UploadMode",
    },
)
class SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output:
    def __init__(
        self,
        *,
        s3_uri: builtins.str,
        local_path: typing.Optional[builtins.str] = None,
        s3_upload_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_uri SagemakerDataQualityJobDefinition#s3_uri}.
        :param local_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.
        :param s3_upload_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_upload_mode SagemakerDataQualityJobDefinition#s3_upload_mode}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__657d9d7ffb04a6ade8dce4fac0c821734d3c9cbfa037bbf83dd07d0eec1117db)
            check_type(argname="argument s3_uri", value=s3_uri, expected_type=type_hints["s3_uri"])
            check_type(argname="argument local_path", value=local_path, expected_type=type_hints["local_path"])
            check_type(argname="argument s3_upload_mode", value=s3_upload_mode, expected_type=type_hints["s3_upload_mode"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "s3_uri": s3_uri,
        }
        if local_path is not None:
            self._values["local_path"] = local_path
        if s3_upload_mode is not None:
            self._values["s3_upload_mode"] = s3_upload_mode

    @builtins.property
    def s3_uri(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_uri SagemakerDataQualityJobDefinition#s3_uri}.'''
        result = self._values.get("s3_uri")
        assert result is not None, "Required property 's3_uri' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def local_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.'''
        result = self._values.get("local_path")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def s3_upload_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_upload_mode SagemakerDataQualityJobDefinition#s3_upload_mode}.'''
        result = self._values.get("s3_upload_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3OutputOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3OutputOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bd6adf55620a8f9375a1722c533b776e11aa91c95ed39475baa9bd30310a6b60)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetLocalPath")
    def reset_local_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLocalPath", []))

    @jsii.member(jsii_name="resetS3UploadMode")
    def reset_s3_upload_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3UploadMode", []))

    @builtins.property
    @jsii.member(jsii_name="localPathInput")
    def local_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "localPathInput"))

    @builtins.property
    @jsii.member(jsii_name="s3UploadModeInput")
    def s3_upload_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3UploadModeInput"))

    @builtins.property
    @jsii.member(jsii_name="s3UriInput")
    def s3_uri_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3UriInput"))

    @builtins.property
    @jsii.member(jsii_name="localPath")
    def local_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "localPath"))

    @local_path.setter
    def local_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__699d8378dd5688746486edfd51d3e57f47029859345c23b671db26431d1e5724)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "localPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3UploadMode")
    def s3_upload_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3UploadMode"))

    @s3_upload_mode.setter
    def s3_upload_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2fce1450397d03ed7d4bd053988a6693a85880dfcac3a574d5087528bb9de0c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3UploadMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3Uri")
    def s3_uri(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3Uri"))

    @s3_uri.setter
    def s3_uri(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d7972a6ff445959caff91217582e7e0b2f83a09de87f998c9acc0b35eb1121e0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3Uri", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__347458fda23aced805672e2220068a3df008791b9b3a24acedaf8a4b12b2b07e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__02e398b9b098965647f97ecfb5fe9467a65244a55360652d5a449eeb1d841bc9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putMonitoringOutputs")
    def put_monitoring_outputs(
        self,
        *,
        s3_output: typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output, typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param s3_output: s3_output block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_output SagemakerDataQualityJobDefinition#s3_output}
        '''
        value = SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs(
            s3_output=s3_output
        )

        return typing.cast(None, jsii.invoke(self, "putMonitoringOutputs", [value]))

    @jsii.member(jsii_name="resetKmsKeyId")
    def reset_kms_key_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKmsKeyId", []))

    @builtins.property
    @jsii.member(jsii_name="monitoringOutputs")
    def monitoring_outputs(
        self,
    ) -> SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsOutputReference:
        return typing.cast(SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsOutputReference, jsii.get(self, "monitoringOutputs"))

    @builtins.property
    @jsii.member(jsii_name="kmsKeyIdInput")
    def kms_key_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "kmsKeyIdInput"))

    @builtins.property
    @jsii.member(jsii_name="monitoringOutputsInput")
    def monitoring_outputs_input(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs], jsii.get(self, "monitoringOutputsInput"))

    @builtins.property
    @jsii.member(jsii_name="kmsKeyId")
    def kms_key_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "kmsKeyId"))

    @kms_key_id.setter
    def kms_key_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__291cf7f2b8b11fd37fedc48d5ec9397f4cf342eb0c283a0d31676a23214bc1d3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "kmsKeyId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd143e3fc3701eabd25b3e3aa3091ab69ba67df4bb3d19b38868381c94c0135e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionJobResources",
    jsii_struct_bases=[],
    name_mapping={"cluster_config": "clusterConfig"},
)
class SagemakerDataQualityJobDefinitionJobResources:
    def __init__(
        self,
        *,
        cluster_config: typing.Union["SagemakerDataQualityJobDefinitionJobResourcesClusterConfig", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param cluster_config: cluster_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#cluster_config SagemakerDataQualityJobDefinition#cluster_config}
        '''
        if isinstance(cluster_config, dict):
            cluster_config = SagemakerDataQualityJobDefinitionJobResourcesClusterConfig(**cluster_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e1f4194d9b55292df3716d53a0c5e55771fa19ad99d2b1d330dde6edbb9bc650)
            check_type(argname="argument cluster_config", value=cluster_config, expected_type=type_hints["cluster_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "cluster_config": cluster_config,
        }

    @builtins.property
    def cluster_config(
        self,
    ) -> "SagemakerDataQualityJobDefinitionJobResourcesClusterConfig":
        '''cluster_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#cluster_config SagemakerDataQualityJobDefinition#cluster_config}
        '''
        result = self._values.get("cluster_config")
        assert result is not None, "Required property 'cluster_config' is missing"
        return typing.cast("SagemakerDataQualityJobDefinitionJobResourcesClusterConfig", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionJobResources(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfig",
    jsii_struct_bases=[],
    name_mapping={
        "instance_count": "instanceCount",
        "instance_type": "instanceType",
        "volume_size_in_gb": "volumeSizeInGb",
        "volume_kms_key_id": "volumeKmsKeyId",
    },
)
class SagemakerDataQualityJobDefinitionJobResourcesClusterConfig:
    def __init__(
        self,
        *,
        instance_count: jsii.Number,
        instance_type: builtins.str,
        volume_size_in_gb: jsii.Number,
        volume_kms_key_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#instance_count SagemakerDataQualityJobDefinition#instance_count}.
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#instance_type SagemakerDataQualityJobDefinition#instance_type}.
        :param volume_size_in_gb: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#volume_size_in_gb SagemakerDataQualityJobDefinition#volume_size_in_gb}.
        :param volume_kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#volume_kms_key_id SagemakerDataQualityJobDefinition#volume_kms_key_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ede5fbefba5497158ddc8a701fb3ec411c8832ecaf296f472adac63811aa6450)
            check_type(argname="argument instance_count", value=instance_count, expected_type=type_hints["instance_count"])
            check_type(argname="argument instance_type", value=instance_type, expected_type=type_hints["instance_type"])
            check_type(argname="argument volume_size_in_gb", value=volume_size_in_gb, expected_type=type_hints["volume_size_in_gb"])
            check_type(argname="argument volume_kms_key_id", value=volume_kms_key_id, expected_type=type_hints["volume_kms_key_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "instance_count": instance_count,
            "instance_type": instance_type,
            "volume_size_in_gb": volume_size_in_gb,
        }
        if volume_kms_key_id is not None:
            self._values["volume_kms_key_id"] = volume_kms_key_id

    @builtins.property
    def instance_count(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#instance_count SagemakerDataQualityJobDefinition#instance_count}.'''
        result = self._values.get("instance_count")
        assert result is not None, "Required property 'instance_count' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def instance_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#instance_type SagemakerDataQualityJobDefinition#instance_type}.'''
        result = self._values.get("instance_type")
        assert result is not None, "Required property 'instance_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def volume_size_in_gb(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#volume_size_in_gb SagemakerDataQualityJobDefinition#volume_size_in_gb}.'''
        result = self._values.get("volume_size_in_gb")
        assert result is not None, "Required property 'volume_size_in_gb' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def volume_kms_key_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#volume_kms_key_id SagemakerDataQualityJobDefinition#volume_kms_key_id}.'''
        result = self._values.get("volume_kms_key_id")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionJobResourcesClusterConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerDataQualityJobDefinitionJobResourcesClusterConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ca4edb50ad6be86e0358fa5912c0ee4234d162d701ba6d97ddabe34d3da6a3f0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetVolumeKmsKeyId")
    def reset_volume_kms_key_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVolumeKmsKeyId", []))

    @builtins.property
    @jsii.member(jsii_name="instanceCountInput")
    def instance_count_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "instanceCountInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceTypeInput")
    def instance_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "instanceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="volumeKmsKeyIdInput")
    def volume_kms_key_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "volumeKmsKeyIdInput"))

    @builtins.property
    @jsii.member(jsii_name="volumeSizeInGbInput")
    def volume_size_in_gb_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "volumeSizeInGbInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceCount")
    def instance_count(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "instanceCount"))

    @instance_count.setter
    def instance_count(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb469cd8e5ab2b4e8c6d5ffe265c187c090185123c106f83b08a95fedfce7412)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceCount", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="instanceType")
    def instance_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "instanceType"))

    @instance_type.setter
    def instance_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8cfaccca90631d803b6513211294811431d80519bfbe077e4f3cb577fa1558c6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="volumeKmsKeyId")
    def volume_kms_key_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "volumeKmsKeyId"))

    @volume_kms_key_id.setter
    def volume_kms_key_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0981910ec110b49aa449ea322e5946914859d9100659851859049ba38ce8b623)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "volumeKmsKeyId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="volumeSizeInGb")
    def volume_size_in_gb(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "volumeSizeInGb"))

    @volume_size_in_gb.setter
    def volume_size_in_gb(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bdaa22fb0a434f01cd8d7f6d0c610b07fb10386741a555fb36b28e713b02edc9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "volumeSizeInGb", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionJobResourcesClusterConfig]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionJobResourcesClusterConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionJobResourcesClusterConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49e4af2a65358fbb22893e20a237e0964ae5a467b8a6d7fc22fd6ea2afa9031a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerDataQualityJobDefinitionJobResourcesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionJobResourcesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__491c3cd955eb0b415c6da630e63736477dade53a3c1a7b25d2ef17bb0cad4b44)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putClusterConfig")
    def put_cluster_config(
        self,
        *,
        instance_count: jsii.Number,
        instance_type: builtins.str,
        volume_size_in_gb: jsii.Number,
        volume_kms_key_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#instance_count SagemakerDataQualityJobDefinition#instance_count}.
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#instance_type SagemakerDataQualityJobDefinition#instance_type}.
        :param volume_size_in_gb: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#volume_size_in_gb SagemakerDataQualityJobDefinition#volume_size_in_gb}.
        :param volume_kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#volume_kms_key_id SagemakerDataQualityJobDefinition#volume_kms_key_id}.
        '''
        value = SagemakerDataQualityJobDefinitionJobResourcesClusterConfig(
            instance_count=instance_count,
            instance_type=instance_type,
            volume_size_in_gb=volume_size_in_gb,
            volume_kms_key_id=volume_kms_key_id,
        )

        return typing.cast(None, jsii.invoke(self, "putClusterConfig", [value]))

    @builtins.property
    @jsii.member(jsii_name="clusterConfig")
    def cluster_config(
        self,
    ) -> SagemakerDataQualityJobDefinitionJobResourcesClusterConfigOutputReference:
        return typing.cast(SagemakerDataQualityJobDefinitionJobResourcesClusterConfigOutputReference, jsii.get(self, "clusterConfig"))

    @builtins.property
    @jsii.member(jsii_name="clusterConfigInput")
    def cluster_config_input(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionJobResourcesClusterConfig]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionJobResourcesClusterConfig], jsii.get(self, "clusterConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionJobResources]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionJobResources], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionJobResources],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5b60516051ec363043d7bfeca675c86dab9b0ee0e322398336b0278873a066a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionNetworkConfig",
    jsii_struct_bases=[],
    name_mapping={
        "enable_inter_container_traffic_encryption": "enableInterContainerTrafficEncryption",
        "enable_network_isolation": "enableNetworkIsolation",
        "vpc_config": "vpcConfig",
    },
)
class SagemakerDataQualityJobDefinitionNetworkConfig:
    def __init__(
        self,
        *,
        enable_inter_container_traffic_encryption: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_network_isolation: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        vpc_config: typing.Optional[typing.Union["SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param enable_inter_container_traffic_encryption: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#enable_inter_container_traffic_encryption SagemakerDataQualityJobDefinition#enable_inter_container_traffic_encryption}.
        :param enable_network_isolation: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#enable_network_isolation SagemakerDataQualityJobDefinition#enable_network_isolation}.
        :param vpc_config: vpc_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#vpc_config SagemakerDataQualityJobDefinition#vpc_config}
        '''
        if isinstance(vpc_config, dict):
            vpc_config = SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig(**vpc_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7679f53ca26fa5247b698e5680ab94f3faa4c6c8149280c862723b2d2d76e8db)
            check_type(argname="argument enable_inter_container_traffic_encryption", value=enable_inter_container_traffic_encryption, expected_type=type_hints["enable_inter_container_traffic_encryption"])
            check_type(argname="argument enable_network_isolation", value=enable_network_isolation, expected_type=type_hints["enable_network_isolation"])
            check_type(argname="argument vpc_config", value=vpc_config, expected_type=type_hints["vpc_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if enable_inter_container_traffic_encryption is not None:
            self._values["enable_inter_container_traffic_encryption"] = enable_inter_container_traffic_encryption
        if enable_network_isolation is not None:
            self._values["enable_network_isolation"] = enable_network_isolation
        if vpc_config is not None:
            self._values["vpc_config"] = vpc_config

    @builtins.property
    def enable_inter_container_traffic_encryption(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#enable_inter_container_traffic_encryption SagemakerDataQualityJobDefinition#enable_inter_container_traffic_encryption}.'''
        result = self._values.get("enable_inter_container_traffic_encryption")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_network_isolation(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#enable_network_isolation SagemakerDataQualityJobDefinition#enable_network_isolation}.'''
        result = self._values.get("enable_network_isolation")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def vpc_config(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig"]:
        '''vpc_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#vpc_config SagemakerDataQualityJobDefinition#vpc_config}
        '''
        result = self._values.get("vpc_config")
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionNetworkConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerDataQualityJobDefinitionNetworkConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionNetworkConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__22fe4806a8304893bea4a5dcb62f1192856ad1f19cf30f3abb8faef9aef2bb8e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putVpcConfig")
    def put_vpc_config(
        self,
        *,
        security_group_ids: typing.Sequence[builtins.str],
        subnets: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param security_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#security_group_ids SagemakerDataQualityJobDefinition#security_group_ids}.
        :param subnets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#subnets SagemakerDataQualityJobDefinition#subnets}.
        '''
        value = SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig(
            security_group_ids=security_group_ids, subnets=subnets
        )

        return typing.cast(None, jsii.invoke(self, "putVpcConfig", [value]))

    @jsii.member(jsii_name="resetEnableInterContainerTrafficEncryption")
    def reset_enable_inter_container_traffic_encryption(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableInterContainerTrafficEncryption", []))

    @jsii.member(jsii_name="resetEnableNetworkIsolation")
    def reset_enable_network_isolation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableNetworkIsolation", []))

    @jsii.member(jsii_name="resetVpcConfig")
    def reset_vpc_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVpcConfig", []))

    @builtins.property
    @jsii.member(jsii_name="vpcConfig")
    def vpc_config(
        self,
    ) -> "SagemakerDataQualityJobDefinitionNetworkConfigVpcConfigOutputReference":
        return typing.cast("SagemakerDataQualityJobDefinitionNetworkConfigVpcConfigOutputReference", jsii.get(self, "vpcConfig"))

    @builtins.property
    @jsii.member(jsii_name="enableInterContainerTrafficEncryptionInput")
    def enable_inter_container_traffic_encryption_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableInterContainerTrafficEncryptionInput"))

    @builtins.property
    @jsii.member(jsii_name="enableNetworkIsolationInput")
    def enable_network_isolation_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableNetworkIsolationInput"))

    @builtins.property
    @jsii.member(jsii_name="vpcConfigInput")
    def vpc_config_input(
        self,
    ) -> typing.Optional["SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig"]:
        return typing.cast(typing.Optional["SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig"], jsii.get(self, "vpcConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="enableInterContainerTrafficEncryption")
    def enable_inter_container_traffic_encryption(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableInterContainerTrafficEncryption"))

    @enable_inter_container_traffic_encryption.setter
    def enable_inter_container_traffic_encryption(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d6d880bdc98501eacc5dbceb3b553b43dfe7d356d325e9c22408ba9213aa9d2b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableInterContainerTrafficEncryption", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enableNetworkIsolation")
    def enable_network_isolation(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableNetworkIsolation"))

    @enable_network_isolation.setter
    def enable_network_isolation(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__70b0c546204ba3d3c76df2d370b45b11c9b7f909120d5d1863ae5d03a5d87099)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableNetworkIsolation", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionNetworkConfig]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionNetworkConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionNetworkConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a60496505a45d6c449dab1a994a7980b5a398e1a0a9a89a078569072cb1dacc9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig",
    jsii_struct_bases=[],
    name_mapping={"security_group_ids": "securityGroupIds", "subnets": "subnets"},
)
class SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig:
    def __init__(
        self,
        *,
        security_group_ids: typing.Sequence[builtins.str],
        subnets: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param security_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#security_group_ids SagemakerDataQualityJobDefinition#security_group_ids}.
        :param subnets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#subnets SagemakerDataQualityJobDefinition#subnets}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ec3aa05548d50cec590d5a83c08360ef4b6917885ca887f58c92a529a0013fe)
            check_type(argname="argument security_group_ids", value=security_group_ids, expected_type=type_hints["security_group_ids"])
            check_type(argname="argument subnets", value=subnets, expected_type=type_hints["subnets"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "security_group_ids": security_group_ids,
            "subnets": subnets,
        }

    @builtins.property
    def security_group_ids(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#security_group_ids SagemakerDataQualityJobDefinition#security_group_ids}.'''
        result = self._values.get("security_group_ids")
        assert result is not None, "Required property 'security_group_ids' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def subnets(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#subnets SagemakerDataQualityJobDefinition#subnets}.'''
        result = self._values.get("subnets")
        assert result is not None, "Required property 'subnets' is missing"
        return typing.cast(typing.List[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerDataQualityJobDefinitionNetworkConfigVpcConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__449b984491ddd1b5171b61b8eae88ca9816bc23ceca655d3a7b43473de6bf63f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="securityGroupIdsInput")
    def security_group_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "securityGroupIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetsInput")
    def subnets_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "subnetsInput"))

    @builtins.property
    @jsii.member(jsii_name="securityGroupIds")
    def security_group_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "securityGroupIds"))

    @security_group_ids.setter
    def security_group_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__299f71dd5840862e1406b3c0b833c15195e889ea9fc76fbab1455610b981e15e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityGroupIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnets")
    def subnets(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "subnets"))

    @subnets.setter
    def subnets(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2d7175b3cedcd346b8cc3f8f8fccc0c95855655005fe4727fde7c22490692f01)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnets", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c050f75caaec47e10918f25d81f257ea52e2f2333528bcfb47a83a96f508b644)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionStoppingCondition",
    jsii_struct_bases=[],
    name_mapping={"max_runtime_in_seconds": "maxRuntimeInSeconds"},
)
class SagemakerDataQualityJobDefinitionStoppingCondition:
    def __init__(
        self,
        *,
        max_runtime_in_seconds: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max_runtime_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#max_runtime_in_seconds SagemakerDataQualityJobDefinition#max_runtime_in_seconds}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d2a25351a3f9ac75b795815b32d51a048d77ff886750f3ccf166a95c8c170f49)
            check_type(argname="argument max_runtime_in_seconds", value=max_runtime_in_seconds, expected_type=type_hints["max_runtime_in_seconds"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max_runtime_in_seconds is not None:
            self._values["max_runtime_in_seconds"] = max_runtime_in_seconds

    @builtins.property
    def max_runtime_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#max_runtime_in_seconds SagemakerDataQualityJobDefinition#max_runtime_in_seconds}.'''
        result = self._values.get("max_runtime_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerDataQualityJobDefinitionStoppingCondition(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerDataQualityJobDefinitionStoppingConditionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionStoppingConditionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4775ba63db0002673965dc1c21efa83629ad4fce937922e3d5c140faf497985e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMaxRuntimeInSeconds")
    def reset_max_runtime_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxRuntimeInSeconds", []))

    @builtins.property
    @jsii.member(jsii_name="maxRuntimeInSecondsInput")
    def max_runtime_in_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxRuntimeInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="maxRuntimeInSeconds")
    def max_runtime_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxRuntimeInSeconds"))

    @max_runtime_in_seconds.setter
    def max_runtime_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__23ac004432dbe2d01a3048f2bce15a3352fe6660749d6a9c6717aba79db65180)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxRuntimeInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerDataQualityJobDefinitionStoppingCondition]:
        return typing.cast(typing.Optional[SagemakerDataQualityJobDefinitionStoppingCondition], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerDataQualityJobDefinitionStoppingCondition],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24981d485b0094d36b5bb586bef7535f8907e3ef5b4811beed079705cca9b254)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "SagemakerDataQualityJobDefinition",
    "SagemakerDataQualityJobDefinitionConfig",
    "SagemakerDataQualityJobDefinitionDataQualityAppSpecification",
    "SagemakerDataQualityJobDefinitionDataQualityAppSpecificationOutputReference",
    "SagemakerDataQualityJobDefinitionDataQualityBaselineConfig",
    "SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource",
    "SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResourceOutputReference",
    "SagemakerDataQualityJobDefinitionDataQualityBaselineConfigOutputReference",
    "SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource",
    "SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResourceOutputReference",
    "SagemakerDataQualityJobDefinitionDataQualityJobInput",
    "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput",
    "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat",
    "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv",
    "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsvOutputReference",
    "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson",
    "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJsonOutputReference",
    "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatOutputReference",
    "SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputOutputReference",
    "SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput",
    "SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInputOutputReference",
    "SagemakerDataQualityJobDefinitionDataQualityJobInputOutputReference",
    "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig",
    "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs",
    "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsOutputReference",
    "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output",
    "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3OutputOutputReference",
    "SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigOutputReference",
    "SagemakerDataQualityJobDefinitionJobResources",
    "SagemakerDataQualityJobDefinitionJobResourcesClusterConfig",
    "SagemakerDataQualityJobDefinitionJobResourcesClusterConfigOutputReference",
    "SagemakerDataQualityJobDefinitionJobResourcesOutputReference",
    "SagemakerDataQualityJobDefinitionNetworkConfig",
    "SagemakerDataQualityJobDefinitionNetworkConfigOutputReference",
    "SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig",
    "SagemakerDataQualityJobDefinitionNetworkConfigVpcConfigOutputReference",
    "SagemakerDataQualityJobDefinitionStoppingCondition",
    "SagemakerDataQualityJobDefinitionStoppingConditionOutputReference",
]

publication.publish()

def _typecheckingstub__df91bbd4b7260748df3f8efed50d4a84a012df1ce9b62c9cdb2bf27585f6c5f5(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    data_quality_app_specification: typing.Union[SagemakerDataQualityJobDefinitionDataQualityAppSpecification, typing.Dict[builtins.str, typing.Any]],
    data_quality_job_input: typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobInput, typing.Dict[builtins.str, typing.Any]],
    data_quality_job_output_config: typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig, typing.Dict[builtins.str, typing.Any]],
    job_resources: typing.Union[SagemakerDataQualityJobDefinitionJobResources, typing.Dict[builtins.str, typing.Any]],
    role_arn: builtins.str,
    data_quality_baseline_config: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionDataQualityBaselineConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    network_config: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionNetworkConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    stopping_condition: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionStoppingCondition, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
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

def _typecheckingstub__e3250f7aa48a6ea010e4556b63f1bdeb6fb4c5b689a4638a5425582077cde4ae(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2606015202807d80a6d893c1df768b9ad140dabdc435326a360f5b3bfd376795(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37197cbcee5c4df39264020f695b85783617d91fd6282a180673e7e6ab3a147c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53691516e0a17200e7d1e07095d49197405d59789aa8078e7da6aced2c622585(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1721ee951c7df864d69f6456d6b82bcad5d62aca6a2bc7c5f211547f609cfff(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30b1d9fa2a4a8b199a935a8ed524cfeb75d24ed9961f3594a823f20c944d153f(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04781b5757522a636cc3a75de336ccdca1241b9fac7fa8ec4474bb5b5d15cae4(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    data_quality_app_specification: typing.Union[SagemakerDataQualityJobDefinitionDataQualityAppSpecification, typing.Dict[builtins.str, typing.Any]],
    data_quality_job_input: typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobInput, typing.Dict[builtins.str, typing.Any]],
    data_quality_job_output_config: typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig, typing.Dict[builtins.str, typing.Any]],
    job_resources: typing.Union[SagemakerDataQualityJobDefinitionJobResources, typing.Dict[builtins.str, typing.Any]],
    role_arn: builtins.str,
    data_quality_baseline_config: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionDataQualityBaselineConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    network_config: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionNetworkConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    stopping_condition: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionStoppingCondition, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85166a3bd8f40b9a1e62d2fef44e759d839229d55d46e6f1c61aeb0f8a0a5977(
    *,
    image_uri: builtins.str,
    environment: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    post_analytics_processor_source_uri: typing.Optional[builtins.str] = None,
    record_preprocessor_source_uri: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d90765a9c593db1dfb7f7fcc723671a20291368562b507617884775fd0ff6f8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__904b49e3b0a14cb4f01a91892f79498fb2701efdb3b2bd0e3786671dacdd8611(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7444aed0355ed7280cc1caae388fac6929f38e6ebec5c2fb9ec069db374e4f2a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28a464b843848554a9cb70e14bdc59d665a355147fb9caff38b7c7d0d47ad318(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61e2c99372460f3dee1b41ab7f1fd98e8ac5480da4455deb258f22ca67f339ec(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__165715bbe7e98375cd5718346a2b7aca0a145777e03a111c5eeb487ed90e0eb9(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityAppSpecification],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42c4550e72d8cba493e2c7ad35a3054de96cb8c12d0f97255376163c238cb900(
    *,
    constraints_resource: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource, typing.Dict[builtins.str, typing.Any]]] = None,
    statistics_resource: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__974a81ea06f6df20be0aff0f73375acda4777917d129b5f85c470e4eda9cd831(
    *,
    s3_uri: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8635164d999713f9150c3a90a48c7a5b6f5b8b168ed399c09a0e4048f98aa597(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__80bfe07fe689cdd796f032d2b38b8170978cfd5e9e313e9c0a09b3033a1b50e6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba2bff35e361bf44981f0d5d7c0cdd13c09a344d801e7dd450d0f0fc3a65b1be(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86808d83e4d0381f7c24efb8ce658141a93918e9321a4a5810b9571a84d3ae87(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__539231efe8addf7cd39712bdcecc218ae9c37199203498a0d56ef28e60c8835c(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b891dab9dcd15576549b6a3f56a2c6be5c5fa40b4bf3ec8f59a7b3e5771a2de3(
    *,
    s3_uri: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f7050bc37a6c0e25783f847cddf68b6338279c2e6c28efc271787b911e4ea3c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb00e6050622930cdb4747a036137f6de1d9e3e4f3e51bcb79ddfb5343327c34(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__593bb113700cdd57184ee6d715d9af24ae72174a4b424340bc4116f57136ac0b(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35e68b9b363a0a7d0e01a3ef90d965809186605017be3b0aa89cf2d59fc3f924(
    *,
    batch_transform_input: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput, typing.Dict[builtins.str, typing.Any]]] = None,
    endpoint_input: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d57f67ea3d71a569cf9d9798cfef52a541d84b3de39dce6fd0f91e2248f4e18(
    *,
    data_captured_destination_s3_uri: builtins.str,
    dataset_format: typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat, typing.Dict[builtins.str, typing.Any]],
    local_path: typing.Optional[builtins.str] = None,
    s3_data_distribution_type: typing.Optional[builtins.str] = None,
    s3_input_mode: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7addf4713cde2b9a7a18b8c93dae85ed1db6cbbf26201f9c8d84b9474528273(
    *,
    csv: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv, typing.Dict[builtins.str, typing.Any]]] = None,
    json: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1128d7294e63a2b211b81e6ca057955899bc71051e1f1ce52138c659e4d0f606(
    *,
    header: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6deb4760c884fc8de845342d5166f098ac86c2983d55c9b7aeb9fe7c82baa36a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f268094667a6c60de839a6623796038bf6af8e3b0b77c4614acfcfc94b2ed2f5(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da277f8cf485192262eed3e660cb30171513a9e774d23f85fcbadddebc97ddf7(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df8c3177b2ac517619f9e8f5c285b095f44e9fff94bf2fddc46091baf176cca3(
    *,
    line: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3621d924e8fa7a556909f5793fb1694f51801a068e74d0ac11bcc421b10559d8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ada3ad0b97b32889ca42cded599efc32c4e1a97b738f62d7f87c392391fd16bd(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96a42b0839e8274cf3a857c3542526533fc3e9b4f937bbeb76b973963be395a3(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatJson],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6351b274b6f637905584bd6d0eb13a96d3a4aea687acddb5dd2d3a8a6d545e1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49baae7833f4726293ac302719782a15e03993b12eeaa025318b551e302a4aaf(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e738e87e4f09a1bf32b828212932e35dea03c474a1473ea90fa51d107cb67df(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8423371f9b2874b4a5c042358b50dd363007f4cb6fbb4545b4f2efb3e265d312(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6e6f2d048aaccc390ecb62d9fabaf87d508ee7a223c2ae02384340ed96e94a6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d936bcf0aac12fbcfefde51c89eac4e5314d02525894649627b623b06bbf8ed(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__640d9fa1b69e931441f7172fc77d89643597012651b7c26031dedcbeb63ae25a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef21cf5f60f5f33878e09f8c62d6814fdef77e0836e6e4c67b2afb8a36d89023(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d271df5e4e7d38172a74f8b0b037a5e400acc98661ea7545ab4acaff2e7abeaf(
    *,
    endpoint_name: builtins.str,
    local_path: typing.Optional[builtins.str] = None,
    s3_data_distribution_type: typing.Optional[builtins.str] = None,
    s3_input_mode: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0258cb14b63540240b066cfee181954b29d5362c13b277dbb026a194204db079(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__076c06c71e6801c12bb1a593287f9e7cc9f8aeef71a503057ec5b34c4c9b8ef6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06fd07785988028223ca5402da5658b56d364112ca8db0323c60fe84c5eb0503(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64b9bbd5e72ef23fb5556f64ad7094eda29b70a3c65edcdc551258de46cb2790(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__102f556aa2a22163e1df2a6cf411024e5a3bc4a0d0aad8dcc563733b5f751e58(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__936658f375c23dd9b57aa07fef39c24b0b9904cb530e96a06fe2989dfbfc138d(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba0b128aed4de2cd35d251148fcb5ed85aec30470b0e7e5a6fa6819b5ce2bbfb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efa567399ed43fa5889bbebed2a73956771704dd4cb9674d386711b81ec835aa(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobInput],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d9fd663b1407ebbc089be747ffd2d2535d6e36dd0bfc94812a4802dd4bd9e69(
    *,
    monitoring_outputs: typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs, typing.Dict[builtins.str, typing.Any]],
    kms_key_id: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32273c5bc54809c66b9ea7ad5564cbf1277c15d595179388c2395b035ad5fa3c(
    *,
    s3_output: typing.Union[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9766c0ee4e5705d04c0b47ece8cfee44318272d13464ca80464985d72b9e57f2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2471bfe3c6bd0f60e3aa06a211e6975404348e2bdd569e49ab1b895984555d31(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__657d9d7ffb04a6ade8dce4fac0c821734d3c9cbfa037bbf83dd07d0eec1117db(
    *,
    s3_uri: builtins.str,
    local_path: typing.Optional[builtins.str] = None,
    s3_upload_mode: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd6adf55620a8f9375a1722c533b776e11aa91c95ed39475baa9bd30310a6b60(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__699d8378dd5688746486edfd51d3e57f47029859345c23b671db26431d1e5724(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2fce1450397d03ed7d4bd053988a6693a85880dfcac3a574d5087528bb9de0c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7972a6ff445959caff91217582e7e0b2f83a09de87f998c9acc0b35eb1121e0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__347458fda23aced805672e2220068a3df008791b9b3a24acedaf8a4b12b2b07e(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02e398b9b098965647f97ecfb5fe9467a65244a55360652d5a449eeb1d841bc9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__291cf7f2b8b11fd37fedc48d5ec9397f4cf342eb0c283a0d31676a23214bc1d3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd143e3fc3701eabd25b3e3aa3091ab69ba67df4bb3d19b38868381c94c0135e(
    value: typing.Optional[SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1f4194d9b55292df3716d53a0c5e55771fa19ad99d2b1d330dde6edbb9bc650(
    *,
    cluster_config: typing.Union[SagemakerDataQualityJobDefinitionJobResourcesClusterConfig, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ede5fbefba5497158ddc8a701fb3ec411c8832ecaf296f472adac63811aa6450(
    *,
    instance_count: jsii.Number,
    instance_type: builtins.str,
    volume_size_in_gb: jsii.Number,
    volume_kms_key_id: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca4edb50ad6be86e0358fa5912c0ee4234d162d701ba6d97ddabe34d3da6a3f0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb469cd8e5ab2b4e8c6d5ffe265c187c090185123c106f83b08a95fedfce7412(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8cfaccca90631d803b6513211294811431d80519bfbe077e4f3cb577fa1558c6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0981910ec110b49aa449ea322e5946914859d9100659851859049ba38ce8b623(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdaa22fb0a434f01cd8d7f6d0c610b07fb10386741a555fb36b28e713b02edc9(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49e4af2a65358fbb22893e20a237e0964ae5a467b8a6d7fc22fd6ea2afa9031a(
    value: typing.Optional[SagemakerDataQualityJobDefinitionJobResourcesClusterConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__491c3cd955eb0b415c6da630e63736477dade53a3c1a7b25d2ef17bb0cad4b44(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b60516051ec363043d7bfeca675c86dab9b0ee0e322398336b0278873a066a6(
    value: typing.Optional[SagemakerDataQualityJobDefinitionJobResources],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7679f53ca26fa5247b698e5680ab94f3faa4c6c8149280c862723b2d2d76e8db(
    *,
    enable_inter_container_traffic_encryption: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_network_isolation: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    vpc_config: typing.Optional[typing.Union[SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22fe4806a8304893bea4a5dcb62f1192856ad1f19cf30f3abb8faef9aef2bb8e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d6d880bdc98501eacc5dbceb3b553b43dfe7d356d325e9c22408ba9213aa9d2b(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__70b0c546204ba3d3c76df2d370b45b11c9b7f909120d5d1863ae5d03a5d87099(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a60496505a45d6c449dab1a994a7980b5a398e1a0a9a89a078569072cb1dacc9(
    value: typing.Optional[SagemakerDataQualityJobDefinitionNetworkConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ec3aa05548d50cec590d5a83c08360ef4b6917885ca887f58c92a529a0013fe(
    *,
    security_group_ids: typing.Sequence[builtins.str],
    subnets: typing.Sequence[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__449b984491ddd1b5171b61b8eae88ca9816bc23ceca655d3a7b43473de6bf63f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__299f71dd5840862e1406b3c0b833c15195e889ea9fc76fbab1455610b981e15e(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d7175b3cedcd346b8cc3f8f8fccc0c95855655005fe4727fde7c22490692f01(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c050f75caaec47e10918f25d81f257ea52e2f2333528bcfb47a83a96f508b644(
    value: typing.Optional[SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2a25351a3f9ac75b795815b32d51a048d77ff886750f3ccf166a95c8c170f49(
    *,
    max_runtime_in_seconds: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4775ba63db0002673965dc1c21efa83629ad4fce937922e3d5c140faf497985e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23ac004432dbe2d01a3048f2bce15a3352fe6660749d6a9c6717aba79db65180(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24981d485b0094d36b5bb586bef7535f8907e3ef5b4811beed079705cca9b254(
    value: typing.Optional[SagemakerDataQualityJobDefinitionStoppingCondition],
) -> None:
    """Type checking stubs"""
    pass
