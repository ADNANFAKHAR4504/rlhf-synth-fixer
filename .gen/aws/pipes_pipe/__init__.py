r'''
# `aws_pipes_pipe`

Refer to the Terraform Registry for docs: [`aws_pipes_pipe`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe).
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


class PipesPipe(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipe",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe aws_pipes_pipe}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        role_arn: builtins.str,
        source: builtins.str,
        target: builtins.str,
        description: typing.Optional[builtins.str] = None,
        desired_state: typing.Optional[builtins.str] = None,
        enrichment: typing.Optional[builtins.str] = None,
        enrichment_parameters: typing.Optional[typing.Union["PipesPipeEnrichmentParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        kms_key_identifier: typing.Optional[builtins.str] = None,
        log_configuration: typing.Optional[typing.Union["PipesPipeLogConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        source_parameters: typing.Optional[typing.Union["PipesPipeSourceParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        target_parameters: typing.Optional[typing.Union["PipesPipeTargetParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        timeouts: typing.Optional[typing.Union["PipesPipeTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe aws_pipes_pipe} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#role_arn PipesPipe#role_arn}.
        :param source: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source PipesPipe#source}.
        :param target: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#target PipesPipe#target}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#description PipesPipe#description}.
        :param desired_state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#desired_state PipesPipe#desired_state}.
        :param enrichment: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enrichment PipesPipe#enrichment}.
        :param enrichment_parameters: enrichment_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enrichment_parameters PipesPipe#enrichment_parameters}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#id PipesPipe#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param kms_key_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kms_key_identifier PipesPipe#kms_key_identifier}.
        :param log_configuration: log_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_configuration PipesPipe#log_configuration}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name_prefix PipesPipe#name_prefix}.
        :param source_parameters: source_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source_parameters PipesPipe#source_parameters}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags PipesPipe#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags_all PipesPipe#tags_all}.
        :param target_parameters: target_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#target_parameters PipesPipe#target_parameters}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#timeouts PipesPipe#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b89e6f44489675daafd151c6aa271f00c16fb4bc092cbdb0120f254b805d7323)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = PipesPipeConfig(
            role_arn=role_arn,
            source=source,
            target=target,
            description=description,
            desired_state=desired_state,
            enrichment=enrichment,
            enrichment_parameters=enrichment_parameters,
            id=id,
            kms_key_identifier=kms_key_identifier,
            log_configuration=log_configuration,
            name=name,
            name_prefix=name_prefix,
            source_parameters=source_parameters,
            tags=tags,
            tags_all=tags_all,
            target_parameters=target_parameters,
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
        '''Generates CDKTF code for importing a PipesPipe resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the PipesPipe to import.
        :param import_from_id: The id of the existing PipesPipe that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the PipesPipe to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8026625d8c8b8b0fe1cb9860ac62a81d34b62aa582b2ce1dc516591a32aa19d)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putEnrichmentParameters")
    def put_enrichment_parameters(
        self,
        *,
        http_parameters: typing.Optional[typing.Union["PipesPipeEnrichmentParametersHttpParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        input_template: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param http_parameters: http_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#http_parameters PipesPipe#http_parameters}
        :param input_template: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#input_template PipesPipe#input_template}.
        '''
        value = PipesPipeEnrichmentParameters(
            http_parameters=http_parameters, input_template=input_template
        )

        return typing.cast(None, jsii.invoke(self, "putEnrichmentParameters", [value]))

    @jsii.member(jsii_name="putLogConfiguration")
    def put_log_configuration(
        self,
        *,
        level: builtins.str,
        cloudwatch_logs_log_destination: typing.Optional[typing.Union["PipesPipeLogConfigurationCloudwatchLogsLogDestination", typing.Dict[builtins.str, typing.Any]]] = None,
        firehose_log_destination: typing.Optional[typing.Union["PipesPipeLogConfigurationFirehoseLogDestination", typing.Dict[builtins.str, typing.Any]]] = None,
        include_execution_data: typing.Optional[typing.Sequence[builtins.str]] = None,
        s3_log_destination: typing.Optional[typing.Union["PipesPipeLogConfigurationS3LogDestination", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param level: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#level PipesPipe#level}.
        :param cloudwatch_logs_log_destination: cloudwatch_logs_log_destination block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cloudwatch_logs_log_destination PipesPipe#cloudwatch_logs_log_destination}
        :param firehose_log_destination: firehose_log_destination block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#firehose_log_destination PipesPipe#firehose_log_destination}
        :param include_execution_data: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#include_execution_data PipesPipe#include_execution_data}.
        :param s3_log_destination: s3_log_destination block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#s3_log_destination PipesPipe#s3_log_destination}
        '''
        value = PipesPipeLogConfiguration(
            level=level,
            cloudwatch_logs_log_destination=cloudwatch_logs_log_destination,
            firehose_log_destination=firehose_log_destination,
            include_execution_data=include_execution_data,
            s3_log_destination=s3_log_destination,
        )

        return typing.cast(None, jsii.invoke(self, "putLogConfiguration", [value]))

    @jsii.member(jsii_name="putSourceParameters")
    def put_source_parameters(
        self,
        *,
        activemq_broker_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersActivemqBrokerParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        dynamodb_stream_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersDynamodbStreamParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        filter_criteria: typing.Optional[typing.Union["PipesPipeSourceParametersFilterCriteria", typing.Dict[builtins.str, typing.Any]]] = None,
        kinesis_stream_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersKinesisStreamParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        managed_streaming_kafka_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersManagedStreamingKafkaParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        rabbitmq_broker_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersRabbitmqBrokerParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        self_managed_kafka_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersSelfManagedKafkaParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        sqs_queue_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersSqsQueueParameters", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param activemq_broker_parameters: activemq_broker_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#activemq_broker_parameters PipesPipe#activemq_broker_parameters}
        :param dynamodb_stream_parameters: dynamodb_stream_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dynamodb_stream_parameters PipesPipe#dynamodb_stream_parameters}
        :param filter_criteria: filter_criteria block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#filter_criteria PipesPipe#filter_criteria}
        :param kinesis_stream_parameters: kinesis_stream_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kinesis_stream_parameters PipesPipe#kinesis_stream_parameters}
        :param managed_streaming_kafka_parameters: managed_streaming_kafka_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#managed_streaming_kafka_parameters PipesPipe#managed_streaming_kafka_parameters}
        :param rabbitmq_broker_parameters: rabbitmq_broker_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#rabbitmq_broker_parameters PipesPipe#rabbitmq_broker_parameters}
        :param self_managed_kafka_parameters: self_managed_kafka_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#self_managed_kafka_parameters PipesPipe#self_managed_kafka_parameters}
        :param sqs_queue_parameters: sqs_queue_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqs_queue_parameters PipesPipe#sqs_queue_parameters}
        '''
        value = PipesPipeSourceParameters(
            activemq_broker_parameters=activemq_broker_parameters,
            dynamodb_stream_parameters=dynamodb_stream_parameters,
            filter_criteria=filter_criteria,
            kinesis_stream_parameters=kinesis_stream_parameters,
            managed_streaming_kafka_parameters=managed_streaming_kafka_parameters,
            rabbitmq_broker_parameters=rabbitmq_broker_parameters,
            self_managed_kafka_parameters=self_managed_kafka_parameters,
            sqs_queue_parameters=sqs_queue_parameters,
        )

        return typing.cast(None, jsii.invoke(self, "putSourceParameters", [value]))

    @jsii.member(jsii_name="putTargetParameters")
    def put_target_parameters(
        self,
        *,
        batch_job_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersBatchJobParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        cloudwatch_logs_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersCloudwatchLogsParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        ecs_task_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersEcsTaskParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        eventbridge_event_bus_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersEventbridgeEventBusParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        http_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersHttpParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        input_template: typing.Optional[builtins.str] = None,
        kinesis_stream_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersKinesisStreamParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        lambda_function_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersLambdaFunctionParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        redshift_data_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersRedshiftDataParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        sagemaker_pipeline_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersSagemakerPipelineParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        sqs_queue_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersSqsQueueParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        step_function_state_machine_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersStepFunctionStateMachineParameters", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param batch_job_parameters: batch_job_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_job_parameters PipesPipe#batch_job_parameters}
        :param cloudwatch_logs_parameters: cloudwatch_logs_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cloudwatch_logs_parameters PipesPipe#cloudwatch_logs_parameters}
        :param ecs_task_parameters: ecs_task_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#ecs_task_parameters PipesPipe#ecs_task_parameters}
        :param eventbridge_event_bus_parameters: eventbridge_event_bus_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#eventbridge_event_bus_parameters PipesPipe#eventbridge_event_bus_parameters}
        :param http_parameters: http_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#http_parameters PipesPipe#http_parameters}
        :param input_template: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#input_template PipesPipe#input_template}.
        :param kinesis_stream_parameters: kinesis_stream_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kinesis_stream_parameters PipesPipe#kinesis_stream_parameters}
        :param lambda_function_parameters: lambda_function_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#lambda_function_parameters PipesPipe#lambda_function_parameters}
        :param redshift_data_parameters: redshift_data_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#redshift_data_parameters PipesPipe#redshift_data_parameters}
        :param sagemaker_pipeline_parameters: sagemaker_pipeline_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sagemaker_pipeline_parameters PipesPipe#sagemaker_pipeline_parameters}
        :param sqs_queue_parameters: sqs_queue_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqs_queue_parameters PipesPipe#sqs_queue_parameters}
        :param step_function_state_machine_parameters: step_function_state_machine_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#step_function_state_machine_parameters PipesPipe#step_function_state_machine_parameters}
        '''
        value = PipesPipeTargetParameters(
            batch_job_parameters=batch_job_parameters,
            cloudwatch_logs_parameters=cloudwatch_logs_parameters,
            ecs_task_parameters=ecs_task_parameters,
            eventbridge_event_bus_parameters=eventbridge_event_bus_parameters,
            http_parameters=http_parameters,
            input_template=input_template,
            kinesis_stream_parameters=kinesis_stream_parameters,
            lambda_function_parameters=lambda_function_parameters,
            redshift_data_parameters=redshift_data_parameters,
            sagemaker_pipeline_parameters=sagemaker_pipeline_parameters,
            sqs_queue_parameters=sqs_queue_parameters,
            step_function_state_machine_parameters=step_function_state_machine_parameters,
        )

        return typing.cast(None, jsii.invoke(self, "putTargetParameters", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#create PipesPipe#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#delete PipesPipe#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#update PipesPipe#update}.
        '''
        value = PipesPipeTimeouts(create=create, delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetDesiredState")
    def reset_desired_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDesiredState", []))

    @jsii.member(jsii_name="resetEnrichment")
    def reset_enrichment(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnrichment", []))

    @jsii.member(jsii_name="resetEnrichmentParameters")
    def reset_enrichment_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnrichmentParameters", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetKmsKeyIdentifier")
    def reset_kms_key_identifier(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKmsKeyIdentifier", []))

    @jsii.member(jsii_name="resetLogConfiguration")
    def reset_log_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLogConfiguration", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetNamePrefix")
    def reset_name_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNamePrefix", []))

    @jsii.member(jsii_name="resetSourceParameters")
    def reset_source_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourceParameters", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTargetParameters")
    def reset_target_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetParameters", []))

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
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @builtins.property
    @jsii.member(jsii_name="enrichmentParameters")
    def enrichment_parameters(self) -> "PipesPipeEnrichmentParametersOutputReference":
        return typing.cast("PipesPipeEnrichmentParametersOutputReference", jsii.get(self, "enrichmentParameters"))

    @builtins.property
    @jsii.member(jsii_name="logConfiguration")
    def log_configuration(self) -> "PipesPipeLogConfigurationOutputReference":
        return typing.cast("PipesPipeLogConfigurationOutputReference", jsii.get(self, "logConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="sourceParameters")
    def source_parameters(self) -> "PipesPipeSourceParametersOutputReference":
        return typing.cast("PipesPipeSourceParametersOutputReference", jsii.get(self, "sourceParameters"))

    @builtins.property
    @jsii.member(jsii_name="targetParameters")
    def target_parameters(self) -> "PipesPipeTargetParametersOutputReference":
        return typing.cast("PipesPipeTargetParametersOutputReference", jsii.get(self, "targetParameters"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "PipesPipeTimeoutsOutputReference":
        return typing.cast("PipesPipeTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="desiredStateInput")
    def desired_state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "desiredStateInput"))

    @builtins.property
    @jsii.member(jsii_name="enrichmentInput")
    def enrichment_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "enrichmentInput"))

    @builtins.property
    @jsii.member(jsii_name="enrichmentParametersInput")
    def enrichment_parameters_input(
        self,
    ) -> typing.Optional["PipesPipeEnrichmentParameters"]:
        return typing.cast(typing.Optional["PipesPipeEnrichmentParameters"], jsii.get(self, "enrichmentParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="kmsKeyIdentifierInput")
    def kms_key_identifier_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "kmsKeyIdentifierInput"))

    @builtins.property
    @jsii.member(jsii_name="logConfigurationInput")
    def log_configuration_input(self) -> typing.Optional["PipesPipeLogConfiguration"]:
        return typing.cast(typing.Optional["PipesPipeLogConfiguration"], jsii.get(self, "logConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="namePrefixInput")
    def name_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "namePrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceInput")
    def source_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceParametersInput")
    def source_parameters_input(self) -> typing.Optional["PipesPipeSourceParameters"]:
        return typing.cast(typing.Optional["PipesPipeSourceParameters"], jsii.get(self, "sourceParametersInput"))

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
    @jsii.member(jsii_name="targetInput")
    def target_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "targetInput"))

    @builtins.property
    @jsii.member(jsii_name="targetParametersInput")
    def target_parameters_input(self) -> typing.Optional["PipesPipeTargetParameters"]:
        return typing.cast(typing.Optional["PipesPipeTargetParameters"], jsii.get(self, "targetParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "PipesPipeTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "PipesPipeTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8fe2d3d11bb97474ee443aed2947f9a88facff277194062eb2845addf7cabe5f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="desiredState")
    def desired_state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "desiredState"))

    @desired_state.setter
    def desired_state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e78f4639feff3ede62c975a8afa02e6e03e0240f580d0fd7b38c65301709ce80)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "desiredState", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enrichment")
    def enrichment(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "enrichment"))

    @enrichment.setter
    def enrichment(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08feb17a29232b542dc7bc3768a8a0d822f13145a5ce71d31e019c705eeab56f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enrichment", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33b3b81045e38dbb6bff1d1bd8c2f583fd99a49b7858f639c4162ac5103e7c65)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="kmsKeyIdentifier")
    def kms_key_identifier(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "kmsKeyIdentifier"))

    @kms_key_identifier.setter
    def kms_key_identifier(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e43012401d6c259e8038e3dcd642031f8410e2f4cfa84b045f68c93bbcd8c6f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "kmsKeyIdentifier", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d403656ebf3a4924ebf87f30ce8e00a0f53ad45c90073b45790bf1e7e840aa7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="namePrefix")
    def name_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "namePrefix"))

    @name_prefix.setter
    def name_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e80879332f32ad35067fda6062ecfb7c2678915fc20d09adb95dc40bf7066453)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "namePrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce9e6578451a5eaec096487a0356ed97e37c41cc13a8827977831da8d9a9a14a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="source")
    def source(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "source"))

    @source.setter
    def source(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5464f844f2b66ae57d409844423fc9b07694f52e946e75f5feed57b9b05ca4d8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "source", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1975a6c8d77d4cd58da559482e21b60f03398d26e569cdfc4c36dc88ccb077bb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6aa0a93de4275d95e3474317cd02c227cea56022088400367c3ed42f891dae13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="target")
    def target(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "target"))

    @target.setter
    def target(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1f8e24e90047e07927acb768d52665c8b1561e5494807c049b4c96100177f7f7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "target", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "role_arn": "roleArn",
        "source": "source",
        "target": "target",
        "description": "description",
        "desired_state": "desiredState",
        "enrichment": "enrichment",
        "enrichment_parameters": "enrichmentParameters",
        "id": "id",
        "kms_key_identifier": "kmsKeyIdentifier",
        "log_configuration": "logConfiguration",
        "name": "name",
        "name_prefix": "namePrefix",
        "source_parameters": "sourceParameters",
        "tags": "tags",
        "tags_all": "tagsAll",
        "target_parameters": "targetParameters",
        "timeouts": "timeouts",
    },
)
class PipesPipeConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        role_arn: builtins.str,
        source: builtins.str,
        target: builtins.str,
        description: typing.Optional[builtins.str] = None,
        desired_state: typing.Optional[builtins.str] = None,
        enrichment: typing.Optional[builtins.str] = None,
        enrichment_parameters: typing.Optional[typing.Union["PipesPipeEnrichmentParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        kms_key_identifier: typing.Optional[builtins.str] = None,
        log_configuration: typing.Optional[typing.Union["PipesPipeLogConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        source_parameters: typing.Optional[typing.Union["PipesPipeSourceParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        target_parameters: typing.Optional[typing.Union["PipesPipeTargetParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        timeouts: typing.Optional[typing.Union["PipesPipeTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#role_arn PipesPipe#role_arn}.
        :param source: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source PipesPipe#source}.
        :param target: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#target PipesPipe#target}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#description PipesPipe#description}.
        :param desired_state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#desired_state PipesPipe#desired_state}.
        :param enrichment: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enrichment PipesPipe#enrichment}.
        :param enrichment_parameters: enrichment_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enrichment_parameters PipesPipe#enrichment_parameters}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#id PipesPipe#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param kms_key_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kms_key_identifier PipesPipe#kms_key_identifier}.
        :param log_configuration: log_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_configuration PipesPipe#log_configuration}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name_prefix PipesPipe#name_prefix}.
        :param source_parameters: source_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source_parameters PipesPipe#source_parameters}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags PipesPipe#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags_all PipesPipe#tags_all}.
        :param target_parameters: target_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#target_parameters PipesPipe#target_parameters}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#timeouts PipesPipe#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(enrichment_parameters, dict):
            enrichment_parameters = PipesPipeEnrichmentParameters(**enrichment_parameters)
        if isinstance(log_configuration, dict):
            log_configuration = PipesPipeLogConfiguration(**log_configuration)
        if isinstance(source_parameters, dict):
            source_parameters = PipesPipeSourceParameters(**source_parameters)
        if isinstance(target_parameters, dict):
            target_parameters = PipesPipeTargetParameters(**target_parameters)
        if isinstance(timeouts, dict):
            timeouts = PipesPipeTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b8de1ac79f8c2d0d09de9459993b5ba1027a3dc1103f7202ae3c520fc3986978)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument source", value=source, expected_type=type_hints["source"])
            check_type(argname="argument target", value=target, expected_type=type_hints["target"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument desired_state", value=desired_state, expected_type=type_hints["desired_state"])
            check_type(argname="argument enrichment", value=enrichment, expected_type=type_hints["enrichment"])
            check_type(argname="argument enrichment_parameters", value=enrichment_parameters, expected_type=type_hints["enrichment_parameters"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument kms_key_identifier", value=kms_key_identifier, expected_type=type_hints["kms_key_identifier"])
            check_type(argname="argument log_configuration", value=log_configuration, expected_type=type_hints["log_configuration"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument name_prefix", value=name_prefix, expected_type=type_hints["name_prefix"])
            check_type(argname="argument source_parameters", value=source_parameters, expected_type=type_hints["source_parameters"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument target_parameters", value=target_parameters, expected_type=type_hints["target_parameters"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "role_arn": role_arn,
            "source": source,
            "target": target,
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
        if description is not None:
            self._values["description"] = description
        if desired_state is not None:
            self._values["desired_state"] = desired_state
        if enrichment is not None:
            self._values["enrichment"] = enrichment
        if enrichment_parameters is not None:
            self._values["enrichment_parameters"] = enrichment_parameters
        if id is not None:
            self._values["id"] = id
        if kms_key_identifier is not None:
            self._values["kms_key_identifier"] = kms_key_identifier
        if log_configuration is not None:
            self._values["log_configuration"] = log_configuration
        if name is not None:
            self._values["name"] = name
        if name_prefix is not None:
            self._values["name_prefix"] = name_prefix
        if source_parameters is not None:
            self._values["source_parameters"] = source_parameters
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if target_parameters is not None:
            self._values["target_parameters"] = target_parameters
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
    def role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#role_arn PipesPipe#role_arn}.'''
        result = self._values.get("role_arn")
        assert result is not None, "Required property 'role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def source(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source PipesPipe#source}.'''
        result = self._values.get("source")
        assert result is not None, "Required property 'source' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def target(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#target PipesPipe#target}.'''
        result = self._values.get("target")
        assert result is not None, "Required property 'target' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#description PipesPipe#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def desired_state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#desired_state PipesPipe#desired_state}.'''
        result = self._values.get("desired_state")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def enrichment(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enrichment PipesPipe#enrichment}.'''
        result = self._values.get("enrichment")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def enrichment_parameters(self) -> typing.Optional["PipesPipeEnrichmentParameters"]:
        '''enrichment_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enrichment_parameters PipesPipe#enrichment_parameters}
        '''
        result = self._values.get("enrichment_parameters")
        return typing.cast(typing.Optional["PipesPipeEnrichmentParameters"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#id PipesPipe#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def kms_key_identifier(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kms_key_identifier PipesPipe#kms_key_identifier}.'''
        result = self._values.get("kms_key_identifier")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def log_configuration(self) -> typing.Optional["PipesPipeLogConfiguration"]:
        '''log_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_configuration PipesPipe#log_configuration}
        '''
        result = self._values.get("log_configuration")
        return typing.cast(typing.Optional["PipesPipeLogConfiguration"], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name_prefix PipesPipe#name_prefix}.'''
        result = self._values.get("name_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def source_parameters(self) -> typing.Optional["PipesPipeSourceParameters"]:
        '''source_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source_parameters PipesPipe#source_parameters}
        '''
        result = self._values.get("source_parameters")
        return typing.cast(typing.Optional["PipesPipeSourceParameters"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags PipesPipe#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags_all PipesPipe#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def target_parameters(self) -> typing.Optional["PipesPipeTargetParameters"]:
        '''target_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#target_parameters PipesPipe#target_parameters}
        '''
        result = self._values.get("target_parameters")
        return typing.cast(typing.Optional["PipesPipeTargetParameters"], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["PipesPipeTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#timeouts PipesPipe#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["PipesPipeTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeEnrichmentParameters",
    jsii_struct_bases=[],
    name_mapping={
        "http_parameters": "httpParameters",
        "input_template": "inputTemplate",
    },
)
class PipesPipeEnrichmentParameters:
    def __init__(
        self,
        *,
        http_parameters: typing.Optional[typing.Union["PipesPipeEnrichmentParametersHttpParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        input_template: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param http_parameters: http_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#http_parameters PipesPipe#http_parameters}
        :param input_template: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#input_template PipesPipe#input_template}.
        '''
        if isinstance(http_parameters, dict):
            http_parameters = PipesPipeEnrichmentParametersHttpParameters(**http_parameters)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4247023c534340b71563f95390bc449795ea54c5b7d59e8b67e7949d8f41b00c)
            check_type(argname="argument http_parameters", value=http_parameters, expected_type=type_hints["http_parameters"])
            check_type(argname="argument input_template", value=input_template, expected_type=type_hints["input_template"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if http_parameters is not None:
            self._values["http_parameters"] = http_parameters
        if input_template is not None:
            self._values["input_template"] = input_template

    @builtins.property
    def http_parameters(
        self,
    ) -> typing.Optional["PipesPipeEnrichmentParametersHttpParameters"]:
        '''http_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#http_parameters PipesPipe#http_parameters}
        '''
        result = self._values.get("http_parameters")
        return typing.cast(typing.Optional["PipesPipeEnrichmentParametersHttpParameters"], result)

    @builtins.property
    def input_template(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#input_template PipesPipe#input_template}.'''
        result = self._values.get("input_template")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeEnrichmentParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeEnrichmentParametersHttpParameters",
    jsii_struct_bases=[],
    name_mapping={
        "header_parameters": "headerParameters",
        "path_parameter_values": "pathParameterValues",
        "query_string_parameters": "queryStringParameters",
    },
)
class PipesPipeEnrichmentParametersHttpParameters:
    def __init__(
        self,
        *,
        header_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        path_parameter_values: typing.Optional[typing.Sequence[builtins.str]] = None,
        query_string_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param header_parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#header_parameters PipesPipe#header_parameters}.
        :param path_parameter_values: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#path_parameter_values PipesPipe#path_parameter_values}.
        :param query_string_parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#query_string_parameters PipesPipe#query_string_parameters}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f636e8c9485868602bf4f13ec268e9b45a24119390008e2e3b0b4e654409e272)
            check_type(argname="argument header_parameters", value=header_parameters, expected_type=type_hints["header_parameters"])
            check_type(argname="argument path_parameter_values", value=path_parameter_values, expected_type=type_hints["path_parameter_values"])
            check_type(argname="argument query_string_parameters", value=query_string_parameters, expected_type=type_hints["query_string_parameters"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if header_parameters is not None:
            self._values["header_parameters"] = header_parameters
        if path_parameter_values is not None:
            self._values["path_parameter_values"] = path_parameter_values
        if query_string_parameters is not None:
            self._values["query_string_parameters"] = query_string_parameters

    @builtins.property
    def header_parameters(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#header_parameters PipesPipe#header_parameters}.'''
        result = self._values.get("header_parameters")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def path_parameter_values(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#path_parameter_values PipesPipe#path_parameter_values}.'''
        result = self._values.get("path_parameter_values")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def query_string_parameters(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#query_string_parameters PipesPipe#query_string_parameters}.'''
        result = self._values.get("query_string_parameters")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeEnrichmentParametersHttpParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeEnrichmentParametersHttpParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeEnrichmentParametersHttpParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3c9fdbfabafb509d7cb27e1f749e1f8df9e32d1b32a3a305a7916e310faabf76)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetHeaderParameters")
    def reset_header_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHeaderParameters", []))

    @jsii.member(jsii_name="resetPathParameterValues")
    def reset_path_parameter_values(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPathParameterValues", []))

    @jsii.member(jsii_name="resetQueryStringParameters")
    def reset_query_string_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetQueryStringParameters", []))

    @builtins.property
    @jsii.member(jsii_name="headerParametersInput")
    def header_parameters_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "headerParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="pathParameterValuesInput")
    def path_parameter_values_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "pathParameterValuesInput"))

    @builtins.property
    @jsii.member(jsii_name="queryStringParametersInput")
    def query_string_parameters_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "queryStringParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="headerParameters")
    def header_parameters(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "headerParameters"))

    @header_parameters.setter
    def header_parameters(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d7e9d2cf0c7c653b89b7a7bfb58b50e430bca7c5339f9a9d2f632290825f2ede)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "headerParameters", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="pathParameterValues")
    def path_parameter_values(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "pathParameterValues"))

    @path_parameter_values.setter
    def path_parameter_values(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f28d88f24366ae32af21382e561c812ceb478e9f7b15ecd313f79b0f0b0cafc6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "pathParameterValues", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="queryStringParameters")
    def query_string_parameters(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "queryStringParameters"))

    @query_string_parameters.setter
    def query_string_parameters(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42b8db0754ba10d68e70084dee19152d86396fed635618b85c0807255cb045be)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "queryStringParameters", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeEnrichmentParametersHttpParameters]:
        return typing.cast(typing.Optional[PipesPipeEnrichmentParametersHttpParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeEnrichmentParametersHttpParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__31f0bcf5725634d49c2a58cc78bb0eef7b901056ef4787095e5628773306e03b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeEnrichmentParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeEnrichmentParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4b9443c1d3cf28e8b44f2d54aaaa34c2ac63bdc4b1e68517fc0f0c84ae23dd66)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putHttpParameters")
    def put_http_parameters(
        self,
        *,
        header_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        path_parameter_values: typing.Optional[typing.Sequence[builtins.str]] = None,
        query_string_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param header_parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#header_parameters PipesPipe#header_parameters}.
        :param path_parameter_values: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#path_parameter_values PipesPipe#path_parameter_values}.
        :param query_string_parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#query_string_parameters PipesPipe#query_string_parameters}.
        '''
        value = PipesPipeEnrichmentParametersHttpParameters(
            header_parameters=header_parameters,
            path_parameter_values=path_parameter_values,
            query_string_parameters=query_string_parameters,
        )

        return typing.cast(None, jsii.invoke(self, "putHttpParameters", [value]))

    @jsii.member(jsii_name="resetHttpParameters")
    def reset_http_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHttpParameters", []))

    @jsii.member(jsii_name="resetInputTemplate")
    def reset_input_template(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInputTemplate", []))

    @builtins.property
    @jsii.member(jsii_name="httpParameters")
    def http_parameters(
        self,
    ) -> PipesPipeEnrichmentParametersHttpParametersOutputReference:
        return typing.cast(PipesPipeEnrichmentParametersHttpParametersOutputReference, jsii.get(self, "httpParameters"))

    @builtins.property
    @jsii.member(jsii_name="httpParametersInput")
    def http_parameters_input(
        self,
    ) -> typing.Optional[PipesPipeEnrichmentParametersHttpParameters]:
        return typing.cast(typing.Optional[PipesPipeEnrichmentParametersHttpParameters], jsii.get(self, "httpParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="inputTemplateInput")
    def input_template_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "inputTemplateInput"))

    @builtins.property
    @jsii.member(jsii_name="inputTemplate")
    def input_template(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "inputTemplate"))

    @input_template.setter
    def input_template(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7a26fa2c595db8042466924793b4e6e7cbb87bf9f2cf7e57dd47de1a74258a79)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "inputTemplate", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[PipesPipeEnrichmentParameters]:
        return typing.cast(typing.Optional[PipesPipeEnrichmentParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeEnrichmentParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2d45cf69dc66c73b89d62dcbfe2995d47d5c10146690d4ebe15c7eac69a13355)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeLogConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "level": "level",
        "cloudwatch_logs_log_destination": "cloudwatchLogsLogDestination",
        "firehose_log_destination": "firehoseLogDestination",
        "include_execution_data": "includeExecutionData",
        "s3_log_destination": "s3LogDestination",
    },
)
class PipesPipeLogConfiguration:
    def __init__(
        self,
        *,
        level: builtins.str,
        cloudwatch_logs_log_destination: typing.Optional[typing.Union["PipesPipeLogConfigurationCloudwatchLogsLogDestination", typing.Dict[builtins.str, typing.Any]]] = None,
        firehose_log_destination: typing.Optional[typing.Union["PipesPipeLogConfigurationFirehoseLogDestination", typing.Dict[builtins.str, typing.Any]]] = None,
        include_execution_data: typing.Optional[typing.Sequence[builtins.str]] = None,
        s3_log_destination: typing.Optional[typing.Union["PipesPipeLogConfigurationS3LogDestination", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param level: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#level PipesPipe#level}.
        :param cloudwatch_logs_log_destination: cloudwatch_logs_log_destination block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cloudwatch_logs_log_destination PipesPipe#cloudwatch_logs_log_destination}
        :param firehose_log_destination: firehose_log_destination block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#firehose_log_destination PipesPipe#firehose_log_destination}
        :param include_execution_data: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#include_execution_data PipesPipe#include_execution_data}.
        :param s3_log_destination: s3_log_destination block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#s3_log_destination PipesPipe#s3_log_destination}
        '''
        if isinstance(cloudwatch_logs_log_destination, dict):
            cloudwatch_logs_log_destination = PipesPipeLogConfigurationCloudwatchLogsLogDestination(**cloudwatch_logs_log_destination)
        if isinstance(firehose_log_destination, dict):
            firehose_log_destination = PipesPipeLogConfigurationFirehoseLogDestination(**firehose_log_destination)
        if isinstance(s3_log_destination, dict):
            s3_log_destination = PipesPipeLogConfigurationS3LogDestination(**s3_log_destination)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7aeea0e3f1ff0ea511087093609d2af8df403bacb838b3ab02551282e770d522)
            check_type(argname="argument level", value=level, expected_type=type_hints["level"])
            check_type(argname="argument cloudwatch_logs_log_destination", value=cloudwatch_logs_log_destination, expected_type=type_hints["cloudwatch_logs_log_destination"])
            check_type(argname="argument firehose_log_destination", value=firehose_log_destination, expected_type=type_hints["firehose_log_destination"])
            check_type(argname="argument include_execution_data", value=include_execution_data, expected_type=type_hints["include_execution_data"])
            check_type(argname="argument s3_log_destination", value=s3_log_destination, expected_type=type_hints["s3_log_destination"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "level": level,
        }
        if cloudwatch_logs_log_destination is not None:
            self._values["cloudwatch_logs_log_destination"] = cloudwatch_logs_log_destination
        if firehose_log_destination is not None:
            self._values["firehose_log_destination"] = firehose_log_destination
        if include_execution_data is not None:
            self._values["include_execution_data"] = include_execution_data
        if s3_log_destination is not None:
            self._values["s3_log_destination"] = s3_log_destination

    @builtins.property
    def level(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#level PipesPipe#level}.'''
        result = self._values.get("level")
        assert result is not None, "Required property 'level' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def cloudwatch_logs_log_destination(
        self,
    ) -> typing.Optional["PipesPipeLogConfigurationCloudwatchLogsLogDestination"]:
        '''cloudwatch_logs_log_destination block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cloudwatch_logs_log_destination PipesPipe#cloudwatch_logs_log_destination}
        '''
        result = self._values.get("cloudwatch_logs_log_destination")
        return typing.cast(typing.Optional["PipesPipeLogConfigurationCloudwatchLogsLogDestination"], result)

    @builtins.property
    def firehose_log_destination(
        self,
    ) -> typing.Optional["PipesPipeLogConfigurationFirehoseLogDestination"]:
        '''firehose_log_destination block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#firehose_log_destination PipesPipe#firehose_log_destination}
        '''
        result = self._values.get("firehose_log_destination")
        return typing.cast(typing.Optional["PipesPipeLogConfigurationFirehoseLogDestination"], result)

    @builtins.property
    def include_execution_data(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#include_execution_data PipesPipe#include_execution_data}.'''
        result = self._values.get("include_execution_data")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def s3_log_destination(
        self,
    ) -> typing.Optional["PipesPipeLogConfigurationS3LogDestination"]:
        '''s3_log_destination block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#s3_log_destination PipesPipe#s3_log_destination}
        '''
        result = self._values.get("s3_log_destination")
        return typing.cast(typing.Optional["PipesPipeLogConfigurationS3LogDestination"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeLogConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination",
    jsii_struct_bases=[],
    name_mapping={"log_group_arn": "logGroupArn"},
)
class PipesPipeLogConfigurationCloudwatchLogsLogDestination:
    def __init__(self, *, log_group_arn: builtins.str) -> None:
        '''
        :param log_group_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_group_arn PipesPipe#log_group_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd285bd6e9ccda20e978fff34cfdeed48c6a0d25ffd929136cac65edbc365cf9)
            check_type(argname="argument log_group_arn", value=log_group_arn, expected_type=type_hints["log_group_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "log_group_arn": log_group_arn,
        }

    @builtins.property
    def log_group_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_group_arn PipesPipe#log_group_arn}.'''
        result = self._values.get("log_group_arn")
        assert result is not None, "Required property 'log_group_arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeLogConfigurationCloudwatchLogsLogDestination(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeLogConfigurationCloudwatchLogsLogDestinationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeLogConfigurationCloudwatchLogsLogDestinationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__669b0fb9dc6204f33698bb93f689200cf0ecd7ee3be4255a1eea685adb2727d2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="logGroupArnInput")
    def log_group_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "logGroupArnInput"))

    @builtins.property
    @jsii.member(jsii_name="logGroupArn")
    def log_group_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "logGroupArn"))

    @log_group_arn.setter
    def log_group_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04cbae9b04bb6b44b82d1196d3ab2ed13c07d817bf27dc15e6bd3fe629eec31f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "logGroupArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeLogConfigurationCloudwatchLogsLogDestination]:
        return typing.cast(typing.Optional[PipesPipeLogConfigurationCloudwatchLogsLogDestination], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeLogConfigurationCloudwatchLogsLogDestination],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a0837a07bec9cd857a96f63a2954836b36d7c0efd22b1b1755fe20a2a56148b2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeLogConfigurationFirehoseLogDestination",
    jsii_struct_bases=[],
    name_mapping={"delivery_stream_arn": "deliveryStreamArn"},
)
class PipesPipeLogConfigurationFirehoseLogDestination:
    def __init__(self, *, delivery_stream_arn: builtins.str) -> None:
        '''
        :param delivery_stream_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#delivery_stream_arn PipesPipe#delivery_stream_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6114c0a1ed26a403a78367f5120a5674770dc0d3d11031410fab6b0773a38fa)
            check_type(argname="argument delivery_stream_arn", value=delivery_stream_arn, expected_type=type_hints["delivery_stream_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "delivery_stream_arn": delivery_stream_arn,
        }

    @builtins.property
    def delivery_stream_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#delivery_stream_arn PipesPipe#delivery_stream_arn}.'''
        result = self._values.get("delivery_stream_arn")
        assert result is not None, "Required property 'delivery_stream_arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeLogConfigurationFirehoseLogDestination(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeLogConfigurationFirehoseLogDestinationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeLogConfigurationFirehoseLogDestinationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f29d7a4d660f6273aac4ddee93294ccb68540954ad9aa3b7a10d7340983b6f20)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="deliveryStreamArnInput")
    def delivery_stream_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deliveryStreamArnInput"))

    @builtins.property
    @jsii.member(jsii_name="deliveryStreamArn")
    def delivery_stream_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deliveryStreamArn"))

    @delivery_stream_arn.setter
    def delivery_stream_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5b5ef324da14198a0dcb38a0b155d3b49b428834add4dceef8d0aef52d364d4f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deliveryStreamArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeLogConfigurationFirehoseLogDestination]:
        return typing.cast(typing.Optional[PipesPipeLogConfigurationFirehoseLogDestination], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeLogConfigurationFirehoseLogDestination],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__13340658e3fb61d48c613bc9613c3eb029514b33df67aec8ea809dddf8ad6a46)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeLogConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeLogConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__70fb43949f208d1dccfebaa6c21a8bf1622a9a73ff98e4f1d6e4ffe5b916d698)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCloudwatchLogsLogDestination")
    def put_cloudwatch_logs_log_destination(
        self,
        *,
        log_group_arn: builtins.str,
    ) -> None:
        '''
        :param log_group_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_group_arn PipesPipe#log_group_arn}.
        '''
        value = PipesPipeLogConfigurationCloudwatchLogsLogDestination(
            log_group_arn=log_group_arn
        )

        return typing.cast(None, jsii.invoke(self, "putCloudwatchLogsLogDestination", [value]))

    @jsii.member(jsii_name="putFirehoseLogDestination")
    def put_firehose_log_destination(
        self,
        *,
        delivery_stream_arn: builtins.str,
    ) -> None:
        '''
        :param delivery_stream_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#delivery_stream_arn PipesPipe#delivery_stream_arn}.
        '''
        value = PipesPipeLogConfigurationFirehoseLogDestination(
            delivery_stream_arn=delivery_stream_arn
        )

        return typing.cast(None, jsii.invoke(self, "putFirehoseLogDestination", [value]))

    @jsii.member(jsii_name="putS3LogDestination")
    def put_s3_log_destination(
        self,
        *,
        bucket_name: builtins.str,
        bucket_owner: builtins.str,
        output_format: typing.Optional[builtins.str] = None,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#bucket_name PipesPipe#bucket_name}.
        :param bucket_owner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#bucket_owner PipesPipe#bucket_owner}.
        :param output_format: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#output_format PipesPipe#output_format}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#prefix PipesPipe#prefix}.
        '''
        value = PipesPipeLogConfigurationS3LogDestination(
            bucket_name=bucket_name,
            bucket_owner=bucket_owner,
            output_format=output_format,
            prefix=prefix,
        )

        return typing.cast(None, jsii.invoke(self, "putS3LogDestination", [value]))

    @jsii.member(jsii_name="resetCloudwatchLogsLogDestination")
    def reset_cloudwatch_logs_log_destination(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCloudwatchLogsLogDestination", []))

    @jsii.member(jsii_name="resetFirehoseLogDestination")
    def reset_firehose_log_destination(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFirehoseLogDestination", []))

    @jsii.member(jsii_name="resetIncludeExecutionData")
    def reset_include_execution_data(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIncludeExecutionData", []))

    @jsii.member(jsii_name="resetS3LogDestination")
    def reset_s3_log_destination(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3LogDestination", []))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchLogsLogDestination")
    def cloudwatch_logs_log_destination(
        self,
    ) -> PipesPipeLogConfigurationCloudwatchLogsLogDestinationOutputReference:
        return typing.cast(PipesPipeLogConfigurationCloudwatchLogsLogDestinationOutputReference, jsii.get(self, "cloudwatchLogsLogDestination"))

    @builtins.property
    @jsii.member(jsii_name="firehoseLogDestination")
    def firehose_log_destination(
        self,
    ) -> PipesPipeLogConfigurationFirehoseLogDestinationOutputReference:
        return typing.cast(PipesPipeLogConfigurationFirehoseLogDestinationOutputReference, jsii.get(self, "firehoseLogDestination"))

    @builtins.property
    @jsii.member(jsii_name="s3LogDestination")
    def s3_log_destination(
        self,
    ) -> "PipesPipeLogConfigurationS3LogDestinationOutputReference":
        return typing.cast("PipesPipeLogConfigurationS3LogDestinationOutputReference", jsii.get(self, "s3LogDestination"))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchLogsLogDestinationInput")
    def cloudwatch_logs_log_destination_input(
        self,
    ) -> typing.Optional[PipesPipeLogConfigurationCloudwatchLogsLogDestination]:
        return typing.cast(typing.Optional[PipesPipeLogConfigurationCloudwatchLogsLogDestination], jsii.get(self, "cloudwatchLogsLogDestinationInput"))

    @builtins.property
    @jsii.member(jsii_name="firehoseLogDestinationInput")
    def firehose_log_destination_input(
        self,
    ) -> typing.Optional[PipesPipeLogConfigurationFirehoseLogDestination]:
        return typing.cast(typing.Optional[PipesPipeLogConfigurationFirehoseLogDestination], jsii.get(self, "firehoseLogDestinationInput"))

    @builtins.property
    @jsii.member(jsii_name="includeExecutionDataInput")
    def include_execution_data_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "includeExecutionDataInput"))

    @builtins.property
    @jsii.member(jsii_name="levelInput")
    def level_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "levelInput"))

    @builtins.property
    @jsii.member(jsii_name="s3LogDestinationInput")
    def s3_log_destination_input(
        self,
    ) -> typing.Optional["PipesPipeLogConfigurationS3LogDestination"]:
        return typing.cast(typing.Optional["PipesPipeLogConfigurationS3LogDestination"], jsii.get(self, "s3LogDestinationInput"))

    @builtins.property
    @jsii.member(jsii_name="includeExecutionData")
    def include_execution_data(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "includeExecutionData"))

    @include_execution_data.setter
    def include_execution_data(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f287f88f1183e0d338f705c83f621b8184f0149cf1d78cb5e23a420f2d170236)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "includeExecutionData", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="level")
    def level(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "level"))

    @level.setter
    def level(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__68dc5fe56dc3f76c6f4dbedc948d8908dbfc1db73b5dccbe9eef152f9d712549)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "level", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[PipesPipeLogConfiguration]:
        return typing.cast(typing.Optional[PipesPipeLogConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[PipesPipeLogConfiguration]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__be7b112b99ec30b8f413ddf338dd66c39838c30edb28e1663f38ba54a9457c74)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeLogConfigurationS3LogDestination",
    jsii_struct_bases=[],
    name_mapping={
        "bucket_name": "bucketName",
        "bucket_owner": "bucketOwner",
        "output_format": "outputFormat",
        "prefix": "prefix",
    },
)
class PipesPipeLogConfigurationS3LogDestination:
    def __init__(
        self,
        *,
        bucket_name: builtins.str,
        bucket_owner: builtins.str,
        output_format: typing.Optional[builtins.str] = None,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param bucket_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#bucket_name PipesPipe#bucket_name}.
        :param bucket_owner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#bucket_owner PipesPipe#bucket_owner}.
        :param output_format: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#output_format PipesPipe#output_format}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#prefix PipesPipe#prefix}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37571c34d7b37a62522076f63ac96a4532cde781e60925bea341769755b09974)
            check_type(argname="argument bucket_name", value=bucket_name, expected_type=type_hints["bucket_name"])
            check_type(argname="argument bucket_owner", value=bucket_owner, expected_type=type_hints["bucket_owner"])
            check_type(argname="argument output_format", value=output_format, expected_type=type_hints["output_format"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "bucket_name": bucket_name,
            "bucket_owner": bucket_owner,
        }
        if output_format is not None:
            self._values["output_format"] = output_format
        if prefix is not None:
            self._values["prefix"] = prefix

    @builtins.property
    def bucket_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#bucket_name PipesPipe#bucket_name}.'''
        result = self._values.get("bucket_name")
        assert result is not None, "Required property 'bucket_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def bucket_owner(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#bucket_owner PipesPipe#bucket_owner}.'''
        result = self._values.get("bucket_owner")
        assert result is not None, "Required property 'bucket_owner' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def output_format(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#output_format PipesPipe#output_format}.'''
        result = self._values.get("output_format")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#prefix PipesPipe#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeLogConfigurationS3LogDestination(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeLogConfigurationS3LogDestinationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeLogConfigurationS3LogDestinationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__61119b8e4711355f6fb53d324d2e1e7e244ea3ff49f0ff2bf3c1b64fe77401dc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetOutputFormat")
    def reset_output_format(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOutputFormat", []))

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @builtins.property
    @jsii.member(jsii_name="bucketNameInput")
    def bucket_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bucketNameInput"))

    @builtins.property
    @jsii.member(jsii_name="bucketOwnerInput")
    def bucket_owner_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "bucketOwnerInput"))

    @builtins.property
    @jsii.member(jsii_name="outputFormatInput")
    def output_format_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "outputFormatInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="bucketName")
    def bucket_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucketName"))

    @bucket_name.setter
    def bucket_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__92b93571f28bf47304dd639d86a04c3ddaecd700531ea6f73bd7901ed5ef2242)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bucketName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="bucketOwner")
    def bucket_owner(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "bucketOwner"))

    @bucket_owner.setter
    def bucket_owner(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9f551dd21a9b6737471a0228ddecded830649dd4b711594dd14c1700d9e8d852)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bucketOwner", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="outputFormat")
    def output_format(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "outputFormat"))

    @output_format.setter
    def output_format(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7efcab4acdf785e21174b620b0f11540a6072be7e52f26fe789df546ea0458f0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "outputFormat", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02d84a7cc230d9a6f0a2e8e780952dacd32702843fb4be6fe55ecb0c591b2bf5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeLogConfigurationS3LogDestination]:
        return typing.cast(typing.Optional[PipesPipeLogConfigurationS3LogDestination], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeLogConfigurationS3LogDestination],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a85588aabb8eaab01d77025b55621b945ef178640a02499678d681acd6a96d13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParameters",
    jsii_struct_bases=[],
    name_mapping={
        "activemq_broker_parameters": "activemqBrokerParameters",
        "dynamodb_stream_parameters": "dynamodbStreamParameters",
        "filter_criteria": "filterCriteria",
        "kinesis_stream_parameters": "kinesisStreamParameters",
        "managed_streaming_kafka_parameters": "managedStreamingKafkaParameters",
        "rabbitmq_broker_parameters": "rabbitmqBrokerParameters",
        "self_managed_kafka_parameters": "selfManagedKafkaParameters",
        "sqs_queue_parameters": "sqsQueueParameters",
    },
)
class PipesPipeSourceParameters:
    def __init__(
        self,
        *,
        activemq_broker_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersActivemqBrokerParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        dynamodb_stream_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersDynamodbStreamParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        filter_criteria: typing.Optional[typing.Union["PipesPipeSourceParametersFilterCriteria", typing.Dict[builtins.str, typing.Any]]] = None,
        kinesis_stream_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersKinesisStreamParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        managed_streaming_kafka_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersManagedStreamingKafkaParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        rabbitmq_broker_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersRabbitmqBrokerParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        self_managed_kafka_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersSelfManagedKafkaParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        sqs_queue_parameters: typing.Optional[typing.Union["PipesPipeSourceParametersSqsQueueParameters", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param activemq_broker_parameters: activemq_broker_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#activemq_broker_parameters PipesPipe#activemq_broker_parameters}
        :param dynamodb_stream_parameters: dynamodb_stream_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dynamodb_stream_parameters PipesPipe#dynamodb_stream_parameters}
        :param filter_criteria: filter_criteria block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#filter_criteria PipesPipe#filter_criteria}
        :param kinesis_stream_parameters: kinesis_stream_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kinesis_stream_parameters PipesPipe#kinesis_stream_parameters}
        :param managed_streaming_kafka_parameters: managed_streaming_kafka_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#managed_streaming_kafka_parameters PipesPipe#managed_streaming_kafka_parameters}
        :param rabbitmq_broker_parameters: rabbitmq_broker_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#rabbitmq_broker_parameters PipesPipe#rabbitmq_broker_parameters}
        :param self_managed_kafka_parameters: self_managed_kafka_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#self_managed_kafka_parameters PipesPipe#self_managed_kafka_parameters}
        :param sqs_queue_parameters: sqs_queue_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqs_queue_parameters PipesPipe#sqs_queue_parameters}
        '''
        if isinstance(activemq_broker_parameters, dict):
            activemq_broker_parameters = PipesPipeSourceParametersActivemqBrokerParameters(**activemq_broker_parameters)
        if isinstance(dynamodb_stream_parameters, dict):
            dynamodb_stream_parameters = PipesPipeSourceParametersDynamodbStreamParameters(**dynamodb_stream_parameters)
        if isinstance(filter_criteria, dict):
            filter_criteria = PipesPipeSourceParametersFilterCriteria(**filter_criteria)
        if isinstance(kinesis_stream_parameters, dict):
            kinesis_stream_parameters = PipesPipeSourceParametersKinesisStreamParameters(**kinesis_stream_parameters)
        if isinstance(managed_streaming_kafka_parameters, dict):
            managed_streaming_kafka_parameters = PipesPipeSourceParametersManagedStreamingKafkaParameters(**managed_streaming_kafka_parameters)
        if isinstance(rabbitmq_broker_parameters, dict):
            rabbitmq_broker_parameters = PipesPipeSourceParametersRabbitmqBrokerParameters(**rabbitmq_broker_parameters)
        if isinstance(self_managed_kafka_parameters, dict):
            self_managed_kafka_parameters = PipesPipeSourceParametersSelfManagedKafkaParameters(**self_managed_kafka_parameters)
        if isinstance(sqs_queue_parameters, dict):
            sqs_queue_parameters = PipesPipeSourceParametersSqsQueueParameters(**sqs_queue_parameters)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d3ffc28030f6ca5d68facf4e8e5d59dc2e7f40a08696c4d72339cbb11b30f50)
            check_type(argname="argument activemq_broker_parameters", value=activemq_broker_parameters, expected_type=type_hints["activemq_broker_parameters"])
            check_type(argname="argument dynamodb_stream_parameters", value=dynamodb_stream_parameters, expected_type=type_hints["dynamodb_stream_parameters"])
            check_type(argname="argument filter_criteria", value=filter_criteria, expected_type=type_hints["filter_criteria"])
            check_type(argname="argument kinesis_stream_parameters", value=kinesis_stream_parameters, expected_type=type_hints["kinesis_stream_parameters"])
            check_type(argname="argument managed_streaming_kafka_parameters", value=managed_streaming_kafka_parameters, expected_type=type_hints["managed_streaming_kafka_parameters"])
            check_type(argname="argument rabbitmq_broker_parameters", value=rabbitmq_broker_parameters, expected_type=type_hints["rabbitmq_broker_parameters"])
            check_type(argname="argument self_managed_kafka_parameters", value=self_managed_kafka_parameters, expected_type=type_hints["self_managed_kafka_parameters"])
            check_type(argname="argument sqs_queue_parameters", value=sqs_queue_parameters, expected_type=type_hints["sqs_queue_parameters"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if activemq_broker_parameters is not None:
            self._values["activemq_broker_parameters"] = activemq_broker_parameters
        if dynamodb_stream_parameters is not None:
            self._values["dynamodb_stream_parameters"] = dynamodb_stream_parameters
        if filter_criteria is not None:
            self._values["filter_criteria"] = filter_criteria
        if kinesis_stream_parameters is not None:
            self._values["kinesis_stream_parameters"] = kinesis_stream_parameters
        if managed_streaming_kafka_parameters is not None:
            self._values["managed_streaming_kafka_parameters"] = managed_streaming_kafka_parameters
        if rabbitmq_broker_parameters is not None:
            self._values["rabbitmq_broker_parameters"] = rabbitmq_broker_parameters
        if self_managed_kafka_parameters is not None:
            self._values["self_managed_kafka_parameters"] = self_managed_kafka_parameters
        if sqs_queue_parameters is not None:
            self._values["sqs_queue_parameters"] = sqs_queue_parameters

    @builtins.property
    def activemq_broker_parameters(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersActivemqBrokerParameters"]:
        '''activemq_broker_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#activemq_broker_parameters PipesPipe#activemq_broker_parameters}
        '''
        result = self._values.get("activemq_broker_parameters")
        return typing.cast(typing.Optional["PipesPipeSourceParametersActivemqBrokerParameters"], result)

    @builtins.property
    def dynamodb_stream_parameters(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersDynamodbStreamParameters"]:
        '''dynamodb_stream_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dynamodb_stream_parameters PipesPipe#dynamodb_stream_parameters}
        '''
        result = self._values.get("dynamodb_stream_parameters")
        return typing.cast(typing.Optional["PipesPipeSourceParametersDynamodbStreamParameters"], result)

    @builtins.property
    def filter_criteria(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersFilterCriteria"]:
        '''filter_criteria block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#filter_criteria PipesPipe#filter_criteria}
        '''
        result = self._values.get("filter_criteria")
        return typing.cast(typing.Optional["PipesPipeSourceParametersFilterCriteria"], result)

    @builtins.property
    def kinesis_stream_parameters(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersKinesisStreamParameters"]:
        '''kinesis_stream_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kinesis_stream_parameters PipesPipe#kinesis_stream_parameters}
        '''
        result = self._values.get("kinesis_stream_parameters")
        return typing.cast(typing.Optional["PipesPipeSourceParametersKinesisStreamParameters"], result)

    @builtins.property
    def managed_streaming_kafka_parameters(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersManagedStreamingKafkaParameters"]:
        '''managed_streaming_kafka_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#managed_streaming_kafka_parameters PipesPipe#managed_streaming_kafka_parameters}
        '''
        result = self._values.get("managed_streaming_kafka_parameters")
        return typing.cast(typing.Optional["PipesPipeSourceParametersManagedStreamingKafkaParameters"], result)

    @builtins.property
    def rabbitmq_broker_parameters(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersRabbitmqBrokerParameters"]:
        '''rabbitmq_broker_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#rabbitmq_broker_parameters PipesPipe#rabbitmq_broker_parameters}
        '''
        result = self._values.get("rabbitmq_broker_parameters")
        return typing.cast(typing.Optional["PipesPipeSourceParametersRabbitmqBrokerParameters"], result)

    @builtins.property
    def self_managed_kafka_parameters(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersSelfManagedKafkaParameters"]:
        '''self_managed_kafka_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#self_managed_kafka_parameters PipesPipe#self_managed_kafka_parameters}
        '''
        result = self._values.get("self_managed_kafka_parameters")
        return typing.cast(typing.Optional["PipesPipeSourceParametersSelfManagedKafkaParameters"], result)

    @builtins.property
    def sqs_queue_parameters(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersSqsQueueParameters"]:
        '''sqs_queue_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqs_queue_parameters PipesPipe#sqs_queue_parameters}
        '''
        result = self._values.get("sqs_queue_parameters")
        return typing.cast(typing.Optional["PipesPipeSourceParametersSqsQueueParameters"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersActivemqBrokerParameters",
    jsii_struct_bases=[],
    name_mapping={
        "credentials": "credentials",
        "queue_name": "queueName",
        "batch_size": "batchSize",
        "maximum_batching_window_in_seconds": "maximumBatchingWindowInSeconds",
    },
)
class PipesPipeSourceParametersActivemqBrokerParameters:
    def __init__(
        self,
        *,
        credentials: typing.Union["PipesPipeSourceParametersActivemqBrokerParametersCredentials", typing.Dict[builtins.str, typing.Any]],
        queue_name: builtins.str,
        batch_size: typing.Optional[jsii.Number] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param credentials: credentials block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
        :param queue_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#queue_name PipesPipe#queue_name}.
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        '''
        if isinstance(credentials, dict):
            credentials = PipesPipeSourceParametersActivemqBrokerParametersCredentials(**credentials)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d55b2cd766db58c0e7eab88ba934ff083f0147a281f6993ded68f00d041c8027)
            check_type(argname="argument credentials", value=credentials, expected_type=type_hints["credentials"])
            check_type(argname="argument queue_name", value=queue_name, expected_type=type_hints["queue_name"])
            check_type(argname="argument batch_size", value=batch_size, expected_type=type_hints["batch_size"])
            check_type(argname="argument maximum_batching_window_in_seconds", value=maximum_batching_window_in_seconds, expected_type=type_hints["maximum_batching_window_in_seconds"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "credentials": credentials,
            "queue_name": queue_name,
        }
        if batch_size is not None:
            self._values["batch_size"] = batch_size
        if maximum_batching_window_in_seconds is not None:
            self._values["maximum_batching_window_in_seconds"] = maximum_batching_window_in_seconds

    @builtins.property
    def credentials(
        self,
    ) -> "PipesPipeSourceParametersActivemqBrokerParametersCredentials":
        '''credentials block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
        '''
        result = self._values.get("credentials")
        assert result is not None, "Required property 'credentials' is missing"
        return typing.cast("PipesPipeSourceParametersActivemqBrokerParametersCredentials", result)

    @builtins.property
    def queue_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#queue_name PipesPipe#queue_name}.'''
        result = self._values.get("queue_name")
        assert result is not None, "Required property 'queue_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def batch_size(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.'''
        result = self._values.get("batch_size")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def maximum_batching_window_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.'''
        result = self._values.get("maximum_batching_window_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersActivemqBrokerParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersActivemqBrokerParametersCredentials",
    jsii_struct_bases=[],
    name_mapping={"basic_auth": "basicAuth"},
)
class PipesPipeSourceParametersActivemqBrokerParametersCredentials:
    def __init__(self, *, basic_auth: builtins.str) -> None:
        '''
        :param basic_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__92457138513fd8e331c29c189da356548843d82dab1dae6d328f98505ea2e48b)
            check_type(argname="argument basic_auth", value=basic_auth, expected_type=type_hints["basic_auth"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "basic_auth": basic_auth,
        }

    @builtins.property
    def basic_auth(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}.'''
        result = self._values.get("basic_auth")
        assert result is not None, "Required property 'basic_auth' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersActivemqBrokerParametersCredentials(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeSourceParametersActivemqBrokerParametersCredentialsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersActivemqBrokerParametersCredentialsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0d8bbfd9bcea0314556a7ddb53bd0e4486fee7be82ef4e011d244c7502389528)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="basicAuthInput")
    def basic_auth_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "basicAuthInput"))

    @builtins.property
    @jsii.member(jsii_name="basicAuth")
    def basic_auth(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "basicAuth"))

    @basic_auth.setter
    def basic_auth(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd5e1f5d8ff6fe4be538f29a766164a34b07beb43f00136e75e584fb9a13ee6b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "basicAuth", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersActivemqBrokerParametersCredentials]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersActivemqBrokerParametersCredentials], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersActivemqBrokerParametersCredentials],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7adc334905fe5734b56382b6d7056dad5e0e2711e96a6666e712e771d782a1e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeSourceParametersActivemqBrokerParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersActivemqBrokerParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__26ba1d51d0648056d4cc2fad9458aa48ceb45b40decbbabd207fa493da798909)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCredentials")
    def put_credentials(self, *, basic_auth: builtins.str) -> None:
        '''
        :param basic_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}.
        '''
        value = PipesPipeSourceParametersActivemqBrokerParametersCredentials(
            basic_auth=basic_auth
        )

        return typing.cast(None, jsii.invoke(self, "putCredentials", [value]))

    @jsii.member(jsii_name="resetBatchSize")
    def reset_batch_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBatchSize", []))

    @jsii.member(jsii_name="resetMaximumBatchingWindowInSeconds")
    def reset_maximum_batching_window_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumBatchingWindowInSeconds", []))

    @builtins.property
    @jsii.member(jsii_name="credentials")
    def credentials(
        self,
    ) -> PipesPipeSourceParametersActivemqBrokerParametersCredentialsOutputReference:
        return typing.cast(PipesPipeSourceParametersActivemqBrokerParametersCredentialsOutputReference, jsii.get(self, "credentials"))

    @builtins.property
    @jsii.member(jsii_name="batchSizeInput")
    def batch_size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "batchSizeInput"))

    @builtins.property
    @jsii.member(jsii_name="credentialsInput")
    def credentials_input(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersActivemqBrokerParametersCredentials]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersActivemqBrokerParametersCredentials], jsii.get(self, "credentialsInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSecondsInput")
    def maximum_batching_window_in_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumBatchingWindowInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="queueNameInput")
    def queue_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "queueNameInput"))

    @builtins.property
    @jsii.member(jsii_name="batchSize")
    def batch_size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "batchSize"))

    @batch_size.setter
    def batch_size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49929e3c7cde7049ddd66df39ae492e77dc7feb737a435578f0fbafefc625854)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "batchSize", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSeconds")
    def maximum_batching_window_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumBatchingWindowInSeconds"))

    @maximum_batching_window_in_seconds.setter
    def maximum_batching_window_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d836db929b1cc83dfc16558c6d80910dcec488f5ca6b059afb5aa340de1e27e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumBatchingWindowInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="queueName")
    def queue_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "queueName"))

    @queue_name.setter
    def queue_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb0d7615a8273ab83243e61c039541472ec452f66a0ebcf9126f1b577f4942e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "queueName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersActivemqBrokerParameters]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersActivemqBrokerParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersActivemqBrokerParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8bc1862a133fac1128a176f2dca1d1a7f273b9c5f93625e294ec051adf4f358)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersDynamodbStreamParameters",
    jsii_struct_bases=[],
    name_mapping={
        "starting_position": "startingPosition",
        "batch_size": "batchSize",
        "dead_letter_config": "deadLetterConfig",
        "maximum_batching_window_in_seconds": "maximumBatchingWindowInSeconds",
        "maximum_record_age_in_seconds": "maximumRecordAgeInSeconds",
        "maximum_retry_attempts": "maximumRetryAttempts",
        "on_partial_batch_item_failure": "onPartialBatchItemFailure",
        "parallelization_factor": "parallelizationFactor",
    },
)
class PipesPipeSourceParametersDynamodbStreamParameters:
    def __init__(
        self,
        *,
        starting_position: builtins.str,
        batch_size: typing.Optional[jsii.Number] = None,
        dead_letter_config: typing.Optional[typing.Union["PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
        maximum_record_age_in_seconds: typing.Optional[jsii.Number] = None,
        maximum_retry_attempts: typing.Optional[jsii.Number] = None,
        on_partial_batch_item_failure: typing.Optional[builtins.str] = None,
        parallelization_factor: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param starting_position: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param dead_letter_config: dead_letter_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dead_letter_config PipesPipe#dead_letter_config}
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        :param maximum_record_age_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_record_age_in_seconds PipesPipe#maximum_record_age_in_seconds}.
        :param maximum_retry_attempts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_retry_attempts PipesPipe#maximum_retry_attempts}.
        :param on_partial_batch_item_failure: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#on_partial_batch_item_failure PipesPipe#on_partial_batch_item_failure}.
        :param parallelization_factor: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parallelization_factor PipesPipe#parallelization_factor}.
        '''
        if isinstance(dead_letter_config, dict):
            dead_letter_config = PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig(**dead_letter_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0687a383db9cdaf0b611a20990baa11ccbb6632fc7c74fba9d18d96d8b855a36)
            check_type(argname="argument starting_position", value=starting_position, expected_type=type_hints["starting_position"])
            check_type(argname="argument batch_size", value=batch_size, expected_type=type_hints["batch_size"])
            check_type(argname="argument dead_letter_config", value=dead_letter_config, expected_type=type_hints["dead_letter_config"])
            check_type(argname="argument maximum_batching_window_in_seconds", value=maximum_batching_window_in_seconds, expected_type=type_hints["maximum_batching_window_in_seconds"])
            check_type(argname="argument maximum_record_age_in_seconds", value=maximum_record_age_in_seconds, expected_type=type_hints["maximum_record_age_in_seconds"])
            check_type(argname="argument maximum_retry_attempts", value=maximum_retry_attempts, expected_type=type_hints["maximum_retry_attempts"])
            check_type(argname="argument on_partial_batch_item_failure", value=on_partial_batch_item_failure, expected_type=type_hints["on_partial_batch_item_failure"])
            check_type(argname="argument parallelization_factor", value=parallelization_factor, expected_type=type_hints["parallelization_factor"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "starting_position": starting_position,
        }
        if batch_size is not None:
            self._values["batch_size"] = batch_size
        if dead_letter_config is not None:
            self._values["dead_letter_config"] = dead_letter_config
        if maximum_batching_window_in_seconds is not None:
            self._values["maximum_batching_window_in_seconds"] = maximum_batching_window_in_seconds
        if maximum_record_age_in_seconds is not None:
            self._values["maximum_record_age_in_seconds"] = maximum_record_age_in_seconds
        if maximum_retry_attempts is not None:
            self._values["maximum_retry_attempts"] = maximum_retry_attempts
        if on_partial_batch_item_failure is not None:
            self._values["on_partial_batch_item_failure"] = on_partial_batch_item_failure
        if parallelization_factor is not None:
            self._values["parallelization_factor"] = parallelization_factor

    @builtins.property
    def starting_position(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.'''
        result = self._values.get("starting_position")
        assert result is not None, "Required property 'starting_position' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def batch_size(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.'''
        result = self._values.get("batch_size")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def dead_letter_config(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig"]:
        '''dead_letter_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dead_letter_config PipesPipe#dead_letter_config}
        '''
        result = self._values.get("dead_letter_config")
        return typing.cast(typing.Optional["PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig"], result)

    @builtins.property
    def maximum_batching_window_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.'''
        result = self._values.get("maximum_batching_window_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def maximum_record_age_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_record_age_in_seconds PipesPipe#maximum_record_age_in_seconds}.'''
        result = self._values.get("maximum_record_age_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def maximum_retry_attempts(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_retry_attempts PipesPipe#maximum_retry_attempts}.'''
        result = self._values.get("maximum_retry_attempts")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def on_partial_batch_item_failure(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#on_partial_batch_item_failure PipesPipe#on_partial_batch_item_failure}.'''
        result = self._values.get("on_partial_batch_item_failure")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def parallelization_factor(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parallelization_factor PipesPipe#parallelization_factor}.'''
        result = self._values.get("parallelization_factor")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersDynamodbStreamParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig",
    jsii_struct_bases=[],
    name_mapping={"arn": "arn"},
)
class PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig:
    def __init__(self, *, arn: typing.Optional[builtins.str] = None) -> None:
        '''
        :param arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#arn PipesPipe#arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3e07dd2f3bd5f02ddfd0d3b1a07903fdf53555683e634c0f0228f5c1e4320df)
            check_type(argname="argument arn", value=arn, expected_type=type_hints["arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if arn is not None:
            self._values["arn"] = arn

    @builtins.property
    def arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#arn PipesPipe#arn}.'''
        result = self._values.get("arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3f9e8a11b5438a0246bcb0e54b557dbcb816bc69d942a4b81cff953617e504ac)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetArn")
    def reset_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetArn", []))

    @builtins.property
    @jsii.member(jsii_name="arnInput")
    def arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "arnInput"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @arn.setter
    def arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__19bc24623aaf63b6e7744d49ecbac349eeb2a797b229fea25bf6c00f9e942ea3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "arn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e9693fe51d2e6a8100dc064632f25485620adf5fe3b12d1b876f6447ec759f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeSourceParametersDynamodbStreamParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersDynamodbStreamParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f286ba7778c20d61f6987748b6e996216dfc8acaad93dab7146a7b7eaf9a4b37)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDeadLetterConfig")
    def put_dead_letter_config(
        self,
        *,
        arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#arn PipesPipe#arn}.
        '''
        value = PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig(
            arn=arn
        )

        return typing.cast(None, jsii.invoke(self, "putDeadLetterConfig", [value]))

    @jsii.member(jsii_name="resetBatchSize")
    def reset_batch_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBatchSize", []))

    @jsii.member(jsii_name="resetDeadLetterConfig")
    def reset_dead_letter_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeadLetterConfig", []))

    @jsii.member(jsii_name="resetMaximumBatchingWindowInSeconds")
    def reset_maximum_batching_window_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumBatchingWindowInSeconds", []))

    @jsii.member(jsii_name="resetMaximumRecordAgeInSeconds")
    def reset_maximum_record_age_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumRecordAgeInSeconds", []))

    @jsii.member(jsii_name="resetMaximumRetryAttempts")
    def reset_maximum_retry_attempts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumRetryAttempts", []))

    @jsii.member(jsii_name="resetOnPartialBatchItemFailure")
    def reset_on_partial_batch_item_failure(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnPartialBatchItemFailure", []))

    @jsii.member(jsii_name="resetParallelizationFactor")
    def reset_parallelization_factor(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetParallelizationFactor", []))

    @builtins.property
    @jsii.member(jsii_name="deadLetterConfig")
    def dead_letter_config(
        self,
    ) -> PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfigOutputReference:
        return typing.cast(PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfigOutputReference, jsii.get(self, "deadLetterConfig"))

    @builtins.property
    @jsii.member(jsii_name="batchSizeInput")
    def batch_size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "batchSizeInput"))

    @builtins.property
    @jsii.member(jsii_name="deadLetterConfigInput")
    def dead_letter_config_input(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig], jsii.get(self, "deadLetterConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSecondsInput")
    def maximum_batching_window_in_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumBatchingWindowInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumRecordAgeInSecondsInput")
    def maximum_record_age_in_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumRecordAgeInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumRetryAttemptsInput")
    def maximum_retry_attempts_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumRetryAttemptsInput"))

    @builtins.property
    @jsii.member(jsii_name="onPartialBatchItemFailureInput")
    def on_partial_batch_item_failure_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "onPartialBatchItemFailureInput"))

    @builtins.property
    @jsii.member(jsii_name="parallelizationFactorInput")
    def parallelization_factor_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "parallelizationFactorInput"))

    @builtins.property
    @jsii.member(jsii_name="startingPositionInput")
    def starting_position_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startingPositionInput"))

    @builtins.property
    @jsii.member(jsii_name="batchSize")
    def batch_size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "batchSize"))

    @batch_size.setter
    def batch_size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4eeb3a39acd20ef8c146b243248c51974aba64913b5954926a574917aeb9e404)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "batchSize", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSeconds")
    def maximum_batching_window_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumBatchingWindowInSeconds"))

    @maximum_batching_window_in_seconds.setter
    def maximum_batching_window_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__011947d897b3186d7650aed26a6c0ccabc3a2b8ef25aa9313b289de2eb1f6b72)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumBatchingWindowInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumRecordAgeInSeconds")
    def maximum_record_age_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumRecordAgeInSeconds"))

    @maximum_record_age_in_seconds.setter
    def maximum_record_age_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fbee289e529ab01410e77224acfecc9cc7390e7ec55d05270853713d1e403549)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumRecordAgeInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumRetryAttempts")
    def maximum_retry_attempts(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumRetryAttempts"))

    @maximum_retry_attempts.setter
    def maximum_retry_attempts(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bdaa72efb0577dc419d9e4d2583f0507f963d568e91f45f37efe1b2c795f9cae)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumRetryAttempts", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onPartialBatchItemFailure")
    def on_partial_batch_item_failure(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "onPartialBatchItemFailure"))

    @on_partial_batch_item_failure.setter
    def on_partial_batch_item_failure(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d8b861946f998055bbcae39c4723c079d7f344c58b2f71620dc6fc0842a81b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onPartialBatchItemFailure", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="parallelizationFactor")
    def parallelization_factor(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "parallelizationFactor"))

    @parallelization_factor.setter
    def parallelization_factor(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff51be4e574481f889a1218b6f26db6f7df8ba7e02e5b0f3f58681b797a17d9d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "parallelizationFactor", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startingPosition")
    def starting_position(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startingPosition"))

    @starting_position.setter
    def starting_position(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e49815aee67e1b5f36412d4e58a0af07c910abb7f62c37d9329af01fe1ef53c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startingPosition", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersDynamodbStreamParameters]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersDynamodbStreamParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersDynamodbStreamParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__901482e7defbe2379adf48585ef851b3de98feb29c98b823b1df605a55010093)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersFilterCriteria",
    jsii_struct_bases=[],
    name_mapping={"filter": "filter"},
)
class PipesPipeSourceParametersFilterCriteria:
    def __init__(
        self,
        *,
        filter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeSourceParametersFilterCriteriaFilter", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param filter: filter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#filter PipesPipe#filter}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9856f42e2d449ba9002d8d54108b21a151ec50125c0d2c7e8edb15b82f16ba31)
            check_type(argname="argument filter", value=filter, expected_type=type_hints["filter"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if filter is not None:
            self._values["filter"] = filter

    @builtins.property
    def filter(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeSourceParametersFilterCriteriaFilter"]]]:
        '''filter block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#filter PipesPipe#filter}
        '''
        result = self._values.get("filter")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeSourceParametersFilterCriteriaFilter"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersFilterCriteria(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersFilterCriteriaFilter",
    jsii_struct_bases=[],
    name_mapping={"pattern": "pattern"},
)
class PipesPipeSourceParametersFilterCriteriaFilter:
    def __init__(self, *, pattern: builtins.str) -> None:
        '''
        :param pattern: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#pattern PipesPipe#pattern}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ad8c73d81c99f61eec0d7f8e17db44f8bc38a916a6ac32675235185713d1eac8)
            check_type(argname="argument pattern", value=pattern, expected_type=type_hints["pattern"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "pattern": pattern,
        }

    @builtins.property
    def pattern(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#pattern PipesPipe#pattern}.'''
        result = self._values.get("pattern")
        assert result is not None, "Required property 'pattern' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersFilterCriteriaFilter(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeSourceParametersFilterCriteriaFilterList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersFilterCriteriaFilterList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__25d41abe05ea17d427e73d3aa70a4620e9fa011ca89361df01430a402a93ad63)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeSourceParametersFilterCriteriaFilterOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b0c6aca63ce0f36728a088351d561b4a188e0b81537e01370a6f8e6135514b67)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeSourceParametersFilterCriteriaFilterOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dbac4168ddfc80183734bf1c37eb090218be3bf32db6a5c744bf39a9c23d8568)
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
            type_hints = typing.get_type_hints(_typecheckingstub__757ff1518314ebe127b8dc351a41bf7c55b8896831908ba491773cb03ab83644)
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
            type_hints = typing.get_type_hints(_typecheckingstub__821c6eeb9fb7136f692caae59be6897283b47d9faf0d0f3561ca76b572021ed8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeSourceParametersFilterCriteriaFilter]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeSourceParametersFilterCriteriaFilter]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeSourceParametersFilterCriteriaFilter]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e246c549e80a4347af098ba9ad31c36cb4b87b7f0471145f23aa4ea366791c82)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeSourceParametersFilterCriteriaFilterOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersFilterCriteriaFilterOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__13c16beb42c7e6888de0683c89246749419e4b89dd1fa5251f452213f47d671a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="patternInput")
    def pattern_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "patternInput"))

    @builtins.property
    @jsii.member(jsii_name="pattern")
    def pattern(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "pattern"))

    @pattern.setter
    def pattern(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6b3aaffc6167c89dbbe2c7239eda771fd95eedaa62a7d3fdb566ad871ae844e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "pattern", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeSourceParametersFilterCriteriaFilter]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeSourceParametersFilterCriteriaFilter]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeSourceParametersFilterCriteriaFilter]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__179e74b8c703bd09eda1a53889047beb3bbd58bc66b959f2c47bdc425dcf086d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeSourceParametersFilterCriteriaOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersFilterCriteriaOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d2ffaea0067dea924530cd47524988e5155226ba4bdeeafdb40b5d539e6686e1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putFilter")
    def put_filter(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeSourceParametersFilterCriteriaFilter, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bfd345a60a35d66ddcc81d254b7aa037251575eec3a0a7f4aa7e352096f8636a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFilter", [value]))

    @jsii.member(jsii_name="resetFilter")
    def reset_filter(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilter", []))

    @builtins.property
    @jsii.member(jsii_name="filter")
    def filter(self) -> PipesPipeSourceParametersFilterCriteriaFilterList:
        return typing.cast(PipesPipeSourceParametersFilterCriteriaFilterList, jsii.get(self, "filter"))

    @builtins.property
    @jsii.member(jsii_name="filterInput")
    def filter_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeSourceParametersFilterCriteriaFilter]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeSourceParametersFilterCriteriaFilter]]], jsii.get(self, "filterInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersFilterCriteria]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersFilterCriteria], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersFilterCriteria],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8201869cf245198fd4eb0d608a0e49131f660466bc4b63e926dea5220633ae17)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersKinesisStreamParameters",
    jsii_struct_bases=[],
    name_mapping={
        "starting_position": "startingPosition",
        "batch_size": "batchSize",
        "dead_letter_config": "deadLetterConfig",
        "maximum_batching_window_in_seconds": "maximumBatchingWindowInSeconds",
        "maximum_record_age_in_seconds": "maximumRecordAgeInSeconds",
        "maximum_retry_attempts": "maximumRetryAttempts",
        "on_partial_batch_item_failure": "onPartialBatchItemFailure",
        "parallelization_factor": "parallelizationFactor",
        "starting_position_timestamp": "startingPositionTimestamp",
    },
)
class PipesPipeSourceParametersKinesisStreamParameters:
    def __init__(
        self,
        *,
        starting_position: builtins.str,
        batch_size: typing.Optional[jsii.Number] = None,
        dead_letter_config: typing.Optional[typing.Union["PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
        maximum_record_age_in_seconds: typing.Optional[jsii.Number] = None,
        maximum_retry_attempts: typing.Optional[jsii.Number] = None,
        on_partial_batch_item_failure: typing.Optional[builtins.str] = None,
        parallelization_factor: typing.Optional[jsii.Number] = None,
        starting_position_timestamp: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param starting_position: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param dead_letter_config: dead_letter_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dead_letter_config PipesPipe#dead_letter_config}
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        :param maximum_record_age_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_record_age_in_seconds PipesPipe#maximum_record_age_in_seconds}.
        :param maximum_retry_attempts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_retry_attempts PipesPipe#maximum_retry_attempts}.
        :param on_partial_batch_item_failure: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#on_partial_batch_item_failure PipesPipe#on_partial_batch_item_failure}.
        :param parallelization_factor: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parallelization_factor PipesPipe#parallelization_factor}.
        :param starting_position_timestamp: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position_timestamp PipesPipe#starting_position_timestamp}.
        '''
        if isinstance(dead_letter_config, dict):
            dead_letter_config = PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig(**dead_letter_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f5f95a126e313490d27a7f201850a6698c578b3f4bfa815cfb417bf9c68a8bd5)
            check_type(argname="argument starting_position", value=starting_position, expected_type=type_hints["starting_position"])
            check_type(argname="argument batch_size", value=batch_size, expected_type=type_hints["batch_size"])
            check_type(argname="argument dead_letter_config", value=dead_letter_config, expected_type=type_hints["dead_letter_config"])
            check_type(argname="argument maximum_batching_window_in_seconds", value=maximum_batching_window_in_seconds, expected_type=type_hints["maximum_batching_window_in_seconds"])
            check_type(argname="argument maximum_record_age_in_seconds", value=maximum_record_age_in_seconds, expected_type=type_hints["maximum_record_age_in_seconds"])
            check_type(argname="argument maximum_retry_attempts", value=maximum_retry_attempts, expected_type=type_hints["maximum_retry_attempts"])
            check_type(argname="argument on_partial_batch_item_failure", value=on_partial_batch_item_failure, expected_type=type_hints["on_partial_batch_item_failure"])
            check_type(argname="argument parallelization_factor", value=parallelization_factor, expected_type=type_hints["parallelization_factor"])
            check_type(argname="argument starting_position_timestamp", value=starting_position_timestamp, expected_type=type_hints["starting_position_timestamp"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "starting_position": starting_position,
        }
        if batch_size is not None:
            self._values["batch_size"] = batch_size
        if dead_letter_config is not None:
            self._values["dead_letter_config"] = dead_letter_config
        if maximum_batching_window_in_seconds is not None:
            self._values["maximum_batching_window_in_seconds"] = maximum_batching_window_in_seconds
        if maximum_record_age_in_seconds is not None:
            self._values["maximum_record_age_in_seconds"] = maximum_record_age_in_seconds
        if maximum_retry_attempts is not None:
            self._values["maximum_retry_attempts"] = maximum_retry_attempts
        if on_partial_batch_item_failure is not None:
            self._values["on_partial_batch_item_failure"] = on_partial_batch_item_failure
        if parallelization_factor is not None:
            self._values["parallelization_factor"] = parallelization_factor
        if starting_position_timestamp is not None:
            self._values["starting_position_timestamp"] = starting_position_timestamp

    @builtins.property
    def starting_position(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.'''
        result = self._values.get("starting_position")
        assert result is not None, "Required property 'starting_position' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def batch_size(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.'''
        result = self._values.get("batch_size")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def dead_letter_config(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig"]:
        '''dead_letter_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dead_letter_config PipesPipe#dead_letter_config}
        '''
        result = self._values.get("dead_letter_config")
        return typing.cast(typing.Optional["PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig"], result)

    @builtins.property
    def maximum_batching_window_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.'''
        result = self._values.get("maximum_batching_window_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def maximum_record_age_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_record_age_in_seconds PipesPipe#maximum_record_age_in_seconds}.'''
        result = self._values.get("maximum_record_age_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def maximum_retry_attempts(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_retry_attempts PipesPipe#maximum_retry_attempts}.'''
        result = self._values.get("maximum_retry_attempts")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def on_partial_batch_item_failure(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#on_partial_batch_item_failure PipesPipe#on_partial_batch_item_failure}.'''
        result = self._values.get("on_partial_batch_item_failure")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def parallelization_factor(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parallelization_factor PipesPipe#parallelization_factor}.'''
        result = self._values.get("parallelization_factor")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def starting_position_timestamp(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position_timestamp PipesPipe#starting_position_timestamp}.'''
        result = self._values.get("starting_position_timestamp")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersKinesisStreamParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig",
    jsii_struct_bases=[],
    name_mapping={"arn": "arn"},
)
class PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig:
    def __init__(self, *, arn: typing.Optional[builtins.str] = None) -> None:
        '''
        :param arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#arn PipesPipe#arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__74ea332862b7f8ee72669b89a407ddd61ad126fdfeb1f3fa7c867066fda6f825)
            check_type(argname="argument arn", value=arn, expected_type=type_hints["arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if arn is not None:
            self._values["arn"] = arn

    @builtins.property
    def arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#arn PipesPipe#arn}.'''
        result = self._values.get("arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__031c618e35ba0c64db5e617e385eadd07c17dbe97248e8cef8817d3e69be8fba)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetArn")
    def reset_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetArn", []))

    @builtins.property
    @jsii.member(jsii_name="arnInput")
    def arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "arnInput"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @arn.setter
    def arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__94460ebeafa0c3abfbc28921bd09bc56954e1f0266486ba1d7195e3441d040b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "arn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1be3d2130c1e363302b9ae969c447115671bc48704f8bbaf59ab2abfc144be2b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeSourceParametersKinesisStreamParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersKinesisStreamParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__221a640a9d0a57a7a5aa24a87a5348f71a8f3d9fbf3962ea4249cf05b0e77e17)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDeadLetterConfig")
    def put_dead_letter_config(
        self,
        *,
        arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#arn PipesPipe#arn}.
        '''
        value = PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig(
            arn=arn
        )

        return typing.cast(None, jsii.invoke(self, "putDeadLetterConfig", [value]))

    @jsii.member(jsii_name="resetBatchSize")
    def reset_batch_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBatchSize", []))

    @jsii.member(jsii_name="resetDeadLetterConfig")
    def reset_dead_letter_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeadLetterConfig", []))

    @jsii.member(jsii_name="resetMaximumBatchingWindowInSeconds")
    def reset_maximum_batching_window_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumBatchingWindowInSeconds", []))

    @jsii.member(jsii_name="resetMaximumRecordAgeInSeconds")
    def reset_maximum_record_age_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumRecordAgeInSeconds", []))

    @jsii.member(jsii_name="resetMaximumRetryAttempts")
    def reset_maximum_retry_attempts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumRetryAttempts", []))

    @jsii.member(jsii_name="resetOnPartialBatchItemFailure")
    def reset_on_partial_batch_item_failure(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnPartialBatchItemFailure", []))

    @jsii.member(jsii_name="resetParallelizationFactor")
    def reset_parallelization_factor(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetParallelizationFactor", []))

    @jsii.member(jsii_name="resetStartingPositionTimestamp")
    def reset_starting_position_timestamp(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStartingPositionTimestamp", []))

    @builtins.property
    @jsii.member(jsii_name="deadLetterConfig")
    def dead_letter_config(
        self,
    ) -> PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfigOutputReference:
        return typing.cast(PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfigOutputReference, jsii.get(self, "deadLetterConfig"))

    @builtins.property
    @jsii.member(jsii_name="batchSizeInput")
    def batch_size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "batchSizeInput"))

    @builtins.property
    @jsii.member(jsii_name="deadLetterConfigInput")
    def dead_letter_config_input(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig], jsii.get(self, "deadLetterConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSecondsInput")
    def maximum_batching_window_in_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumBatchingWindowInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumRecordAgeInSecondsInput")
    def maximum_record_age_in_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumRecordAgeInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumRetryAttemptsInput")
    def maximum_retry_attempts_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumRetryAttemptsInput"))

    @builtins.property
    @jsii.member(jsii_name="onPartialBatchItemFailureInput")
    def on_partial_batch_item_failure_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "onPartialBatchItemFailureInput"))

    @builtins.property
    @jsii.member(jsii_name="parallelizationFactorInput")
    def parallelization_factor_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "parallelizationFactorInput"))

    @builtins.property
    @jsii.member(jsii_name="startingPositionInput")
    def starting_position_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startingPositionInput"))

    @builtins.property
    @jsii.member(jsii_name="startingPositionTimestampInput")
    def starting_position_timestamp_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startingPositionTimestampInput"))

    @builtins.property
    @jsii.member(jsii_name="batchSize")
    def batch_size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "batchSize"))

    @batch_size.setter
    def batch_size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b055fae94e3942c005f07f9f94efc0203bb21becfc44366d8190005de680b079)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "batchSize", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSeconds")
    def maximum_batching_window_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumBatchingWindowInSeconds"))

    @maximum_batching_window_in_seconds.setter
    def maximum_batching_window_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ccb81546cbd3b5bdf1140d554641fa633d4da580e036c0cfa9de5e93ef758b21)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumBatchingWindowInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumRecordAgeInSeconds")
    def maximum_record_age_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumRecordAgeInSeconds"))

    @maximum_record_age_in_seconds.setter
    def maximum_record_age_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__abdc9c142f8b309296e5afae3e025db82f640154008fea431dab1a0f98d5789d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumRecordAgeInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumRetryAttempts")
    def maximum_retry_attempts(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumRetryAttempts"))

    @maximum_retry_attempts.setter
    def maximum_retry_attempts(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0cf0ebcb5ed8a9b181e85a428ee295f45a791f873daef0e699ffcf3b14d977d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumRetryAttempts", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onPartialBatchItemFailure")
    def on_partial_batch_item_failure(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "onPartialBatchItemFailure"))

    @on_partial_batch_item_failure.setter
    def on_partial_batch_item_failure(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__53b1d10a90f4b40755d677885bc2eb9d61ec5b399275fa1b8085c027d36dc9e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onPartialBatchItemFailure", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="parallelizationFactor")
    def parallelization_factor(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "parallelizationFactor"))

    @parallelization_factor.setter
    def parallelization_factor(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__adc7d7710e9c7cede762e77a7037996cb76bbfb2cb41b9d4fe320118feaa6ea7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "parallelizationFactor", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startingPosition")
    def starting_position(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startingPosition"))

    @starting_position.setter
    def starting_position(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__44c961654c9c66a1bc2e9f4fd2f9dd0529cde44bfbb441aff48ea7be01e9c72a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startingPosition", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startingPositionTimestamp")
    def starting_position_timestamp(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startingPositionTimestamp"))

    @starting_position_timestamp.setter
    def starting_position_timestamp(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dbd774f3b083140291800de2d6365936a5371ea51b65d37e794e89a555f6c03e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startingPositionTimestamp", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersKinesisStreamParameters]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersKinesisStreamParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersKinesisStreamParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae1e0b8294246678fbdb4538770e0c605a67043a9df3f4ea689042c4076b44b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersManagedStreamingKafkaParameters",
    jsii_struct_bases=[],
    name_mapping={
        "topic_name": "topicName",
        "batch_size": "batchSize",
        "consumer_group_id": "consumerGroupId",
        "credentials": "credentials",
        "maximum_batching_window_in_seconds": "maximumBatchingWindowInSeconds",
        "starting_position": "startingPosition",
    },
)
class PipesPipeSourceParametersManagedStreamingKafkaParameters:
    def __init__(
        self,
        *,
        topic_name: builtins.str,
        batch_size: typing.Optional[jsii.Number] = None,
        consumer_group_id: typing.Optional[builtins.str] = None,
        credentials: typing.Optional[typing.Union["PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials", typing.Dict[builtins.str, typing.Any]]] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
        starting_position: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param topic_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#topic_name PipesPipe#topic_name}.
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param consumer_group_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#consumer_group_id PipesPipe#consumer_group_id}.
        :param credentials: credentials block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        :param starting_position: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
        '''
        if isinstance(credentials, dict):
            credentials = PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials(**credentials)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3e11123d9383a36597eb7b57f9a75fe4ede7ae97f9aeb08141d664664dc2de0)
            check_type(argname="argument topic_name", value=topic_name, expected_type=type_hints["topic_name"])
            check_type(argname="argument batch_size", value=batch_size, expected_type=type_hints["batch_size"])
            check_type(argname="argument consumer_group_id", value=consumer_group_id, expected_type=type_hints["consumer_group_id"])
            check_type(argname="argument credentials", value=credentials, expected_type=type_hints["credentials"])
            check_type(argname="argument maximum_batching_window_in_seconds", value=maximum_batching_window_in_seconds, expected_type=type_hints["maximum_batching_window_in_seconds"])
            check_type(argname="argument starting_position", value=starting_position, expected_type=type_hints["starting_position"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "topic_name": topic_name,
        }
        if batch_size is not None:
            self._values["batch_size"] = batch_size
        if consumer_group_id is not None:
            self._values["consumer_group_id"] = consumer_group_id
        if credentials is not None:
            self._values["credentials"] = credentials
        if maximum_batching_window_in_seconds is not None:
            self._values["maximum_batching_window_in_seconds"] = maximum_batching_window_in_seconds
        if starting_position is not None:
            self._values["starting_position"] = starting_position

    @builtins.property
    def topic_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#topic_name PipesPipe#topic_name}.'''
        result = self._values.get("topic_name")
        assert result is not None, "Required property 'topic_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def batch_size(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.'''
        result = self._values.get("batch_size")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def consumer_group_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#consumer_group_id PipesPipe#consumer_group_id}.'''
        result = self._values.get("consumer_group_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def credentials(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials"]:
        '''credentials block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
        '''
        result = self._values.get("credentials")
        return typing.cast(typing.Optional["PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials"], result)

    @builtins.property
    def maximum_batching_window_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.'''
        result = self._values.get("maximum_batching_window_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def starting_position(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.'''
        result = self._values.get("starting_position")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersManagedStreamingKafkaParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials",
    jsii_struct_bases=[],
    name_mapping={
        "client_certificate_tls_auth": "clientCertificateTlsAuth",
        "sasl_scram512_auth": "saslScram512Auth",
    },
)
class PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials:
    def __init__(
        self,
        *,
        client_certificate_tls_auth: typing.Optional[builtins.str] = None,
        sasl_scram512_auth: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param client_certificate_tls_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#client_certificate_tls_auth PipesPipe#client_certificate_tls_auth}.
        :param sasl_scram512_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_512_auth PipesPipe#sasl_scram_512_auth}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__45d3438104698004079d511ed541d41fdc42b2b2f0be095ce812603313cda294)
            check_type(argname="argument client_certificate_tls_auth", value=client_certificate_tls_auth, expected_type=type_hints["client_certificate_tls_auth"])
            check_type(argname="argument sasl_scram512_auth", value=sasl_scram512_auth, expected_type=type_hints["sasl_scram512_auth"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if client_certificate_tls_auth is not None:
            self._values["client_certificate_tls_auth"] = client_certificate_tls_auth
        if sasl_scram512_auth is not None:
            self._values["sasl_scram512_auth"] = sasl_scram512_auth

    @builtins.property
    def client_certificate_tls_auth(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#client_certificate_tls_auth PipesPipe#client_certificate_tls_auth}.'''
        result = self._values.get("client_certificate_tls_auth")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sasl_scram512_auth(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_512_auth PipesPipe#sasl_scram_512_auth}.'''
        result = self._values.get("sasl_scram512_auth")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeSourceParametersManagedStreamingKafkaParametersCredentialsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersManagedStreamingKafkaParametersCredentialsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__715d65dd58333451343facf133b2554ded4631040acb6a60273128b7edb21787)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetClientCertificateTlsAuth")
    def reset_client_certificate_tls_auth(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetClientCertificateTlsAuth", []))

    @jsii.member(jsii_name="resetSaslScram512Auth")
    def reset_sasl_scram512_auth(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSaslScram512Auth", []))

    @builtins.property
    @jsii.member(jsii_name="clientCertificateTlsAuthInput")
    def client_certificate_tls_auth_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "clientCertificateTlsAuthInput"))

    @builtins.property
    @jsii.member(jsii_name="saslScram512AuthInput")
    def sasl_scram512_auth_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "saslScram512AuthInput"))

    @builtins.property
    @jsii.member(jsii_name="clientCertificateTlsAuth")
    def client_certificate_tls_auth(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "clientCertificateTlsAuth"))

    @client_certificate_tls_auth.setter
    def client_certificate_tls_auth(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__671291adff4a2dfca0332630f834ad35937e866edf5b1d68f27230a2ddd00584)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "clientCertificateTlsAuth", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="saslScram512Auth")
    def sasl_scram512_auth(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "saslScram512Auth"))

    @sasl_scram512_auth.setter
    def sasl_scram512_auth(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86a36f98a948cd46ef019b37c40c486041076a8dae4f006304c0d6b29bbbcadd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "saslScram512Auth", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4f21556764fed2e96d0f00e3857fbe24fe8d76aa9452cc07d7120a34f6174fc9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeSourceParametersManagedStreamingKafkaParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersManagedStreamingKafkaParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5c373615458ac9aca86599682f03de4ef6c3c690eceb61f0b5174c3671512fcb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCredentials")
    def put_credentials(
        self,
        *,
        client_certificate_tls_auth: typing.Optional[builtins.str] = None,
        sasl_scram512_auth: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param client_certificate_tls_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#client_certificate_tls_auth PipesPipe#client_certificate_tls_auth}.
        :param sasl_scram512_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_512_auth PipesPipe#sasl_scram_512_auth}.
        '''
        value = PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials(
            client_certificate_tls_auth=client_certificate_tls_auth,
            sasl_scram512_auth=sasl_scram512_auth,
        )

        return typing.cast(None, jsii.invoke(self, "putCredentials", [value]))

    @jsii.member(jsii_name="resetBatchSize")
    def reset_batch_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBatchSize", []))

    @jsii.member(jsii_name="resetConsumerGroupId")
    def reset_consumer_group_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConsumerGroupId", []))

    @jsii.member(jsii_name="resetCredentials")
    def reset_credentials(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCredentials", []))

    @jsii.member(jsii_name="resetMaximumBatchingWindowInSeconds")
    def reset_maximum_batching_window_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumBatchingWindowInSeconds", []))

    @jsii.member(jsii_name="resetStartingPosition")
    def reset_starting_position(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStartingPosition", []))

    @builtins.property
    @jsii.member(jsii_name="credentials")
    def credentials(
        self,
    ) -> PipesPipeSourceParametersManagedStreamingKafkaParametersCredentialsOutputReference:
        return typing.cast(PipesPipeSourceParametersManagedStreamingKafkaParametersCredentialsOutputReference, jsii.get(self, "credentials"))

    @builtins.property
    @jsii.member(jsii_name="batchSizeInput")
    def batch_size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "batchSizeInput"))

    @builtins.property
    @jsii.member(jsii_name="consumerGroupIdInput")
    def consumer_group_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "consumerGroupIdInput"))

    @builtins.property
    @jsii.member(jsii_name="credentialsInput")
    def credentials_input(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials], jsii.get(self, "credentialsInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSecondsInput")
    def maximum_batching_window_in_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumBatchingWindowInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="startingPositionInput")
    def starting_position_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startingPositionInput"))

    @builtins.property
    @jsii.member(jsii_name="topicNameInput")
    def topic_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "topicNameInput"))

    @builtins.property
    @jsii.member(jsii_name="batchSize")
    def batch_size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "batchSize"))

    @batch_size.setter
    def batch_size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e06777520ad417734f939c4a308e2b189bac59cac8da97e9f3cbca16c96edc54)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "batchSize", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="consumerGroupId")
    def consumer_group_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "consumerGroupId"))

    @consumer_group_id.setter
    def consumer_group_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__237177ab239a3c80e8deae0cedc5b88124abe094542b40e08fba993a2cc695fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "consumerGroupId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSeconds")
    def maximum_batching_window_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumBatchingWindowInSeconds"))

    @maximum_batching_window_in_seconds.setter
    def maximum_batching_window_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f29b47895a6656b2783d3f1846618258825633516546e3cd6c2ca95684307a95)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumBatchingWindowInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startingPosition")
    def starting_position(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startingPosition"))

    @starting_position.setter
    def starting_position(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__88eccf6a8504b9f93e1a6709bcb875f0a3a38fb054d18ff6052f304b62fb65df)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startingPosition", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="topicName")
    def topic_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "topicName"))

    @topic_name.setter
    def topic_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ef883d17345ab9bc1e55a266a303718e81e72d0613624f07d182a0e5101a9ebc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "topicName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersManagedStreamingKafkaParameters]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersManagedStreamingKafkaParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersManagedStreamingKafkaParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bc3189b1a6d52bdd2f4ae86e5836b37bf304714b4914bfc22159d725b291b90f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeSourceParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__66e2329907fb1d3acac80c64b1f0409e3ade33f24465ee75e911ad36a5dc9fb4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putActivemqBrokerParameters")
    def put_activemq_broker_parameters(
        self,
        *,
        credentials: typing.Union[PipesPipeSourceParametersActivemqBrokerParametersCredentials, typing.Dict[builtins.str, typing.Any]],
        queue_name: builtins.str,
        batch_size: typing.Optional[jsii.Number] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param credentials: credentials block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
        :param queue_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#queue_name PipesPipe#queue_name}.
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        '''
        value = PipesPipeSourceParametersActivemqBrokerParameters(
            credentials=credentials,
            queue_name=queue_name,
            batch_size=batch_size,
            maximum_batching_window_in_seconds=maximum_batching_window_in_seconds,
        )

        return typing.cast(None, jsii.invoke(self, "putActivemqBrokerParameters", [value]))

    @jsii.member(jsii_name="putDynamodbStreamParameters")
    def put_dynamodb_stream_parameters(
        self,
        *,
        starting_position: builtins.str,
        batch_size: typing.Optional[jsii.Number] = None,
        dead_letter_config: typing.Optional[typing.Union[PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig, typing.Dict[builtins.str, typing.Any]]] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
        maximum_record_age_in_seconds: typing.Optional[jsii.Number] = None,
        maximum_retry_attempts: typing.Optional[jsii.Number] = None,
        on_partial_batch_item_failure: typing.Optional[builtins.str] = None,
        parallelization_factor: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param starting_position: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param dead_letter_config: dead_letter_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dead_letter_config PipesPipe#dead_letter_config}
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        :param maximum_record_age_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_record_age_in_seconds PipesPipe#maximum_record_age_in_seconds}.
        :param maximum_retry_attempts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_retry_attempts PipesPipe#maximum_retry_attempts}.
        :param on_partial_batch_item_failure: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#on_partial_batch_item_failure PipesPipe#on_partial_batch_item_failure}.
        :param parallelization_factor: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parallelization_factor PipesPipe#parallelization_factor}.
        '''
        value = PipesPipeSourceParametersDynamodbStreamParameters(
            starting_position=starting_position,
            batch_size=batch_size,
            dead_letter_config=dead_letter_config,
            maximum_batching_window_in_seconds=maximum_batching_window_in_seconds,
            maximum_record_age_in_seconds=maximum_record_age_in_seconds,
            maximum_retry_attempts=maximum_retry_attempts,
            on_partial_batch_item_failure=on_partial_batch_item_failure,
            parallelization_factor=parallelization_factor,
        )

        return typing.cast(None, jsii.invoke(self, "putDynamodbStreamParameters", [value]))

    @jsii.member(jsii_name="putFilterCriteria")
    def put_filter_criteria(
        self,
        *,
        filter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeSourceParametersFilterCriteriaFilter, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param filter: filter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#filter PipesPipe#filter}
        '''
        value = PipesPipeSourceParametersFilterCriteria(filter=filter)

        return typing.cast(None, jsii.invoke(self, "putFilterCriteria", [value]))

    @jsii.member(jsii_name="putKinesisStreamParameters")
    def put_kinesis_stream_parameters(
        self,
        *,
        starting_position: builtins.str,
        batch_size: typing.Optional[jsii.Number] = None,
        dead_letter_config: typing.Optional[typing.Union[PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig, typing.Dict[builtins.str, typing.Any]]] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
        maximum_record_age_in_seconds: typing.Optional[jsii.Number] = None,
        maximum_retry_attempts: typing.Optional[jsii.Number] = None,
        on_partial_batch_item_failure: typing.Optional[builtins.str] = None,
        parallelization_factor: typing.Optional[jsii.Number] = None,
        starting_position_timestamp: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param starting_position: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param dead_letter_config: dead_letter_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dead_letter_config PipesPipe#dead_letter_config}
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        :param maximum_record_age_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_record_age_in_seconds PipesPipe#maximum_record_age_in_seconds}.
        :param maximum_retry_attempts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_retry_attempts PipesPipe#maximum_retry_attempts}.
        :param on_partial_batch_item_failure: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#on_partial_batch_item_failure PipesPipe#on_partial_batch_item_failure}.
        :param parallelization_factor: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parallelization_factor PipesPipe#parallelization_factor}.
        :param starting_position_timestamp: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position_timestamp PipesPipe#starting_position_timestamp}.
        '''
        value = PipesPipeSourceParametersKinesisStreamParameters(
            starting_position=starting_position,
            batch_size=batch_size,
            dead_letter_config=dead_letter_config,
            maximum_batching_window_in_seconds=maximum_batching_window_in_seconds,
            maximum_record_age_in_seconds=maximum_record_age_in_seconds,
            maximum_retry_attempts=maximum_retry_attempts,
            on_partial_batch_item_failure=on_partial_batch_item_failure,
            parallelization_factor=parallelization_factor,
            starting_position_timestamp=starting_position_timestamp,
        )

        return typing.cast(None, jsii.invoke(self, "putKinesisStreamParameters", [value]))

    @jsii.member(jsii_name="putManagedStreamingKafkaParameters")
    def put_managed_streaming_kafka_parameters(
        self,
        *,
        topic_name: builtins.str,
        batch_size: typing.Optional[jsii.Number] = None,
        consumer_group_id: typing.Optional[builtins.str] = None,
        credentials: typing.Optional[typing.Union[PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials, typing.Dict[builtins.str, typing.Any]]] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
        starting_position: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param topic_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#topic_name PipesPipe#topic_name}.
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param consumer_group_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#consumer_group_id PipesPipe#consumer_group_id}.
        :param credentials: credentials block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        :param starting_position: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
        '''
        value = PipesPipeSourceParametersManagedStreamingKafkaParameters(
            topic_name=topic_name,
            batch_size=batch_size,
            consumer_group_id=consumer_group_id,
            credentials=credentials,
            maximum_batching_window_in_seconds=maximum_batching_window_in_seconds,
            starting_position=starting_position,
        )

        return typing.cast(None, jsii.invoke(self, "putManagedStreamingKafkaParameters", [value]))

    @jsii.member(jsii_name="putRabbitmqBrokerParameters")
    def put_rabbitmq_broker_parameters(
        self,
        *,
        credentials: typing.Union["PipesPipeSourceParametersRabbitmqBrokerParametersCredentials", typing.Dict[builtins.str, typing.Any]],
        queue_name: builtins.str,
        batch_size: typing.Optional[jsii.Number] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
        virtual_host: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param credentials: credentials block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
        :param queue_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#queue_name PipesPipe#queue_name}.
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        :param virtual_host: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#virtual_host PipesPipe#virtual_host}.
        '''
        value = PipesPipeSourceParametersRabbitmqBrokerParameters(
            credentials=credentials,
            queue_name=queue_name,
            batch_size=batch_size,
            maximum_batching_window_in_seconds=maximum_batching_window_in_seconds,
            virtual_host=virtual_host,
        )

        return typing.cast(None, jsii.invoke(self, "putRabbitmqBrokerParameters", [value]))

    @jsii.member(jsii_name="putSelfManagedKafkaParameters")
    def put_self_managed_kafka_parameters(
        self,
        *,
        topic_name: builtins.str,
        additional_bootstrap_servers: typing.Optional[typing.Sequence[builtins.str]] = None,
        batch_size: typing.Optional[jsii.Number] = None,
        consumer_group_id: typing.Optional[builtins.str] = None,
        credentials: typing.Optional[typing.Union["PipesPipeSourceParametersSelfManagedKafkaParametersCredentials", typing.Dict[builtins.str, typing.Any]]] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
        server_root_ca_certificate: typing.Optional[builtins.str] = None,
        starting_position: typing.Optional[builtins.str] = None,
        vpc: typing.Optional[typing.Union["PipesPipeSourceParametersSelfManagedKafkaParametersVpc", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param topic_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#topic_name PipesPipe#topic_name}.
        :param additional_bootstrap_servers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#additional_bootstrap_servers PipesPipe#additional_bootstrap_servers}.
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param consumer_group_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#consumer_group_id PipesPipe#consumer_group_id}.
        :param credentials: credentials block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        :param server_root_ca_certificate: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#server_root_ca_certificate PipesPipe#server_root_ca_certificate}.
        :param starting_position: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
        :param vpc: vpc block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#vpc PipesPipe#vpc}
        '''
        value = PipesPipeSourceParametersSelfManagedKafkaParameters(
            topic_name=topic_name,
            additional_bootstrap_servers=additional_bootstrap_servers,
            batch_size=batch_size,
            consumer_group_id=consumer_group_id,
            credentials=credentials,
            maximum_batching_window_in_seconds=maximum_batching_window_in_seconds,
            server_root_ca_certificate=server_root_ca_certificate,
            starting_position=starting_position,
            vpc=vpc,
        )

        return typing.cast(None, jsii.invoke(self, "putSelfManagedKafkaParameters", [value]))

    @jsii.member(jsii_name="putSqsQueueParameters")
    def put_sqs_queue_parameters(
        self,
        *,
        batch_size: typing.Optional[jsii.Number] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        '''
        value = PipesPipeSourceParametersSqsQueueParameters(
            batch_size=batch_size,
            maximum_batching_window_in_seconds=maximum_batching_window_in_seconds,
        )

        return typing.cast(None, jsii.invoke(self, "putSqsQueueParameters", [value]))

    @jsii.member(jsii_name="resetActivemqBrokerParameters")
    def reset_activemq_broker_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetActivemqBrokerParameters", []))

    @jsii.member(jsii_name="resetDynamodbStreamParameters")
    def reset_dynamodb_stream_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDynamodbStreamParameters", []))

    @jsii.member(jsii_name="resetFilterCriteria")
    def reset_filter_criteria(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilterCriteria", []))

    @jsii.member(jsii_name="resetKinesisStreamParameters")
    def reset_kinesis_stream_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKinesisStreamParameters", []))

    @jsii.member(jsii_name="resetManagedStreamingKafkaParameters")
    def reset_managed_streaming_kafka_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetManagedStreamingKafkaParameters", []))

    @jsii.member(jsii_name="resetRabbitmqBrokerParameters")
    def reset_rabbitmq_broker_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRabbitmqBrokerParameters", []))

    @jsii.member(jsii_name="resetSelfManagedKafkaParameters")
    def reset_self_managed_kafka_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSelfManagedKafkaParameters", []))

    @jsii.member(jsii_name="resetSqsQueueParameters")
    def reset_sqs_queue_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSqsQueueParameters", []))

    @builtins.property
    @jsii.member(jsii_name="activemqBrokerParameters")
    def activemq_broker_parameters(
        self,
    ) -> PipesPipeSourceParametersActivemqBrokerParametersOutputReference:
        return typing.cast(PipesPipeSourceParametersActivemqBrokerParametersOutputReference, jsii.get(self, "activemqBrokerParameters"))

    @builtins.property
    @jsii.member(jsii_name="dynamodbStreamParameters")
    def dynamodb_stream_parameters(
        self,
    ) -> PipesPipeSourceParametersDynamodbStreamParametersOutputReference:
        return typing.cast(PipesPipeSourceParametersDynamodbStreamParametersOutputReference, jsii.get(self, "dynamodbStreamParameters"))

    @builtins.property
    @jsii.member(jsii_name="filterCriteria")
    def filter_criteria(self) -> PipesPipeSourceParametersFilterCriteriaOutputReference:
        return typing.cast(PipesPipeSourceParametersFilterCriteriaOutputReference, jsii.get(self, "filterCriteria"))

    @builtins.property
    @jsii.member(jsii_name="kinesisStreamParameters")
    def kinesis_stream_parameters(
        self,
    ) -> PipesPipeSourceParametersKinesisStreamParametersOutputReference:
        return typing.cast(PipesPipeSourceParametersKinesisStreamParametersOutputReference, jsii.get(self, "kinesisStreamParameters"))

    @builtins.property
    @jsii.member(jsii_name="managedStreamingKafkaParameters")
    def managed_streaming_kafka_parameters(
        self,
    ) -> PipesPipeSourceParametersManagedStreamingKafkaParametersOutputReference:
        return typing.cast(PipesPipeSourceParametersManagedStreamingKafkaParametersOutputReference, jsii.get(self, "managedStreamingKafkaParameters"))

    @builtins.property
    @jsii.member(jsii_name="rabbitmqBrokerParameters")
    def rabbitmq_broker_parameters(
        self,
    ) -> "PipesPipeSourceParametersRabbitmqBrokerParametersOutputReference":
        return typing.cast("PipesPipeSourceParametersRabbitmqBrokerParametersOutputReference", jsii.get(self, "rabbitmqBrokerParameters"))

    @builtins.property
    @jsii.member(jsii_name="selfManagedKafkaParameters")
    def self_managed_kafka_parameters(
        self,
    ) -> "PipesPipeSourceParametersSelfManagedKafkaParametersOutputReference":
        return typing.cast("PipesPipeSourceParametersSelfManagedKafkaParametersOutputReference", jsii.get(self, "selfManagedKafkaParameters"))

    @builtins.property
    @jsii.member(jsii_name="sqsQueueParameters")
    def sqs_queue_parameters(
        self,
    ) -> "PipesPipeSourceParametersSqsQueueParametersOutputReference":
        return typing.cast("PipesPipeSourceParametersSqsQueueParametersOutputReference", jsii.get(self, "sqsQueueParameters"))

    @builtins.property
    @jsii.member(jsii_name="activemqBrokerParametersInput")
    def activemq_broker_parameters_input(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersActivemqBrokerParameters]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersActivemqBrokerParameters], jsii.get(self, "activemqBrokerParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="dynamodbStreamParametersInput")
    def dynamodb_stream_parameters_input(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersDynamodbStreamParameters]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersDynamodbStreamParameters], jsii.get(self, "dynamodbStreamParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="filterCriteriaInput")
    def filter_criteria_input(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersFilterCriteria]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersFilterCriteria], jsii.get(self, "filterCriteriaInput"))

    @builtins.property
    @jsii.member(jsii_name="kinesisStreamParametersInput")
    def kinesis_stream_parameters_input(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersKinesisStreamParameters]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersKinesisStreamParameters], jsii.get(self, "kinesisStreamParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="managedStreamingKafkaParametersInput")
    def managed_streaming_kafka_parameters_input(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersManagedStreamingKafkaParameters]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersManagedStreamingKafkaParameters], jsii.get(self, "managedStreamingKafkaParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="rabbitmqBrokerParametersInput")
    def rabbitmq_broker_parameters_input(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersRabbitmqBrokerParameters"]:
        return typing.cast(typing.Optional["PipesPipeSourceParametersRabbitmqBrokerParameters"], jsii.get(self, "rabbitmqBrokerParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="selfManagedKafkaParametersInput")
    def self_managed_kafka_parameters_input(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersSelfManagedKafkaParameters"]:
        return typing.cast(typing.Optional["PipesPipeSourceParametersSelfManagedKafkaParameters"], jsii.get(self, "selfManagedKafkaParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="sqsQueueParametersInput")
    def sqs_queue_parameters_input(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersSqsQueueParameters"]:
        return typing.cast(typing.Optional["PipesPipeSourceParametersSqsQueueParameters"], jsii.get(self, "sqsQueueParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[PipesPipeSourceParameters]:
        return typing.cast(typing.Optional[PipesPipeSourceParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[PipesPipeSourceParameters]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__90d0de8e0adc643981abdaa29d36e8bf095fc75877b229660975172d3c6e1b86)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersRabbitmqBrokerParameters",
    jsii_struct_bases=[],
    name_mapping={
        "credentials": "credentials",
        "queue_name": "queueName",
        "batch_size": "batchSize",
        "maximum_batching_window_in_seconds": "maximumBatchingWindowInSeconds",
        "virtual_host": "virtualHost",
    },
)
class PipesPipeSourceParametersRabbitmqBrokerParameters:
    def __init__(
        self,
        *,
        credentials: typing.Union["PipesPipeSourceParametersRabbitmqBrokerParametersCredentials", typing.Dict[builtins.str, typing.Any]],
        queue_name: builtins.str,
        batch_size: typing.Optional[jsii.Number] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
        virtual_host: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param credentials: credentials block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
        :param queue_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#queue_name PipesPipe#queue_name}.
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        :param virtual_host: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#virtual_host PipesPipe#virtual_host}.
        '''
        if isinstance(credentials, dict):
            credentials = PipesPipeSourceParametersRabbitmqBrokerParametersCredentials(**credentials)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e40ad5041151d05360b806cf4c35690abc0cfea9a62eb9f6939be9a0d9641ee)
            check_type(argname="argument credentials", value=credentials, expected_type=type_hints["credentials"])
            check_type(argname="argument queue_name", value=queue_name, expected_type=type_hints["queue_name"])
            check_type(argname="argument batch_size", value=batch_size, expected_type=type_hints["batch_size"])
            check_type(argname="argument maximum_batching_window_in_seconds", value=maximum_batching_window_in_seconds, expected_type=type_hints["maximum_batching_window_in_seconds"])
            check_type(argname="argument virtual_host", value=virtual_host, expected_type=type_hints["virtual_host"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "credentials": credentials,
            "queue_name": queue_name,
        }
        if batch_size is not None:
            self._values["batch_size"] = batch_size
        if maximum_batching_window_in_seconds is not None:
            self._values["maximum_batching_window_in_seconds"] = maximum_batching_window_in_seconds
        if virtual_host is not None:
            self._values["virtual_host"] = virtual_host

    @builtins.property
    def credentials(
        self,
    ) -> "PipesPipeSourceParametersRabbitmqBrokerParametersCredentials":
        '''credentials block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
        '''
        result = self._values.get("credentials")
        assert result is not None, "Required property 'credentials' is missing"
        return typing.cast("PipesPipeSourceParametersRabbitmqBrokerParametersCredentials", result)

    @builtins.property
    def queue_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#queue_name PipesPipe#queue_name}.'''
        result = self._values.get("queue_name")
        assert result is not None, "Required property 'queue_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def batch_size(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.'''
        result = self._values.get("batch_size")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def maximum_batching_window_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.'''
        result = self._values.get("maximum_batching_window_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def virtual_host(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#virtual_host PipesPipe#virtual_host}.'''
        result = self._values.get("virtual_host")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersRabbitmqBrokerParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersRabbitmqBrokerParametersCredentials",
    jsii_struct_bases=[],
    name_mapping={"basic_auth": "basicAuth"},
)
class PipesPipeSourceParametersRabbitmqBrokerParametersCredentials:
    def __init__(self, *, basic_auth: builtins.str) -> None:
        '''
        :param basic_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05d90e5aba1bbf8c0343f0065a56e20d56ca1f1217a58153b69f22b823d4cb38)
            check_type(argname="argument basic_auth", value=basic_auth, expected_type=type_hints["basic_auth"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "basic_auth": basic_auth,
        }

    @builtins.property
    def basic_auth(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}.'''
        result = self._values.get("basic_auth")
        assert result is not None, "Required property 'basic_auth' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersRabbitmqBrokerParametersCredentials(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeSourceParametersRabbitmqBrokerParametersCredentialsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersRabbitmqBrokerParametersCredentialsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e033f2a2911b8b4cb32861b6716a0fb72a848b0f0042e00b9170d11ae305f2dc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="basicAuthInput")
    def basic_auth_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "basicAuthInput"))

    @builtins.property
    @jsii.member(jsii_name="basicAuth")
    def basic_auth(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "basicAuth"))

    @basic_auth.setter
    def basic_auth(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2d3937ab4647f5e4fc9532807efa53fce42355dd815821d5626d3b1bd2aeb5b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "basicAuth", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersRabbitmqBrokerParametersCredentials]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersRabbitmqBrokerParametersCredentials], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersRabbitmqBrokerParametersCredentials],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__937c11c6154672122e3f914a070ff7662b731d05c4a36ceaf6e4750750778875)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeSourceParametersRabbitmqBrokerParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersRabbitmqBrokerParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__371550d505f967587070567d2f9cccfdf1bcfce61c2e15670038e9746c2e0cb4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCredentials")
    def put_credentials(self, *, basic_auth: builtins.str) -> None:
        '''
        :param basic_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}.
        '''
        value = PipesPipeSourceParametersRabbitmqBrokerParametersCredentials(
            basic_auth=basic_auth
        )

        return typing.cast(None, jsii.invoke(self, "putCredentials", [value]))

    @jsii.member(jsii_name="resetBatchSize")
    def reset_batch_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBatchSize", []))

    @jsii.member(jsii_name="resetMaximumBatchingWindowInSeconds")
    def reset_maximum_batching_window_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumBatchingWindowInSeconds", []))

    @jsii.member(jsii_name="resetVirtualHost")
    def reset_virtual_host(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVirtualHost", []))

    @builtins.property
    @jsii.member(jsii_name="credentials")
    def credentials(
        self,
    ) -> PipesPipeSourceParametersRabbitmqBrokerParametersCredentialsOutputReference:
        return typing.cast(PipesPipeSourceParametersRabbitmqBrokerParametersCredentialsOutputReference, jsii.get(self, "credentials"))

    @builtins.property
    @jsii.member(jsii_name="batchSizeInput")
    def batch_size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "batchSizeInput"))

    @builtins.property
    @jsii.member(jsii_name="credentialsInput")
    def credentials_input(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersRabbitmqBrokerParametersCredentials]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersRabbitmqBrokerParametersCredentials], jsii.get(self, "credentialsInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSecondsInput")
    def maximum_batching_window_in_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumBatchingWindowInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="queueNameInput")
    def queue_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "queueNameInput"))

    @builtins.property
    @jsii.member(jsii_name="virtualHostInput")
    def virtual_host_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "virtualHostInput"))

    @builtins.property
    @jsii.member(jsii_name="batchSize")
    def batch_size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "batchSize"))

    @batch_size.setter
    def batch_size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02765592f57636a1b818b078484f672270a6b8862cc1fdc59b7289b69703f2f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "batchSize", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSeconds")
    def maximum_batching_window_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumBatchingWindowInSeconds"))

    @maximum_batching_window_in_seconds.setter
    def maximum_batching_window_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c376b43d03e7837327f536756bf2a3fe61a68d4f0cdb3de0e7eb063129a163d4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumBatchingWindowInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="queueName")
    def queue_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "queueName"))

    @queue_name.setter
    def queue_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d394a0474ef4ce133aa19c149e9027d7d433ff52c38283ce8dd8d889f46279a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "queueName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="virtualHost")
    def virtual_host(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "virtualHost"))

    @virtual_host.setter
    def virtual_host(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a93445781a3701f528dc467b6fc35362b482342a2d47d871c9d33963cc9898bc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "virtualHost", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersRabbitmqBrokerParameters]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersRabbitmqBrokerParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersRabbitmqBrokerParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3135f82c8f85c97ef8e48037fe351f1556a76196990ba6bfbc9a7f5dee00cce5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParameters",
    jsii_struct_bases=[],
    name_mapping={
        "topic_name": "topicName",
        "additional_bootstrap_servers": "additionalBootstrapServers",
        "batch_size": "batchSize",
        "consumer_group_id": "consumerGroupId",
        "credentials": "credentials",
        "maximum_batching_window_in_seconds": "maximumBatchingWindowInSeconds",
        "server_root_ca_certificate": "serverRootCaCertificate",
        "starting_position": "startingPosition",
        "vpc": "vpc",
    },
)
class PipesPipeSourceParametersSelfManagedKafkaParameters:
    def __init__(
        self,
        *,
        topic_name: builtins.str,
        additional_bootstrap_servers: typing.Optional[typing.Sequence[builtins.str]] = None,
        batch_size: typing.Optional[jsii.Number] = None,
        consumer_group_id: typing.Optional[builtins.str] = None,
        credentials: typing.Optional[typing.Union["PipesPipeSourceParametersSelfManagedKafkaParametersCredentials", typing.Dict[builtins.str, typing.Any]]] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
        server_root_ca_certificate: typing.Optional[builtins.str] = None,
        starting_position: typing.Optional[builtins.str] = None,
        vpc: typing.Optional[typing.Union["PipesPipeSourceParametersSelfManagedKafkaParametersVpc", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param topic_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#topic_name PipesPipe#topic_name}.
        :param additional_bootstrap_servers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#additional_bootstrap_servers PipesPipe#additional_bootstrap_servers}.
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param consumer_group_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#consumer_group_id PipesPipe#consumer_group_id}.
        :param credentials: credentials block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        :param server_root_ca_certificate: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#server_root_ca_certificate PipesPipe#server_root_ca_certificate}.
        :param starting_position: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
        :param vpc: vpc block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#vpc PipesPipe#vpc}
        '''
        if isinstance(credentials, dict):
            credentials = PipesPipeSourceParametersSelfManagedKafkaParametersCredentials(**credentials)
        if isinstance(vpc, dict):
            vpc = PipesPipeSourceParametersSelfManagedKafkaParametersVpc(**vpc)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__666f1a73da278e9f9c37601388a46fd58d7db3150fae443824fc1259c7630071)
            check_type(argname="argument topic_name", value=topic_name, expected_type=type_hints["topic_name"])
            check_type(argname="argument additional_bootstrap_servers", value=additional_bootstrap_servers, expected_type=type_hints["additional_bootstrap_servers"])
            check_type(argname="argument batch_size", value=batch_size, expected_type=type_hints["batch_size"])
            check_type(argname="argument consumer_group_id", value=consumer_group_id, expected_type=type_hints["consumer_group_id"])
            check_type(argname="argument credentials", value=credentials, expected_type=type_hints["credentials"])
            check_type(argname="argument maximum_batching_window_in_seconds", value=maximum_batching_window_in_seconds, expected_type=type_hints["maximum_batching_window_in_seconds"])
            check_type(argname="argument server_root_ca_certificate", value=server_root_ca_certificate, expected_type=type_hints["server_root_ca_certificate"])
            check_type(argname="argument starting_position", value=starting_position, expected_type=type_hints["starting_position"])
            check_type(argname="argument vpc", value=vpc, expected_type=type_hints["vpc"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "topic_name": topic_name,
        }
        if additional_bootstrap_servers is not None:
            self._values["additional_bootstrap_servers"] = additional_bootstrap_servers
        if batch_size is not None:
            self._values["batch_size"] = batch_size
        if consumer_group_id is not None:
            self._values["consumer_group_id"] = consumer_group_id
        if credentials is not None:
            self._values["credentials"] = credentials
        if maximum_batching_window_in_seconds is not None:
            self._values["maximum_batching_window_in_seconds"] = maximum_batching_window_in_seconds
        if server_root_ca_certificate is not None:
            self._values["server_root_ca_certificate"] = server_root_ca_certificate
        if starting_position is not None:
            self._values["starting_position"] = starting_position
        if vpc is not None:
            self._values["vpc"] = vpc

    @builtins.property
    def topic_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#topic_name PipesPipe#topic_name}.'''
        result = self._values.get("topic_name")
        assert result is not None, "Required property 'topic_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def additional_bootstrap_servers(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#additional_bootstrap_servers PipesPipe#additional_bootstrap_servers}.'''
        result = self._values.get("additional_bootstrap_servers")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def batch_size(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.'''
        result = self._values.get("batch_size")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def consumer_group_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#consumer_group_id PipesPipe#consumer_group_id}.'''
        result = self._values.get("consumer_group_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def credentials(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersSelfManagedKafkaParametersCredentials"]:
        '''credentials block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
        '''
        result = self._values.get("credentials")
        return typing.cast(typing.Optional["PipesPipeSourceParametersSelfManagedKafkaParametersCredentials"], result)

    @builtins.property
    def maximum_batching_window_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.'''
        result = self._values.get("maximum_batching_window_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def server_root_ca_certificate(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#server_root_ca_certificate PipesPipe#server_root_ca_certificate}.'''
        result = self._values.get("server_root_ca_certificate")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def starting_position(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.'''
        result = self._values.get("starting_position")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def vpc(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersSelfManagedKafkaParametersVpc"]:
        '''vpc block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#vpc PipesPipe#vpc}
        '''
        result = self._values.get("vpc")
        return typing.cast(typing.Optional["PipesPipeSourceParametersSelfManagedKafkaParametersVpc"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersSelfManagedKafkaParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials",
    jsii_struct_bases=[],
    name_mapping={
        "basic_auth": "basicAuth",
        "client_certificate_tls_auth": "clientCertificateTlsAuth",
        "sasl_scram256_auth": "saslScram256Auth",
        "sasl_scram512_auth": "saslScram512Auth",
    },
)
class PipesPipeSourceParametersSelfManagedKafkaParametersCredentials:
    def __init__(
        self,
        *,
        basic_auth: typing.Optional[builtins.str] = None,
        client_certificate_tls_auth: typing.Optional[builtins.str] = None,
        sasl_scram256_auth: typing.Optional[builtins.str] = None,
        sasl_scram512_auth: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param basic_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}.
        :param client_certificate_tls_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#client_certificate_tls_auth PipesPipe#client_certificate_tls_auth}.
        :param sasl_scram256_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_256_auth PipesPipe#sasl_scram_256_auth}.
        :param sasl_scram512_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_512_auth PipesPipe#sasl_scram_512_auth}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f71efa59f4e3386e2c18175c4597eb08b6b72876ba694ad9e8b0a6472a481a8e)
            check_type(argname="argument basic_auth", value=basic_auth, expected_type=type_hints["basic_auth"])
            check_type(argname="argument client_certificate_tls_auth", value=client_certificate_tls_auth, expected_type=type_hints["client_certificate_tls_auth"])
            check_type(argname="argument sasl_scram256_auth", value=sasl_scram256_auth, expected_type=type_hints["sasl_scram256_auth"])
            check_type(argname="argument sasl_scram512_auth", value=sasl_scram512_auth, expected_type=type_hints["sasl_scram512_auth"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if basic_auth is not None:
            self._values["basic_auth"] = basic_auth
        if client_certificate_tls_auth is not None:
            self._values["client_certificate_tls_auth"] = client_certificate_tls_auth
        if sasl_scram256_auth is not None:
            self._values["sasl_scram256_auth"] = sasl_scram256_auth
        if sasl_scram512_auth is not None:
            self._values["sasl_scram512_auth"] = sasl_scram512_auth

    @builtins.property
    def basic_auth(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}.'''
        result = self._values.get("basic_auth")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def client_certificate_tls_auth(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#client_certificate_tls_auth PipesPipe#client_certificate_tls_auth}.'''
        result = self._values.get("client_certificate_tls_auth")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sasl_scram256_auth(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_256_auth PipesPipe#sasl_scram_256_auth}.'''
        result = self._values.get("sasl_scram256_auth")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sasl_scram512_auth(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_512_auth PipesPipe#sasl_scram_512_auth}.'''
        result = self._values.get("sasl_scram512_auth")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersSelfManagedKafkaParametersCredentials(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeSourceParametersSelfManagedKafkaParametersCredentialsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentialsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b5eb871f47dd85546bed75e17b7a18e6b65bcd470ccf70f67165bddc8afc49a6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetBasicAuth")
    def reset_basic_auth(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBasicAuth", []))

    @jsii.member(jsii_name="resetClientCertificateTlsAuth")
    def reset_client_certificate_tls_auth(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetClientCertificateTlsAuth", []))

    @jsii.member(jsii_name="resetSaslScram256Auth")
    def reset_sasl_scram256_auth(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSaslScram256Auth", []))

    @jsii.member(jsii_name="resetSaslScram512Auth")
    def reset_sasl_scram512_auth(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSaslScram512Auth", []))

    @builtins.property
    @jsii.member(jsii_name="basicAuthInput")
    def basic_auth_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "basicAuthInput"))

    @builtins.property
    @jsii.member(jsii_name="clientCertificateTlsAuthInput")
    def client_certificate_tls_auth_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "clientCertificateTlsAuthInput"))

    @builtins.property
    @jsii.member(jsii_name="saslScram256AuthInput")
    def sasl_scram256_auth_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "saslScram256AuthInput"))

    @builtins.property
    @jsii.member(jsii_name="saslScram512AuthInput")
    def sasl_scram512_auth_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "saslScram512AuthInput"))

    @builtins.property
    @jsii.member(jsii_name="basicAuth")
    def basic_auth(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "basicAuth"))

    @basic_auth.setter
    def basic_auth(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6489b8b62ec9ac0067f72a419ebac6ffe6c3a07bc21396293beac732b73fafb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "basicAuth", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="clientCertificateTlsAuth")
    def client_certificate_tls_auth(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "clientCertificateTlsAuth"))

    @client_certificate_tls_auth.setter
    def client_certificate_tls_auth(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ecd2500d12d7c2cd874b47c214d49aa91fc458c448229e70c4d90f6a186fb763)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "clientCertificateTlsAuth", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="saslScram256Auth")
    def sasl_scram256_auth(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "saslScram256Auth"))

    @sasl_scram256_auth.setter
    def sasl_scram256_auth(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05bf727c171dc1ce8ea1391dfd028b19f623de61a2d5de02746f7910beb8e9e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "saslScram256Auth", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="saslScram512Auth")
    def sasl_scram512_auth(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "saslScram512Auth"))

    @sasl_scram512_auth.setter
    def sasl_scram512_auth(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a75dd99e800ba072915883faeccc64af08d1279385fca92b85247de4974e7c74)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "saslScram512Auth", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParametersCredentials]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParametersCredentials], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParametersCredentials],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__499f54720e3f344c62a464441ce5960de0057f4896c72fcdfa52dd1cc8f72be8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeSourceParametersSelfManagedKafkaParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a9c135ead28ddda8a0b2f5f6ab89b48a3218d653427fc1d892d30c1b87e5b881)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCredentials")
    def put_credentials(
        self,
        *,
        basic_auth: typing.Optional[builtins.str] = None,
        client_certificate_tls_auth: typing.Optional[builtins.str] = None,
        sasl_scram256_auth: typing.Optional[builtins.str] = None,
        sasl_scram512_auth: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param basic_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}.
        :param client_certificate_tls_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#client_certificate_tls_auth PipesPipe#client_certificate_tls_auth}.
        :param sasl_scram256_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_256_auth PipesPipe#sasl_scram_256_auth}.
        :param sasl_scram512_auth: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sasl_scram_512_auth PipesPipe#sasl_scram_512_auth}.
        '''
        value = PipesPipeSourceParametersSelfManagedKafkaParametersCredentials(
            basic_auth=basic_auth,
            client_certificate_tls_auth=client_certificate_tls_auth,
            sasl_scram256_auth=sasl_scram256_auth,
            sasl_scram512_auth=sasl_scram512_auth,
        )

        return typing.cast(None, jsii.invoke(self, "putCredentials", [value]))

    @jsii.member(jsii_name="putVpc")
    def put_vpc(
        self,
        *,
        security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
        subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param security_groups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#security_groups PipesPipe#security_groups}.
        :param subnets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#subnets PipesPipe#subnets}.
        '''
        value = PipesPipeSourceParametersSelfManagedKafkaParametersVpc(
            security_groups=security_groups, subnets=subnets
        )

        return typing.cast(None, jsii.invoke(self, "putVpc", [value]))

    @jsii.member(jsii_name="resetAdditionalBootstrapServers")
    def reset_additional_bootstrap_servers(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAdditionalBootstrapServers", []))

    @jsii.member(jsii_name="resetBatchSize")
    def reset_batch_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBatchSize", []))

    @jsii.member(jsii_name="resetConsumerGroupId")
    def reset_consumer_group_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConsumerGroupId", []))

    @jsii.member(jsii_name="resetCredentials")
    def reset_credentials(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCredentials", []))

    @jsii.member(jsii_name="resetMaximumBatchingWindowInSeconds")
    def reset_maximum_batching_window_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumBatchingWindowInSeconds", []))

    @jsii.member(jsii_name="resetServerRootCaCertificate")
    def reset_server_root_ca_certificate(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetServerRootCaCertificate", []))

    @jsii.member(jsii_name="resetStartingPosition")
    def reset_starting_position(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStartingPosition", []))

    @jsii.member(jsii_name="resetVpc")
    def reset_vpc(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVpc", []))

    @builtins.property
    @jsii.member(jsii_name="credentials")
    def credentials(
        self,
    ) -> PipesPipeSourceParametersSelfManagedKafkaParametersCredentialsOutputReference:
        return typing.cast(PipesPipeSourceParametersSelfManagedKafkaParametersCredentialsOutputReference, jsii.get(self, "credentials"))

    @builtins.property
    @jsii.member(jsii_name="vpc")
    def vpc(
        self,
    ) -> "PipesPipeSourceParametersSelfManagedKafkaParametersVpcOutputReference":
        return typing.cast("PipesPipeSourceParametersSelfManagedKafkaParametersVpcOutputReference", jsii.get(self, "vpc"))

    @builtins.property
    @jsii.member(jsii_name="additionalBootstrapServersInput")
    def additional_bootstrap_servers_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "additionalBootstrapServersInput"))

    @builtins.property
    @jsii.member(jsii_name="batchSizeInput")
    def batch_size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "batchSizeInput"))

    @builtins.property
    @jsii.member(jsii_name="consumerGroupIdInput")
    def consumer_group_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "consumerGroupIdInput"))

    @builtins.property
    @jsii.member(jsii_name="credentialsInput")
    def credentials_input(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParametersCredentials]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParametersCredentials], jsii.get(self, "credentialsInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSecondsInput")
    def maximum_batching_window_in_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumBatchingWindowInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="serverRootCaCertificateInput")
    def server_root_ca_certificate_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "serverRootCaCertificateInput"))

    @builtins.property
    @jsii.member(jsii_name="startingPositionInput")
    def starting_position_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startingPositionInput"))

    @builtins.property
    @jsii.member(jsii_name="topicNameInput")
    def topic_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "topicNameInput"))

    @builtins.property
    @jsii.member(jsii_name="vpcInput")
    def vpc_input(
        self,
    ) -> typing.Optional["PipesPipeSourceParametersSelfManagedKafkaParametersVpc"]:
        return typing.cast(typing.Optional["PipesPipeSourceParametersSelfManagedKafkaParametersVpc"], jsii.get(self, "vpcInput"))

    @builtins.property
    @jsii.member(jsii_name="additionalBootstrapServers")
    def additional_bootstrap_servers(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "additionalBootstrapServers"))

    @additional_bootstrap_servers.setter
    def additional_bootstrap_servers(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4736c4e40f32169e394a36fb083d49362346cf36b9e012edb5d748ec37dd9e06)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "additionalBootstrapServers", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="batchSize")
    def batch_size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "batchSize"))

    @batch_size.setter
    def batch_size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ff7684e6af3ef48ef815627ff1065e0961f7be724b4bb61337cf0ce1d641e8c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "batchSize", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="consumerGroupId")
    def consumer_group_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "consumerGroupId"))

    @consumer_group_id.setter
    def consumer_group_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4230d7c64b6f740b6c1489fedeca85873add6e7546286bffe8f90e01298736d2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "consumerGroupId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSeconds")
    def maximum_batching_window_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumBatchingWindowInSeconds"))

    @maximum_batching_window_in_seconds.setter
    def maximum_batching_window_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fcfb12bd119501d552199ec66113e03875590c307f4d8e06d9a9cfbe757a7c66)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumBatchingWindowInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="serverRootCaCertificate")
    def server_root_ca_certificate(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "serverRootCaCertificate"))

    @server_root_ca_certificate.setter
    def server_root_ca_certificate(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__93b12465659c41ae70e50979824a1ae25f471cbc0685ea8ee612a6c6bdcc6f0d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "serverRootCaCertificate", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startingPosition")
    def starting_position(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startingPosition"))

    @starting_position.setter
    def starting_position(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6682cf2e4db1be3935d15a39a25c0f7a5447092d432f9f641104d1d4f91fb5f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startingPosition", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="topicName")
    def topic_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "topicName"))

    @topic_name.setter
    def topic_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5646c0d762285f7a1b81f436dbad1ccaa4bc5c39ced787d28f710df36d1272d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "topicName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParameters]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9270b1165449d225a6f6946824d2feca263727d14c989e6652cc9b9ea8ce3b7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpc",
    jsii_struct_bases=[],
    name_mapping={"security_groups": "securityGroups", "subnets": "subnets"},
)
class PipesPipeSourceParametersSelfManagedKafkaParametersVpc:
    def __init__(
        self,
        *,
        security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
        subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param security_groups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#security_groups PipesPipe#security_groups}.
        :param subnets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#subnets PipesPipe#subnets}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c27c2c050c51c630c2b4f1e64a472673bda3900a8b68db6e5e93f92327757564)
            check_type(argname="argument security_groups", value=security_groups, expected_type=type_hints["security_groups"])
            check_type(argname="argument subnets", value=subnets, expected_type=type_hints["subnets"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if security_groups is not None:
            self._values["security_groups"] = security_groups
        if subnets is not None:
            self._values["subnets"] = subnets

    @builtins.property
    def security_groups(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#security_groups PipesPipe#security_groups}.'''
        result = self._values.get("security_groups")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def subnets(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#subnets PipesPipe#subnets}.'''
        result = self._values.get("subnets")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersSelfManagedKafkaParametersVpc(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeSourceParametersSelfManagedKafkaParametersVpcOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpcOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3a1ea60554898cb5fc6babb6ceda4a0d8a561d8b850538b2a4e0962c732a8699)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetSecurityGroups")
    def reset_security_groups(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityGroups", []))

    @jsii.member(jsii_name="resetSubnets")
    def reset_subnets(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSubnets", []))

    @builtins.property
    @jsii.member(jsii_name="securityGroupsInput")
    def security_groups_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "securityGroupsInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetsInput")
    def subnets_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "subnetsInput"))

    @builtins.property
    @jsii.member(jsii_name="securityGroups")
    def security_groups(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "securityGroups"))

    @security_groups.setter
    def security_groups(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__de79ce16971f5d3d74f4c9ccae505331b37fb38836d15a4b0753c78ba762eb9f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityGroups", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnets")
    def subnets(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "subnets"))

    @subnets.setter
    def subnets(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__11a8db0fa54c469c092da4bcd60020355be715b744c97abb43a9cc16c16a28c3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnets", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParametersVpc]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParametersVpc], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParametersVpc],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a5bfd54af0d669a591d9acada49aec2af97260632b9edc022e74486d423d1fe4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersSqsQueueParameters",
    jsii_struct_bases=[],
    name_mapping={
        "batch_size": "batchSize",
        "maximum_batching_window_in_seconds": "maximumBatchingWindowInSeconds",
    },
)
class PipesPipeSourceParametersSqsQueueParameters:
    def __init__(
        self,
        *,
        batch_size: typing.Optional[jsii.Number] = None,
        maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param batch_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
        :param maximum_batching_window_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e54dfb3f93b2e0f3ff22b99c0abccc0d8c9c09dce0f1d469d0bcac59c03c32d2)
            check_type(argname="argument batch_size", value=batch_size, expected_type=type_hints["batch_size"])
            check_type(argname="argument maximum_batching_window_in_seconds", value=maximum_batching_window_in_seconds, expected_type=type_hints["maximum_batching_window_in_seconds"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if batch_size is not None:
            self._values["batch_size"] = batch_size
        if maximum_batching_window_in_seconds is not None:
            self._values["maximum_batching_window_in_seconds"] = maximum_batching_window_in_seconds

    @builtins.property
    def batch_size(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.'''
        result = self._values.get("batch_size")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def maximum_batching_window_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.'''
        result = self._values.get("maximum_batching_window_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeSourceParametersSqsQueueParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeSourceParametersSqsQueueParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeSourceParametersSqsQueueParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__84223229e1bb785498070be2fbb7bd3c938278ad830c8525299142ad11ceb42c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetBatchSize")
    def reset_batch_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBatchSize", []))

    @jsii.member(jsii_name="resetMaximumBatchingWindowInSeconds")
    def reset_maximum_batching_window_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaximumBatchingWindowInSeconds", []))

    @builtins.property
    @jsii.member(jsii_name="batchSizeInput")
    def batch_size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "batchSizeInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSecondsInput")
    def maximum_batching_window_in_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumBatchingWindowInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="batchSize")
    def batch_size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "batchSize"))

    @batch_size.setter
    def batch_size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__256ec22a4ac26c314ab966e1195503cd8670029515b81aa27271b91e0ace8b5d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "batchSize", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumBatchingWindowInSeconds")
    def maximum_batching_window_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumBatchingWindowInSeconds"))

    @maximum_batching_window_in_seconds.setter
    def maximum_batching_window_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__842b7fa6a7c12ef38a658d0f695305daad265770e937f529e98d5ada4d682b6c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumBatchingWindowInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeSourceParametersSqsQueueParameters]:
        return typing.cast(typing.Optional[PipesPipeSourceParametersSqsQueueParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeSourceParametersSqsQueueParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b8dd538ab8affb5111324ef141d6953a2e61314e980a2553d14ec499902ba8f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParameters",
    jsii_struct_bases=[],
    name_mapping={
        "batch_job_parameters": "batchJobParameters",
        "cloudwatch_logs_parameters": "cloudwatchLogsParameters",
        "ecs_task_parameters": "ecsTaskParameters",
        "eventbridge_event_bus_parameters": "eventbridgeEventBusParameters",
        "http_parameters": "httpParameters",
        "input_template": "inputTemplate",
        "kinesis_stream_parameters": "kinesisStreamParameters",
        "lambda_function_parameters": "lambdaFunctionParameters",
        "redshift_data_parameters": "redshiftDataParameters",
        "sagemaker_pipeline_parameters": "sagemakerPipelineParameters",
        "sqs_queue_parameters": "sqsQueueParameters",
        "step_function_state_machine_parameters": "stepFunctionStateMachineParameters",
    },
)
class PipesPipeTargetParameters:
    def __init__(
        self,
        *,
        batch_job_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersBatchJobParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        cloudwatch_logs_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersCloudwatchLogsParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        ecs_task_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersEcsTaskParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        eventbridge_event_bus_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersEventbridgeEventBusParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        http_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersHttpParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        input_template: typing.Optional[builtins.str] = None,
        kinesis_stream_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersKinesisStreamParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        lambda_function_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersLambdaFunctionParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        redshift_data_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersRedshiftDataParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        sagemaker_pipeline_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersSagemakerPipelineParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        sqs_queue_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersSqsQueueParameters", typing.Dict[builtins.str, typing.Any]]] = None,
        step_function_state_machine_parameters: typing.Optional[typing.Union["PipesPipeTargetParametersStepFunctionStateMachineParameters", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param batch_job_parameters: batch_job_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_job_parameters PipesPipe#batch_job_parameters}
        :param cloudwatch_logs_parameters: cloudwatch_logs_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cloudwatch_logs_parameters PipesPipe#cloudwatch_logs_parameters}
        :param ecs_task_parameters: ecs_task_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#ecs_task_parameters PipesPipe#ecs_task_parameters}
        :param eventbridge_event_bus_parameters: eventbridge_event_bus_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#eventbridge_event_bus_parameters PipesPipe#eventbridge_event_bus_parameters}
        :param http_parameters: http_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#http_parameters PipesPipe#http_parameters}
        :param input_template: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#input_template PipesPipe#input_template}.
        :param kinesis_stream_parameters: kinesis_stream_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kinesis_stream_parameters PipesPipe#kinesis_stream_parameters}
        :param lambda_function_parameters: lambda_function_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#lambda_function_parameters PipesPipe#lambda_function_parameters}
        :param redshift_data_parameters: redshift_data_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#redshift_data_parameters PipesPipe#redshift_data_parameters}
        :param sagemaker_pipeline_parameters: sagemaker_pipeline_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sagemaker_pipeline_parameters PipesPipe#sagemaker_pipeline_parameters}
        :param sqs_queue_parameters: sqs_queue_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqs_queue_parameters PipesPipe#sqs_queue_parameters}
        :param step_function_state_machine_parameters: step_function_state_machine_parameters block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#step_function_state_machine_parameters PipesPipe#step_function_state_machine_parameters}
        '''
        if isinstance(batch_job_parameters, dict):
            batch_job_parameters = PipesPipeTargetParametersBatchJobParameters(**batch_job_parameters)
        if isinstance(cloudwatch_logs_parameters, dict):
            cloudwatch_logs_parameters = PipesPipeTargetParametersCloudwatchLogsParameters(**cloudwatch_logs_parameters)
        if isinstance(ecs_task_parameters, dict):
            ecs_task_parameters = PipesPipeTargetParametersEcsTaskParameters(**ecs_task_parameters)
        if isinstance(eventbridge_event_bus_parameters, dict):
            eventbridge_event_bus_parameters = PipesPipeTargetParametersEventbridgeEventBusParameters(**eventbridge_event_bus_parameters)
        if isinstance(http_parameters, dict):
            http_parameters = PipesPipeTargetParametersHttpParameters(**http_parameters)
        if isinstance(kinesis_stream_parameters, dict):
            kinesis_stream_parameters = PipesPipeTargetParametersKinesisStreamParameters(**kinesis_stream_parameters)
        if isinstance(lambda_function_parameters, dict):
            lambda_function_parameters = PipesPipeTargetParametersLambdaFunctionParameters(**lambda_function_parameters)
        if isinstance(redshift_data_parameters, dict):
            redshift_data_parameters = PipesPipeTargetParametersRedshiftDataParameters(**redshift_data_parameters)
        if isinstance(sagemaker_pipeline_parameters, dict):
            sagemaker_pipeline_parameters = PipesPipeTargetParametersSagemakerPipelineParameters(**sagemaker_pipeline_parameters)
        if isinstance(sqs_queue_parameters, dict):
            sqs_queue_parameters = PipesPipeTargetParametersSqsQueueParameters(**sqs_queue_parameters)
        if isinstance(step_function_state_machine_parameters, dict):
            step_function_state_machine_parameters = PipesPipeTargetParametersStepFunctionStateMachineParameters(**step_function_state_machine_parameters)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9c5885a36ab8ae92f577c0bd8a558592bac45f3626ff0444853581536917ce2)
            check_type(argname="argument batch_job_parameters", value=batch_job_parameters, expected_type=type_hints["batch_job_parameters"])
            check_type(argname="argument cloudwatch_logs_parameters", value=cloudwatch_logs_parameters, expected_type=type_hints["cloudwatch_logs_parameters"])
            check_type(argname="argument ecs_task_parameters", value=ecs_task_parameters, expected_type=type_hints["ecs_task_parameters"])
            check_type(argname="argument eventbridge_event_bus_parameters", value=eventbridge_event_bus_parameters, expected_type=type_hints["eventbridge_event_bus_parameters"])
            check_type(argname="argument http_parameters", value=http_parameters, expected_type=type_hints["http_parameters"])
            check_type(argname="argument input_template", value=input_template, expected_type=type_hints["input_template"])
            check_type(argname="argument kinesis_stream_parameters", value=kinesis_stream_parameters, expected_type=type_hints["kinesis_stream_parameters"])
            check_type(argname="argument lambda_function_parameters", value=lambda_function_parameters, expected_type=type_hints["lambda_function_parameters"])
            check_type(argname="argument redshift_data_parameters", value=redshift_data_parameters, expected_type=type_hints["redshift_data_parameters"])
            check_type(argname="argument sagemaker_pipeline_parameters", value=sagemaker_pipeline_parameters, expected_type=type_hints["sagemaker_pipeline_parameters"])
            check_type(argname="argument sqs_queue_parameters", value=sqs_queue_parameters, expected_type=type_hints["sqs_queue_parameters"])
            check_type(argname="argument step_function_state_machine_parameters", value=step_function_state_machine_parameters, expected_type=type_hints["step_function_state_machine_parameters"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if batch_job_parameters is not None:
            self._values["batch_job_parameters"] = batch_job_parameters
        if cloudwatch_logs_parameters is not None:
            self._values["cloudwatch_logs_parameters"] = cloudwatch_logs_parameters
        if ecs_task_parameters is not None:
            self._values["ecs_task_parameters"] = ecs_task_parameters
        if eventbridge_event_bus_parameters is not None:
            self._values["eventbridge_event_bus_parameters"] = eventbridge_event_bus_parameters
        if http_parameters is not None:
            self._values["http_parameters"] = http_parameters
        if input_template is not None:
            self._values["input_template"] = input_template
        if kinesis_stream_parameters is not None:
            self._values["kinesis_stream_parameters"] = kinesis_stream_parameters
        if lambda_function_parameters is not None:
            self._values["lambda_function_parameters"] = lambda_function_parameters
        if redshift_data_parameters is not None:
            self._values["redshift_data_parameters"] = redshift_data_parameters
        if sagemaker_pipeline_parameters is not None:
            self._values["sagemaker_pipeline_parameters"] = sagemaker_pipeline_parameters
        if sqs_queue_parameters is not None:
            self._values["sqs_queue_parameters"] = sqs_queue_parameters
        if step_function_state_machine_parameters is not None:
            self._values["step_function_state_machine_parameters"] = step_function_state_machine_parameters

    @builtins.property
    def batch_job_parameters(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersBatchJobParameters"]:
        '''batch_job_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_job_parameters PipesPipe#batch_job_parameters}
        '''
        result = self._values.get("batch_job_parameters")
        return typing.cast(typing.Optional["PipesPipeTargetParametersBatchJobParameters"], result)

    @builtins.property
    def cloudwatch_logs_parameters(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersCloudwatchLogsParameters"]:
        '''cloudwatch_logs_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cloudwatch_logs_parameters PipesPipe#cloudwatch_logs_parameters}
        '''
        result = self._values.get("cloudwatch_logs_parameters")
        return typing.cast(typing.Optional["PipesPipeTargetParametersCloudwatchLogsParameters"], result)

    @builtins.property
    def ecs_task_parameters(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersEcsTaskParameters"]:
        '''ecs_task_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#ecs_task_parameters PipesPipe#ecs_task_parameters}
        '''
        result = self._values.get("ecs_task_parameters")
        return typing.cast(typing.Optional["PipesPipeTargetParametersEcsTaskParameters"], result)

    @builtins.property
    def eventbridge_event_bus_parameters(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersEventbridgeEventBusParameters"]:
        '''eventbridge_event_bus_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#eventbridge_event_bus_parameters PipesPipe#eventbridge_event_bus_parameters}
        '''
        result = self._values.get("eventbridge_event_bus_parameters")
        return typing.cast(typing.Optional["PipesPipeTargetParametersEventbridgeEventBusParameters"], result)

    @builtins.property
    def http_parameters(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersHttpParameters"]:
        '''http_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#http_parameters PipesPipe#http_parameters}
        '''
        result = self._values.get("http_parameters")
        return typing.cast(typing.Optional["PipesPipeTargetParametersHttpParameters"], result)

    @builtins.property
    def input_template(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#input_template PipesPipe#input_template}.'''
        result = self._values.get("input_template")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def kinesis_stream_parameters(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersKinesisStreamParameters"]:
        '''kinesis_stream_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kinesis_stream_parameters PipesPipe#kinesis_stream_parameters}
        '''
        result = self._values.get("kinesis_stream_parameters")
        return typing.cast(typing.Optional["PipesPipeTargetParametersKinesisStreamParameters"], result)

    @builtins.property
    def lambda_function_parameters(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersLambdaFunctionParameters"]:
        '''lambda_function_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#lambda_function_parameters PipesPipe#lambda_function_parameters}
        '''
        result = self._values.get("lambda_function_parameters")
        return typing.cast(typing.Optional["PipesPipeTargetParametersLambdaFunctionParameters"], result)

    @builtins.property
    def redshift_data_parameters(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersRedshiftDataParameters"]:
        '''redshift_data_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#redshift_data_parameters PipesPipe#redshift_data_parameters}
        '''
        result = self._values.get("redshift_data_parameters")
        return typing.cast(typing.Optional["PipesPipeTargetParametersRedshiftDataParameters"], result)

    @builtins.property
    def sagemaker_pipeline_parameters(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersSagemakerPipelineParameters"]:
        '''sagemaker_pipeline_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sagemaker_pipeline_parameters PipesPipe#sagemaker_pipeline_parameters}
        '''
        result = self._values.get("sagemaker_pipeline_parameters")
        return typing.cast(typing.Optional["PipesPipeTargetParametersSagemakerPipelineParameters"], result)

    @builtins.property
    def sqs_queue_parameters(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersSqsQueueParameters"]:
        '''sqs_queue_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqs_queue_parameters PipesPipe#sqs_queue_parameters}
        '''
        result = self._values.get("sqs_queue_parameters")
        return typing.cast(typing.Optional["PipesPipeTargetParametersSqsQueueParameters"], result)

    @builtins.property
    def step_function_state_machine_parameters(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersStepFunctionStateMachineParameters"]:
        '''step_function_state_machine_parameters block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#step_function_state_machine_parameters PipesPipe#step_function_state_machine_parameters}
        '''
        result = self._values.get("step_function_state_machine_parameters")
        return typing.cast(typing.Optional["PipesPipeTargetParametersStepFunctionStateMachineParameters"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParameters",
    jsii_struct_bases=[],
    name_mapping={
        "job_definition": "jobDefinition",
        "job_name": "jobName",
        "array_properties": "arrayProperties",
        "container_overrides": "containerOverrides",
        "depends_on": "dependsOn",
        "parameters": "parameters",
        "retry_strategy": "retryStrategy",
    },
)
class PipesPipeTargetParametersBatchJobParameters:
    def __init__(
        self,
        *,
        job_definition: builtins.str,
        job_name: builtins.str,
        array_properties: typing.Optional[typing.Union["PipesPipeTargetParametersBatchJobParametersArrayProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        container_overrides: typing.Optional[typing.Union["PipesPipeTargetParametersBatchJobParametersContainerOverrides", typing.Dict[builtins.str, typing.Any]]] = None,
        depends_on: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersBatchJobParametersDependsOn", typing.Dict[builtins.str, typing.Any]]]]] = None,
        parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        retry_strategy: typing.Optional[typing.Union["PipesPipeTargetParametersBatchJobParametersRetryStrategy", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param job_definition: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#job_definition PipesPipe#job_definition}.
        :param job_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#job_name PipesPipe#job_name}.
        :param array_properties: array_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#array_properties PipesPipe#array_properties}
        :param container_overrides: container_overrides block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#container_overrides PipesPipe#container_overrides}
        :param depends_on: depends_on block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#depends_on PipesPipe#depends_on}
        :param parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parameters PipesPipe#parameters}.
        :param retry_strategy: retry_strategy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#retry_strategy PipesPipe#retry_strategy}
        '''
        if isinstance(array_properties, dict):
            array_properties = PipesPipeTargetParametersBatchJobParametersArrayProperties(**array_properties)
        if isinstance(container_overrides, dict):
            container_overrides = PipesPipeTargetParametersBatchJobParametersContainerOverrides(**container_overrides)
        if isinstance(retry_strategy, dict):
            retry_strategy = PipesPipeTargetParametersBatchJobParametersRetryStrategy(**retry_strategy)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd88bf3b3d71eedd2ed159b69e0c79d875991062f25963718e514f22f41d440d)
            check_type(argname="argument job_definition", value=job_definition, expected_type=type_hints["job_definition"])
            check_type(argname="argument job_name", value=job_name, expected_type=type_hints["job_name"])
            check_type(argname="argument array_properties", value=array_properties, expected_type=type_hints["array_properties"])
            check_type(argname="argument container_overrides", value=container_overrides, expected_type=type_hints["container_overrides"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument parameters", value=parameters, expected_type=type_hints["parameters"])
            check_type(argname="argument retry_strategy", value=retry_strategy, expected_type=type_hints["retry_strategy"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "job_definition": job_definition,
            "job_name": job_name,
        }
        if array_properties is not None:
            self._values["array_properties"] = array_properties
        if container_overrides is not None:
            self._values["container_overrides"] = container_overrides
        if depends_on is not None:
            self._values["depends_on"] = depends_on
        if parameters is not None:
            self._values["parameters"] = parameters
        if retry_strategy is not None:
            self._values["retry_strategy"] = retry_strategy

    @builtins.property
    def job_definition(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#job_definition PipesPipe#job_definition}.'''
        result = self._values.get("job_definition")
        assert result is not None, "Required property 'job_definition' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def job_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#job_name PipesPipe#job_name}.'''
        result = self._values.get("job_name")
        assert result is not None, "Required property 'job_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def array_properties(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersBatchJobParametersArrayProperties"]:
        '''array_properties block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#array_properties PipesPipe#array_properties}
        '''
        result = self._values.get("array_properties")
        return typing.cast(typing.Optional["PipesPipeTargetParametersBatchJobParametersArrayProperties"], result)

    @builtins.property
    def container_overrides(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersBatchJobParametersContainerOverrides"]:
        '''container_overrides block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#container_overrides PipesPipe#container_overrides}
        '''
        result = self._values.get("container_overrides")
        return typing.cast(typing.Optional["PipesPipeTargetParametersBatchJobParametersContainerOverrides"], result)

    @builtins.property
    def depends_on(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersBatchJobParametersDependsOn"]]]:
        '''depends_on block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#depends_on PipesPipe#depends_on}
        '''
        result = self._values.get("depends_on")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersBatchJobParametersDependsOn"]]], result)

    @builtins.property
    def parameters(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parameters PipesPipe#parameters}.'''
        result = self._values.get("parameters")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def retry_strategy(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersBatchJobParametersRetryStrategy"]:
        '''retry_strategy block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#retry_strategy PipesPipe#retry_strategy}
        '''
        result = self._values.get("retry_strategy")
        return typing.cast(typing.Optional["PipesPipeTargetParametersBatchJobParametersRetryStrategy"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersBatchJobParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersArrayProperties",
    jsii_struct_bases=[],
    name_mapping={"size": "size"},
)
class PipesPipeTargetParametersBatchJobParametersArrayProperties:
    def __init__(self, *, size: typing.Optional[jsii.Number] = None) -> None:
        '''
        :param size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#size PipesPipe#size}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c337dccd07514db5f7c6c4690e3e730514a6351e020e76b2ce5d06c4724d83d6)
            check_type(argname="argument size", value=size, expected_type=type_hints["size"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if size is not None:
            self._values["size"] = size

    @builtins.property
    def size(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#size PipesPipe#size}.'''
        result = self._values.get("size")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersBatchJobParametersArrayProperties(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersBatchJobParametersArrayPropertiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersArrayPropertiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fa85321750217aa5fe4fb36c2fdb1bc4b144e6ed63753a6f2eb9918f2fa4acce)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetSize")
    def reset_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSize", []))

    @builtins.property
    @jsii.member(jsii_name="sizeInput")
    def size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "sizeInput"))

    @builtins.property
    @jsii.member(jsii_name="size")
    def size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "size"))

    @size.setter
    def size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3cacf4257b4897b73121e1f46aa5447f0c10950ceefe961adf433a5165c4994)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "size", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersBatchJobParametersArrayProperties]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersBatchJobParametersArrayProperties], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersBatchJobParametersArrayProperties],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1b1004afd29dbb4b6c3a09ed512f9a178245a74ed5b70c38d4292f9b5359f91)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides",
    jsii_struct_bases=[],
    name_mapping={
        "command": "command",
        "environment": "environment",
        "instance_type": "instanceType",
        "resource_requirement": "resourceRequirement",
    },
)
class PipesPipeTargetParametersBatchJobParametersContainerOverrides:
    def __init__(
        self,
        *,
        command: typing.Optional[typing.Sequence[builtins.str]] = None,
        environment: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment", typing.Dict[builtins.str, typing.Any]]]]] = None,
        instance_type: typing.Optional[builtins.str] = None,
        resource_requirement: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param command: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#command PipesPipe#command}.
        :param environment: environment block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment PipesPipe#environment}
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#instance_type PipesPipe#instance_type}.
        :param resource_requirement: resource_requirement block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resource_requirement PipesPipe#resource_requirement}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ba72582eabb7ac4d4d3ed1fb921d5d7c544b98b355a2eb5d5e4b768bc21a2a2)
            check_type(argname="argument command", value=command, expected_type=type_hints["command"])
            check_type(argname="argument environment", value=environment, expected_type=type_hints["environment"])
            check_type(argname="argument instance_type", value=instance_type, expected_type=type_hints["instance_type"])
            check_type(argname="argument resource_requirement", value=resource_requirement, expected_type=type_hints["resource_requirement"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if command is not None:
            self._values["command"] = command
        if environment is not None:
            self._values["environment"] = environment
        if instance_type is not None:
            self._values["instance_type"] = instance_type
        if resource_requirement is not None:
            self._values["resource_requirement"] = resource_requirement

    @builtins.property
    def command(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#command PipesPipe#command}.'''
        result = self._values.get("command")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def environment(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment"]]]:
        '''environment block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment PipesPipe#environment}
        '''
        result = self._values.get("environment")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment"]]], result)

    @builtins.property
    def instance_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#instance_type PipesPipe#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def resource_requirement(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement"]]]:
        '''resource_requirement block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resource_requirement PipesPipe#resource_requirement}
        '''
        result = self._values.get("resource_requirement")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersBatchJobParametersContainerOverrides(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment:
    def __init__(
        self,
        *,
        name: typing.Optional[builtins.str] = None,
        value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#value PipesPipe#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__123149da96222bf9163c435649497b08f880c9d81d510cb4b7a1e03068094c84)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if name is not None:
            self._values["name"] = name
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#value PipesPipe#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironmentList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironmentList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d12c7250827bc8820bcf195f816fe5aedffc2e911a19091c5426e3bcb1958fab)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironmentOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf869664cf8bb5a0b40a0b642dd9a237a332c9fb0cda744299ca5f87d22be476)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironmentOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e3a78fa2155505b68f39e0a0cf77bbe7c1f131de52649f9e5378b5b6158baee)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b9b97e0e532d5722c069ad43e7ff65855f3aa16c045f598cb18351723e93fe61)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d3709d9a6c294616ac4dce966a2e25549919171d51408e26b8b04d6288f589bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cee5e1991b8808baf7eddf486c3a070de5af0d65f769450ee94d2be554e31244)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironmentOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironmentOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__18ea0750042817d59626a82802d7d4db6e6b95a19c5b0981d3d9c7e885b7f04b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6f62c2620795737e7e3c9db8e49b4fd3b12937309c2e598caa8c86ba708935e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0dacbf48b99e98da440127d95e89500d9c1bb20961f816e383bc198df013f22b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d29373496063c9d2347c732210abd502fda3fc9484156b297127c01df5bad54)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersBatchJobParametersContainerOverridesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9c3ac3006ff4abf99e5a9a4e1f5a749d95825052b6c49c94856334335dfd84dc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putEnvironment")
    def put_environment(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f70a620acd175e469b103c860760bddb75e5244ad00d017cda877fa5e332072e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEnvironment", [value]))

    @jsii.member(jsii_name="putResourceRequirement")
    def put_resource_requirement(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3802880b3d855bfb2a92f8369587230c569a9fa6cb5b5654037343c91b34832)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceRequirement", [value]))

    @jsii.member(jsii_name="resetCommand")
    def reset_command(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCommand", []))

    @jsii.member(jsii_name="resetEnvironment")
    def reset_environment(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnvironment", []))

    @jsii.member(jsii_name="resetInstanceType")
    def reset_instance_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceType", []))

    @jsii.member(jsii_name="resetResourceRequirement")
    def reset_resource_requirement(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceRequirement", []))

    @builtins.property
    @jsii.member(jsii_name="environment")
    def environment(
        self,
    ) -> PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironmentList:
        return typing.cast(PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironmentList, jsii.get(self, "environment"))

    @builtins.property
    @jsii.member(jsii_name="resourceRequirement")
    def resource_requirement(
        self,
    ) -> "PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirementList":
        return typing.cast("PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirementList", jsii.get(self, "resourceRequirement"))

    @builtins.property
    @jsii.member(jsii_name="commandInput")
    def command_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "commandInput"))

    @builtins.property
    @jsii.member(jsii_name="environmentInput")
    def environment_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment]]], jsii.get(self, "environmentInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceTypeInput")
    def instance_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "instanceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceRequirementInput")
    def resource_requirement_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement"]]], jsii.get(self, "resourceRequirementInput"))

    @builtins.property
    @jsii.member(jsii_name="command")
    def command(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "command"))

    @command.setter
    def command(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__364f7f5097985e2beef14c26f3a7468d7b6f68e35c97329f9c924e96dfc58d84)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "command", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="instanceType")
    def instance_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "instanceType"))

    @instance_type.setter
    def instance_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59ff26712875ab9036865115b5eecdc0917412d8677a703806b5e6678b26b3f3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersBatchJobParametersContainerOverrides]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersBatchJobParametersContainerOverrides], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersBatchJobParametersContainerOverrides],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e319a80fcad8385de006e70f3d91d0bc2391d1d5694cf2a1222b520e0701a26)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement",
    jsii_struct_bases=[],
    name_mapping={"type": "type", "value": "value"},
)
class PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement:
    def __init__(self, *, type: builtins.str, value: builtins.str) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#type PipesPipe#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#value PipesPipe#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3655b923f048a858d5bcba9963b967c0e5ddd1b8e5ff954bd84bf5de868095bc)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "type": type,
            "value": value,
        }

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#type PipesPipe#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#value PipesPipe#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirementList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirementList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0a07035f9ad7586bf951abb0bbc2449093485e8cdee806d0fc75b5979d842601)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirementOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce477592e619f3a2da4bbbf5c7339a267a956da0b123b43cefef318047ac9c70)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirementOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__668dca9c066a86f502fae2099ec33b7b79bc70d79119a9a2d017fb3aa673faf4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bfd3c5a72b6d9540cf4d6fc60f3aea9d1274e2423863758c0cff6d74b9491889)
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
            type_hints = typing.get_type_hints(_typecheckingstub__76a6925388688a6a182292370eb1ad9bf2d67a860082b8774baafd737d5bd217)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9f49d8d520b303f5917463c6e4425acc693f4975f1ca4c42592939a19afa480c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirementOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirementOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ef0e0cbab7ee78c0ac413a2f755ff11f0e09806da743b1e4c01cee3fcf902989)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fe8ab2b6edbfc46813fab86b75e4d56a12ec91361663abc395a826a7e1a6cbb1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a11ea8d89622e2da3b24b7e018fd9d6f528bc0a129270daecb68bdc08a5eee05)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42a65189c75dae0ba812c806634c81d40598e9550326bb0b3cc0b59dc640ac37)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersDependsOn",
    jsii_struct_bases=[],
    name_mapping={"job_id": "jobId", "type": "type"},
)
class PipesPipeTargetParametersBatchJobParametersDependsOn:
    def __init__(
        self,
        *,
        job_id: typing.Optional[builtins.str] = None,
        type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param job_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#job_id PipesPipe#job_id}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#type PipesPipe#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a901e9218f10f851b16a3dacd4f8c52f8156f0c815f4b609457ef5d67555a79)
            check_type(argname="argument job_id", value=job_id, expected_type=type_hints["job_id"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if job_id is not None:
            self._values["job_id"] = job_id
        if type is not None:
            self._values["type"] = type

    @builtins.property
    def job_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#job_id PipesPipe#job_id}.'''
        result = self._values.get("job_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#type PipesPipe#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersBatchJobParametersDependsOn(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersBatchJobParametersDependsOnList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersDependsOnList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__563d01db68956c0810b879bac49e11a71399ff4693ab486864bec46b56fa1d9c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeTargetParametersBatchJobParametersDependsOnOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0973636d3e140c4bf056fb67e28490dc8899d3fa6113546a59a678fd62555413)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeTargetParametersBatchJobParametersDependsOnOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02e38650c52962fd0732eaf414c5035a083b5b85b9f371f3a73846c4809fef61)
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
            type_hints = typing.get_type_hints(_typecheckingstub__94dbe8a835e76aeb9475a7441b5e81956a77219b286a65743411f67ab62835d5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b500a359d28554c583c26a89315f2c17559637b6b05f29c9c6a2a76f95d75743)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersDependsOn]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersDependsOn]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersDependsOn]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff3685a1042951e3aa8ad38cfdcd3189c69febc9a8880d7ec0348e877ce51348)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersBatchJobParametersDependsOnOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersDependsOnOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7605a0a40841f7b70584dcdb68c6eca965ec414d772a9d2069e26721e71f5cc2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetJobId")
    def reset_job_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetJobId", []))

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @builtins.property
    @jsii.member(jsii_name="jobIdInput")
    def job_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "jobIdInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="jobId")
    def job_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "jobId"))

    @job_id.setter
    def job_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__286cff0becc48e0cd7f21e3f2f23cc5eb5f73ac4cc03fbdcad543fcd4578abcc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "jobId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee8aca87211f20d0befb5d7b76dd572ab49ef147b1a6b5d2da3a8100a85a468c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersBatchJobParametersDependsOn]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersBatchJobParametersDependsOn]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersBatchJobParametersDependsOn]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c5322a19347e10f1dc70b509733d55b7cb7097824b5f0e94a0e475eaf950a41)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersBatchJobParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__31006fdf581d45751e24004f00de7e08f4a804c3ec0869cda41867385743651a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putArrayProperties")
    def put_array_properties(
        self,
        *,
        size: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#size PipesPipe#size}.
        '''
        value = PipesPipeTargetParametersBatchJobParametersArrayProperties(size=size)

        return typing.cast(None, jsii.invoke(self, "putArrayProperties", [value]))

    @jsii.member(jsii_name="putContainerOverrides")
    def put_container_overrides(
        self,
        *,
        command: typing.Optional[typing.Sequence[builtins.str]] = None,
        environment: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment, typing.Dict[builtins.str, typing.Any]]]]] = None,
        instance_type: typing.Optional[builtins.str] = None,
        resource_requirement: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param command: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#command PipesPipe#command}.
        :param environment: environment block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment PipesPipe#environment}
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#instance_type PipesPipe#instance_type}.
        :param resource_requirement: resource_requirement block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resource_requirement PipesPipe#resource_requirement}
        '''
        value = PipesPipeTargetParametersBatchJobParametersContainerOverrides(
            command=command,
            environment=environment,
            instance_type=instance_type,
            resource_requirement=resource_requirement,
        )

        return typing.cast(None, jsii.invoke(self, "putContainerOverrides", [value]))

    @jsii.member(jsii_name="putDependsOn")
    def put_depends_on(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersBatchJobParametersDependsOn, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__668fcf57a484a7c0cda4f8688f9b3672b6607a6c102a447fb347a6d1b4d8b271)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDependsOn", [value]))

    @jsii.member(jsii_name="putRetryStrategy")
    def put_retry_strategy(
        self,
        *,
        attempts: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param attempts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#attempts PipesPipe#attempts}.
        '''
        value = PipesPipeTargetParametersBatchJobParametersRetryStrategy(
            attempts=attempts
        )

        return typing.cast(None, jsii.invoke(self, "putRetryStrategy", [value]))

    @jsii.member(jsii_name="resetArrayProperties")
    def reset_array_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetArrayProperties", []))

    @jsii.member(jsii_name="resetContainerOverrides")
    def reset_container_overrides(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerOverrides", []))

    @jsii.member(jsii_name="resetDependsOn")
    def reset_depends_on(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDependsOn", []))

    @jsii.member(jsii_name="resetParameters")
    def reset_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetParameters", []))

    @jsii.member(jsii_name="resetRetryStrategy")
    def reset_retry_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRetryStrategy", []))

    @builtins.property
    @jsii.member(jsii_name="arrayProperties")
    def array_properties(
        self,
    ) -> PipesPipeTargetParametersBatchJobParametersArrayPropertiesOutputReference:
        return typing.cast(PipesPipeTargetParametersBatchJobParametersArrayPropertiesOutputReference, jsii.get(self, "arrayProperties"))

    @builtins.property
    @jsii.member(jsii_name="containerOverrides")
    def container_overrides(
        self,
    ) -> PipesPipeTargetParametersBatchJobParametersContainerOverridesOutputReference:
        return typing.cast(PipesPipeTargetParametersBatchJobParametersContainerOverridesOutputReference, jsii.get(self, "containerOverrides"))

    @builtins.property
    @jsii.member(jsii_name="dependsOn")
    def depends_on(self) -> PipesPipeTargetParametersBatchJobParametersDependsOnList:
        return typing.cast(PipesPipeTargetParametersBatchJobParametersDependsOnList, jsii.get(self, "dependsOn"))

    @builtins.property
    @jsii.member(jsii_name="retryStrategy")
    def retry_strategy(
        self,
    ) -> "PipesPipeTargetParametersBatchJobParametersRetryStrategyOutputReference":
        return typing.cast("PipesPipeTargetParametersBatchJobParametersRetryStrategyOutputReference", jsii.get(self, "retryStrategy"))

    @builtins.property
    @jsii.member(jsii_name="arrayPropertiesInput")
    def array_properties_input(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersBatchJobParametersArrayProperties]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersBatchJobParametersArrayProperties], jsii.get(self, "arrayPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="containerOverridesInput")
    def container_overrides_input(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersBatchJobParametersContainerOverrides]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersBatchJobParametersContainerOverrides], jsii.get(self, "containerOverridesInput"))

    @builtins.property
    @jsii.member(jsii_name="dependsOnInput")
    def depends_on_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersDependsOn]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersDependsOn]]], jsii.get(self, "dependsOnInput"))

    @builtins.property
    @jsii.member(jsii_name="jobDefinitionInput")
    def job_definition_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "jobDefinitionInput"))

    @builtins.property
    @jsii.member(jsii_name="jobNameInput")
    def job_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "jobNameInput"))

    @builtins.property
    @jsii.member(jsii_name="parametersInput")
    def parameters_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "parametersInput"))

    @builtins.property
    @jsii.member(jsii_name="retryStrategyInput")
    def retry_strategy_input(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersBatchJobParametersRetryStrategy"]:
        return typing.cast(typing.Optional["PipesPipeTargetParametersBatchJobParametersRetryStrategy"], jsii.get(self, "retryStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="jobDefinition")
    def job_definition(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "jobDefinition"))

    @job_definition.setter
    def job_definition(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99e6eb7d98c30c03706df8ae62bba35759dc017a62ec6d75ee40c5eeca6b5d9f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "jobDefinition", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="jobName")
    def job_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "jobName"))

    @job_name.setter
    def job_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c331e52bea5769436141387c090ddd4c0974d3b7deec9ebda3449d086caee466)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "jobName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="parameters")
    def parameters(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "parameters"))

    @parameters.setter
    def parameters(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a1436ab57ec7820e7262cb6145a167b9b64972358798c55b7533c3e45a2324c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "parameters", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersBatchJobParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersBatchJobParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersBatchJobParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__748527c429507dc963c901f0593edb55b933a8dd6da6fc7e046c19bbb77ce0a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersRetryStrategy",
    jsii_struct_bases=[],
    name_mapping={"attempts": "attempts"},
)
class PipesPipeTargetParametersBatchJobParametersRetryStrategy:
    def __init__(self, *, attempts: typing.Optional[jsii.Number] = None) -> None:
        '''
        :param attempts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#attempts PipesPipe#attempts}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d26009a146e84a113dc727308ecf6077796ce66a5f5d8acd865944bd8a2ec2a8)
            check_type(argname="argument attempts", value=attempts, expected_type=type_hints["attempts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if attempts is not None:
            self._values["attempts"] = attempts

    @builtins.property
    def attempts(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#attempts PipesPipe#attempts}.'''
        result = self._values.get("attempts")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersBatchJobParametersRetryStrategy(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersBatchJobParametersRetryStrategyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersRetryStrategyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0b73d2166fe2d5c6683205dc5f7e312642ac51044f29dbec803c8f4b3f728d94)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAttempts")
    def reset_attempts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAttempts", []))

    @builtins.property
    @jsii.member(jsii_name="attemptsInput")
    def attempts_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "attemptsInput"))

    @builtins.property
    @jsii.member(jsii_name="attempts")
    def attempts(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "attempts"))

    @attempts.setter
    def attempts(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2150bba12c5dd69e0b5e78183eab2dd9296952d92dd718a0efe56c2082263bfc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "attempts", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersBatchJobParametersRetryStrategy]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersBatchJobParametersRetryStrategy], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersBatchJobParametersRetryStrategy],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__407f33c36f696c05eff65291d735545d5297e6adcce3ef36805eb25491cd73e2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersCloudwatchLogsParameters",
    jsii_struct_bases=[],
    name_mapping={"log_stream_name": "logStreamName", "timestamp": "timestamp"},
)
class PipesPipeTargetParametersCloudwatchLogsParameters:
    def __init__(
        self,
        *,
        log_stream_name: typing.Optional[builtins.str] = None,
        timestamp: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param log_stream_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_stream_name PipesPipe#log_stream_name}.
        :param timestamp: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#timestamp PipesPipe#timestamp}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ccdb1bb41cf0b4c0d45e71a116ace3ca32e655cc396be11543194daa8404a52)
            check_type(argname="argument log_stream_name", value=log_stream_name, expected_type=type_hints["log_stream_name"])
            check_type(argname="argument timestamp", value=timestamp, expected_type=type_hints["timestamp"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if log_stream_name is not None:
            self._values["log_stream_name"] = log_stream_name
        if timestamp is not None:
            self._values["timestamp"] = timestamp

    @builtins.property
    def log_stream_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_stream_name PipesPipe#log_stream_name}.'''
        result = self._values.get("log_stream_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def timestamp(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#timestamp PipesPipe#timestamp}.'''
        result = self._values.get("timestamp")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersCloudwatchLogsParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersCloudwatchLogsParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersCloudwatchLogsParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9baf69fd4ec01625885256da138fd1e0dfdd2a4e4d6873ed7300fd4063ecbe61)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetLogStreamName")
    def reset_log_stream_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLogStreamName", []))

    @jsii.member(jsii_name="resetTimestamp")
    def reset_timestamp(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimestamp", []))

    @builtins.property
    @jsii.member(jsii_name="logStreamNameInput")
    def log_stream_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "logStreamNameInput"))

    @builtins.property
    @jsii.member(jsii_name="timestampInput")
    def timestamp_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "timestampInput"))

    @builtins.property
    @jsii.member(jsii_name="logStreamName")
    def log_stream_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "logStreamName"))

    @log_stream_name.setter
    def log_stream_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56425ecb3ded45e68a261187a06b593bfff7ef9ddcecf2abe4ef1de97ff269db)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "logStreamName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="timestamp")
    def timestamp(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "timestamp"))

    @timestamp.setter
    def timestamp(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c04e9d2cba4f22dec7f9a3aac24029360059b0a51afeecf28e26c7535b2c10bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "timestamp", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersCloudwatchLogsParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersCloudwatchLogsParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersCloudwatchLogsParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8172e7b44c97730f6237a15f9dba364d19b66ea4a5d9e3689d0b0dc750641f47)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParameters",
    jsii_struct_bases=[],
    name_mapping={
        "task_definition_arn": "taskDefinitionArn",
        "capacity_provider_strategy": "capacityProviderStrategy",
        "enable_ecs_managed_tags": "enableEcsManagedTags",
        "enable_execute_command": "enableExecuteCommand",
        "group": "group",
        "launch_type": "launchType",
        "network_configuration": "networkConfiguration",
        "overrides": "overrides",
        "placement_constraint": "placementConstraint",
        "placement_strategy": "placementStrategy",
        "platform_version": "platformVersion",
        "propagate_tags": "propagateTags",
        "reference_id": "referenceId",
        "tags": "tags",
        "task_count": "taskCount",
    },
)
class PipesPipeTargetParametersEcsTaskParameters:
    def __init__(
        self,
        *,
        task_definition_arn: builtins.str,
        capacity_provider_strategy: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy", typing.Dict[builtins.str, typing.Any]]]]] = None,
        enable_ecs_managed_tags: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_execute_command: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        group: typing.Optional[builtins.str] = None,
        launch_type: typing.Optional[builtins.str] = None,
        network_configuration: typing.Optional[typing.Union["PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        overrides: typing.Optional[typing.Union["PipesPipeTargetParametersEcsTaskParametersOverrides", typing.Dict[builtins.str, typing.Any]]] = None,
        placement_constraint: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersPlacementConstraint", typing.Dict[builtins.str, typing.Any]]]]] = None,
        placement_strategy: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersPlacementStrategy", typing.Dict[builtins.str, typing.Any]]]]] = None,
        platform_version: typing.Optional[builtins.str] = None,
        propagate_tags: typing.Optional[builtins.str] = None,
        reference_id: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        task_count: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param task_definition_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#task_definition_arn PipesPipe#task_definition_arn}.
        :param capacity_provider_strategy: capacity_provider_strategy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#capacity_provider_strategy PipesPipe#capacity_provider_strategy}
        :param enable_ecs_managed_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enable_ecs_managed_tags PipesPipe#enable_ecs_managed_tags}.
        :param enable_execute_command: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enable_execute_command PipesPipe#enable_execute_command}.
        :param group: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#group PipesPipe#group}.
        :param launch_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#launch_type PipesPipe#launch_type}.
        :param network_configuration: network_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#network_configuration PipesPipe#network_configuration}
        :param overrides: overrides block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#overrides PipesPipe#overrides}
        :param placement_constraint: placement_constraint block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#placement_constraint PipesPipe#placement_constraint}
        :param placement_strategy: placement_strategy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#placement_strategy PipesPipe#placement_strategy}
        :param platform_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#platform_version PipesPipe#platform_version}.
        :param propagate_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#propagate_tags PipesPipe#propagate_tags}.
        :param reference_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#reference_id PipesPipe#reference_id}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags PipesPipe#tags}.
        :param task_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#task_count PipesPipe#task_count}.
        '''
        if isinstance(network_configuration, dict):
            network_configuration = PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration(**network_configuration)
        if isinstance(overrides, dict):
            overrides = PipesPipeTargetParametersEcsTaskParametersOverrides(**overrides)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3ad392d65bff780b91549d814469756a62ea739cdbbd752ac5ac4ae7f59f626)
            check_type(argname="argument task_definition_arn", value=task_definition_arn, expected_type=type_hints["task_definition_arn"])
            check_type(argname="argument capacity_provider_strategy", value=capacity_provider_strategy, expected_type=type_hints["capacity_provider_strategy"])
            check_type(argname="argument enable_ecs_managed_tags", value=enable_ecs_managed_tags, expected_type=type_hints["enable_ecs_managed_tags"])
            check_type(argname="argument enable_execute_command", value=enable_execute_command, expected_type=type_hints["enable_execute_command"])
            check_type(argname="argument group", value=group, expected_type=type_hints["group"])
            check_type(argname="argument launch_type", value=launch_type, expected_type=type_hints["launch_type"])
            check_type(argname="argument network_configuration", value=network_configuration, expected_type=type_hints["network_configuration"])
            check_type(argname="argument overrides", value=overrides, expected_type=type_hints["overrides"])
            check_type(argname="argument placement_constraint", value=placement_constraint, expected_type=type_hints["placement_constraint"])
            check_type(argname="argument placement_strategy", value=placement_strategy, expected_type=type_hints["placement_strategy"])
            check_type(argname="argument platform_version", value=platform_version, expected_type=type_hints["platform_version"])
            check_type(argname="argument propagate_tags", value=propagate_tags, expected_type=type_hints["propagate_tags"])
            check_type(argname="argument reference_id", value=reference_id, expected_type=type_hints["reference_id"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument task_count", value=task_count, expected_type=type_hints["task_count"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "task_definition_arn": task_definition_arn,
        }
        if capacity_provider_strategy is not None:
            self._values["capacity_provider_strategy"] = capacity_provider_strategy
        if enable_ecs_managed_tags is not None:
            self._values["enable_ecs_managed_tags"] = enable_ecs_managed_tags
        if enable_execute_command is not None:
            self._values["enable_execute_command"] = enable_execute_command
        if group is not None:
            self._values["group"] = group
        if launch_type is not None:
            self._values["launch_type"] = launch_type
        if network_configuration is not None:
            self._values["network_configuration"] = network_configuration
        if overrides is not None:
            self._values["overrides"] = overrides
        if placement_constraint is not None:
            self._values["placement_constraint"] = placement_constraint
        if placement_strategy is not None:
            self._values["placement_strategy"] = placement_strategy
        if platform_version is not None:
            self._values["platform_version"] = platform_version
        if propagate_tags is not None:
            self._values["propagate_tags"] = propagate_tags
        if reference_id is not None:
            self._values["reference_id"] = reference_id
        if tags is not None:
            self._values["tags"] = tags
        if task_count is not None:
            self._values["task_count"] = task_count

    @builtins.property
    def task_definition_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#task_definition_arn PipesPipe#task_definition_arn}.'''
        result = self._values.get("task_definition_arn")
        assert result is not None, "Required property 'task_definition_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def capacity_provider_strategy(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy"]]]:
        '''capacity_provider_strategy block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#capacity_provider_strategy PipesPipe#capacity_provider_strategy}
        '''
        result = self._values.get("capacity_provider_strategy")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy"]]], result)

    @builtins.property
    def enable_ecs_managed_tags(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enable_ecs_managed_tags PipesPipe#enable_ecs_managed_tags}.'''
        result = self._values.get("enable_ecs_managed_tags")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_execute_command(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enable_execute_command PipesPipe#enable_execute_command}.'''
        result = self._values.get("enable_execute_command")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def group(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#group PipesPipe#group}.'''
        result = self._values.get("group")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def launch_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#launch_type PipesPipe#launch_type}.'''
        result = self._values.get("launch_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def network_configuration(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration"]:
        '''network_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#network_configuration PipesPipe#network_configuration}
        '''
        result = self._values.get("network_configuration")
        return typing.cast(typing.Optional["PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration"], result)

    @builtins.property
    def overrides(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersEcsTaskParametersOverrides"]:
        '''overrides block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#overrides PipesPipe#overrides}
        '''
        result = self._values.get("overrides")
        return typing.cast(typing.Optional["PipesPipeTargetParametersEcsTaskParametersOverrides"], result)

    @builtins.property
    def placement_constraint(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersPlacementConstraint"]]]:
        '''placement_constraint block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#placement_constraint PipesPipe#placement_constraint}
        '''
        result = self._values.get("placement_constraint")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersPlacementConstraint"]]], result)

    @builtins.property
    def placement_strategy(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersPlacementStrategy"]]]:
        '''placement_strategy block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#placement_strategy PipesPipe#placement_strategy}
        '''
        result = self._values.get("placement_strategy")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersPlacementStrategy"]]], result)

    @builtins.property
    def platform_version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#platform_version PipesPipe#platform_version}.'''
        result = self._values.get("platform_version")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def propagate_tags(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#propagate_tags PipesPipe#propagate_tags}.'''
        result = self._values.get("propagate_tags")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def reference_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#reference_id PipesPipe#reference_id}.'''
        result = self._values.get("reference_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags PipesPipe#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def task_count(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#task_count PipesPipe#task_count}.'''
        result = self._values.get("task_count")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy",
    jsii_struct_bases=[],
    name_mapping={
        "capacity_provider": "capacityProvider",
        "base": "base",
        "weight": "weight",
    },
)
class PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy:
    def __init__(
        self,
        *,
        capacity_provider: builtins.str,
        base: typing.Optional[jsii.Number] = None,
        weight: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param capacity_provider: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#capacity_provider PipesPipe#capacity_provider}.
        :param base: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#base PipesPipe#base}.
        :param weight: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#weight PipesPipe#weight}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb570d0bb3a2894405eb8fedb4fb360ced253ca138a342e5c20a3666fbac4510)
            check_type(argname="argument capacity_provider", value=capacity_provider, expected_type=type_hints["capacity_provider"])
            check_type(argname="argument base", value=base, expected_type=type_hints["base"])
            check_type(argname="argument weight", value=weight, expected_type=type_hints["weight"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "capacity_provider": capacity_provider,
        }
        if base is not None:
            self._values["base"] = base
        if weight is not None:
            self._values["weight"] = weight

    @builtins.property
    def capacity_provider(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#capacity_provider PipesPipe#capacity_provider}.'''
        result = self._values.get("capacity_provider")
        assert result is not None, "Required property 'capacity_provider' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def base(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#base PipesPipe#base}.'''
        result = self._values.get("base")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def weight(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#weight PipesPipe#weight}.'''
        result = self._values.get("weight")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategyList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategyList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3af14df7e41368b9147b7288120e2c2fdea056aac3a74a416fd9e54efca64e2c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategyOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4bdaaf193bfd3b11b110d62be99ef223af9cb474aa4a9e2241981344515af6ce)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategyOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c7a076fdea0108322e0db68b2e9cf45e742511fec391c6ff7d748101b8400087)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d2b5056541fdb2050cd35d4e464c90de250ff9d2a797ef6840fae07c89173fcf)
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
            type_hints = typing.get_type_hints(_typecheckingstub__20cb6e0275aa5ec7497e1fa0af9abad223472c078518119b30a973873f518dfc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f87b738a67a0b1414fd61e7393120df430527fe865764f36712f2210ee1f056e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9765328b2cd6e68aadf418aa703c6a64e5337650b2d921ec94b5407d18fce232)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetBase")
    def reset_base(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBase", []))

    @jsii.member(jsii_name="resetWeight")
    def reset_weight(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWeight", []))

    @builtins.property
    @jsii.member(jsii_name="baseInput")
    def base_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "baseInput"))

    @builtins.property
    @jsii.member(jsii_name="capacityProviderInput")
    def capacity_provider_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "capacityProviderInput"))

    @builtins.property
    @jsii.member(jsii_name="weightInput")
    def weight_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "weightInput"))

    @builtins.property
    @jsii.member(jsii_name="base")
    def base(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "base"))

    @base.setter
    def base(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__139474ac8cb7d3cd2ca6e5436fbfdf08fb1527b70766804423117835d23922ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "base", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="capacityProvider")
    def capacity_provider(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "capacityProvider"))

    @capacity_provider.setter
    def capacity_provider(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee99449ad4a3570a127f1b38c903c1bb9a21064ac43dd6d72b3048a4ad1f0c43)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "capacityProvider", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="weight")
    def weight(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "weight"))

    @weight.setter
    def weight(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ddbbb101db159a1191ad7d6c6537e6521f656759a9b51eca685d07019629e01c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "weight", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4bba523f35c7eae19a8d06a08a349662f5c61ca447c0f5e6bf004c4a554cb8fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration",
    jsii_struct_bases=[],
    name_mapping={"aws_vpc_configuration": "awsVpcConfiguration"},
)
class PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration:
    def __init__(
        self,
        *,
        aws_vpc_configuration: typing.Optional[typing.Union["PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param aws_vpc_configuration: aws_vpc_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#aws_vpc_configuration PipesPipe#aws_vpc_configuration}
        '''
        if isinstance(aws_vpc_configuration, dict):
            aws_vpc_configuration = PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration(**aws_vpc_configuration)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__088fbb821147eb337dac5f1b4f0ca27b6dfb9e4b8cf6796096d7c193261998d8)
            check_type(argname="argument aws_vpc_configuration", value=aws_vpc_configuration, expected_type=type_hints["aws_vpc_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if aws_vpc_configuration is not None:
            self._values["aws_vpc_configuration"] = aws_vpc_configuration

    @builtins.property
    def aws_vpc_configuration(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration"]:
        '''aws_vpc_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#aws_vpc_configuration PipesPipe#aws_vpc_configuration}
        '''
        result = self._values.get("aws_vpc_configuration")
        return typing.cast(typing.Optional["PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "assign_public_ip": "assignPublicIp",
        "security_groups": "securityGroups",
        "subnets": "subnets",
    },
)
class PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration:
    def __init__(
        self,
        *,
        assign_public_ip: typing.Optional[builtins.str] = None,
        security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
        subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param assign_public_ip: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#assign_public_ip PipesPipe#assign_public_ip}.
        :param security_groups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#security_groups PipesPipe#security_groups}.
        :param subnets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#subnets PipesPipe#subnets}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab0ac95a3d62ba0a221832b6bd284bc44b227915fa828d1431d27db62efe4f17)
            check_type(argname="argument assign_public_ip", value=assign_public_ip, expected_type=type_hints["assign_public_ip"])
            check_type(argname="argument security_groups", value=security_groups, expected_type=type_hints["security_groups"])
            check_type(argname="argument subnets", value=subnets, expected_type=type_hints["subnets"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if assign_public_ip is not None:
            self._values["assign_public_ip"] = assign_public_ip
        if security_groups is not None:
            self._values["security_groups"] = security_groups
        if subnets is not None:
            self._values["subnets"] = subnets

    @builtins.property
    def assign_public_ip(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#assign_public_ip PipesPipe#assign_public_ip}.'''
        result = self._values.get("assign_public_ip")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def security_groups(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#security_groups PipesPipe#security_groups}.'''
        result = self._values.get("security_groups")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def subnets(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#subnets PipesPipe#subnets}.'''
        result = self._values.get("subnets")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9cb7a77a7890594a1ea57b3681371b7c727417eab3f785e80c2f39d084585cd6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAssignPublicIp")
    def reset_assign_public_ip(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAssignPublicIp", []))

    @jsii.member(jsii_name="resetSecurityGroups")
    def reset_security_groups(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityGroups", []))

    @jsii.member(jsii_name="resetSubnets")
    def reset_subnets(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSubnets", []))

    @builtins.property
    @jsii.member(jsii_name="assignPublicIpInput")
    def assign_public_ip_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "assignPublicIpInput"))

    @builtins.property
    @jsii.member(jsii_name="securityGroupsInput")
    def security_groups_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "securityGroupsInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetsInput")
    def subnets_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "subnetsInput"))

    @builtins.property
    @jsii.member(jsii_name="assignPublicIp")
    def assign_public_ip(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "assignPublicIp"))

    @assign_public_ip.setter
    def assign_public_ip(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bb770f4c4136474c11250c19b3cba5feef97cd754c34d86e46315b717497c2d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "assignPublicIp", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="securityGroups")
    def security_groups(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "securityGroups"))

    @security_groups.setter
    def security_groups(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a67be150acaa67e45c6b610244e38d907475863f633aeb53d62806e5274e8683)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityGroups", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnets")
    def subnets(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "subnets"))

    @subnets.setter
    def subnets(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8636a1ee993c372cf2e3e85ae80bb083ff92c88ee268105530a6040c4d82c330)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnets", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a331735de758a50e84b6c4b9663358c8215dbb1d01fa99c19ae6a714f20dda4d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f98381eb758c8fc2fba1c6d55b3895297fbf2a7e555b9089d0922f20b0d3c014)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAwsVpcConfiguration")
    def put_aws_vpc_configuration(
        self,
        *,
        assign_public_ip: typing.Optional[builtins.str] = None,
        security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
        subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param assign_public_ip: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#assign_public_ip PipesPipe#assign_public_ip}.
        :param security_groups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#security_groups PipesPipe#security_groups}.
        :param subnets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#subnets PipesPipe#subnets}.
        '''
        value = PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration(
            assign_public_ip=assign_public_ip,
            security_groups=security_groups,
            subnets=subnets,
        )

        return typing.cast(None, jsii.invoke(self, "putAwsVpcConfiguration", [value]))

    @jsii.member(jsii_name="resetAwsVpcConfiguration")
    def reset_aws_vpc_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAwsVpcConfiguration", []))

    @builtins.property
    @jsii.member(jsii_name="awsVpcConfiguration")
    def aws_vpc_configuration(
        self,
    ) -> PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfigurationOutputReference:
        return typing.cast(PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfigurationOutputReference, jsii.get(self, "awsVpcConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="awsVpcConfigurationInput")
    def aws_vpc_configuration_input(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration], jsii.get(self, "awsVpcConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0a6cd92f6d2a4bbc607dbf1263683b68b3828a5fd003c1d31cb293fb494c8e62)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cd6d444abda207a4e11ccdf76aa69137b8e49ab85d68476f0218d3696e505005)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCapacityProviderStrategy")
    def put_capacity_provider_strategy(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0dacfb03e9c2f2605f897fee19b1e7b92fbf8da44f7878f4b5bd383114a6ca7f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCapacityProviderStrategy", [value]))

    @jsii.member(jsii_name="putNetworkConfiguration")
    def put_network_configuration(
        self,
        *,
        aws_vpc_configuration: typing.Optional[typing.Union[PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param aws_vpc_configuration: aws_vpc_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#aws_vpc_configuration PipesPipe#aws_vpc_configuration}
        '''
        value = PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration(
            aws_vpc_configuration=aws_vpc_configuration
        )

        return typing.cast(None, jsii.invoke(self, "putNetworkConfiguration", [value]))

    @jsii.member(jsii_name="putOverrides")
    def put_overrides(
        self,
        *,
        container_override: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride", typing.Dict[builtins.str, typing.Any]]]]] = None,
        cpu: typing.Optional[builtins.str] = None,
        ephemeral_storage: typing.Optional[typing.Union["PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage", typing.Dict[builtins.str, typing.Any]]] = None,
        execution_role_arn: typing.Optional[builtins.str] = None,
        inference_accelerator_override: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride", typing.Dict[builtins.str, typing.Any]]]]] = None,
        memory: typing.Optional[builtins.str] = None,
        task_role_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param container_override: container_override block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#container_override PipesPipe#container_override}
        :param cpu: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cpu PipesPipe#cpu}.
        :param ephemeral_storage: ephemeral_storage block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#ephemeral_storage PipesPipe#ephemeral_storage}
        :param execution_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#execution_role_arn PipesPipe#execution_role_arn}.
        :param inference_accelerator_override: inference_accelerator_override block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#inference_accelerator_override PipesPipe#inference_accelerator_override}
        :param memory: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory PipesPipe#memory}.
        :param task_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#task_role_arn PipesPipe#task_role_arn}.
        '''
        value = PipesPipeTargetParametersEcsTaskParametersOverrides(
            container_override=container_override,
            cpu=cpu,
            ephemeral_storage=ephemeral_storage,
            execution_role_arn=execution_role_arn,
            inference_accelerator_override=inference_accelerator_override,
            memory=memory,
            task_role_arn=task_role_arn,
        )

        return typing.cast(None, jsii.invoke(self, "putOverrides", [value]))

    @jsii.member(jsii_name="putPlacementConstraint")
    def put_placement_constraint(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersPlacementConstraint", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a03fb62d00098866bcc9f27ac7e1b5d7a9ce419cdb049a8dfa839f15589eee38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPlacementConstraint", [value]))

    @jsii.member(jsii_name="putPlacementStrategy")
    def put_placement_strategy(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersPlacementStrategy", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c38f3856ff7796ebb31c2520f96d9f699ba9e776e21b0dc75dc13c63b9090c9b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPlacementStrategy", [value]))

    @jsii.member(jsii_name="resetCapacityProviderStrategy")
    def reset_capacity_provider_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCapacityProviderStrategy", []))

    @jsii.member(jsii_name="resetEnableEcsManagedTags")
    def reset_enable_ecs_managed_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableEcsManagedTags", []))

    @jsii.member(jsii_name="resetEnableExecuteCommand")
    def reset_enable_execute_command(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableExecuteCommand", []))

    @jsii.member(jsii_name="resetGroup")
    def reset_group(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGroup", []))

    @jsii.member(jsii_name="resetLaunchType")
    def reset_launch_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLaunchType", []))

    @jsii.member(jsii_name="resetNetworkConfiguration")
    def reset_network_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNetworkConfiguration", []))

    @jsii.member(jsii_name="resetOverrides")
    def reset_overrides(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOverrides", []))

    @jsii.member(jsii_name="resetPlacementConstraint")
    def reset_placement_constraint(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPlacementConstraint", []))

    @jsii.member(jsii_name="resetPlacementStrategy")
    def reset_placement_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPlacementStrategy", []))

    @jsii.member(jsii_name="resetPlatformVersion")
    def reset_platform_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPlatformVersion", []))

    @jsii.member(jsii_name="resetPropagateTags")
    def reset_propagate_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPropagateTags", []))

    @jsii.member(jsii_name="resetReferenceId")
    def reset_reference_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReferenceId", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTaskCount")
    def reset_task_count(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTaskCount", []))

    @builtins.property
    @jsii.member(jsii_name="capacityProviderStrategy")
    def capacity_provider_strategy(
        self,
    ) -> PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategyList:
        return typing.cast(PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategyList, jsii.get(self, "capacityProviderStrategy"))

    @builtins.property
    @jsii.member(jsii_name="networkConfiguration")
    def network_configuration(
        self,
    ) -> PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationOutputReference:
        return typing.cast(PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationOutputReference, jsii.get(self, "networkConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="overrides")
    def overrides(
        self,
    ) -> "PipesPipeTargetParametersEcsTaskParametersOverridesOutputReference":
        return typing.cast("PipesPipeTargetParametersEcsTaskParametersOverridesOutputReference", jsii.get(self, "overrides"))

    @builtins.property
    @jsii.member(jsii_name="placementConstraint")
    def placement_constraint(
        self,
    ) -> "PipesPipeTargetParametersEcsTaskParametersPlacementConstraintList":
        return typing.cast("PipesPipeTargetParametersEcsTaskParametersPlacementConstraintList", jsii.get(self, "placementConstraint"))

    @builtins.property
    @jsii.member(jsii_name="placementStrategy")
    def placement_strategy(
        self,
    ) -> "PipesPipeTargetParametersEcsTaskParametersPlacementStrategyList":
        return typing.cast("PipesPipeTargetParametersEcsTaskParametersPlacementStrategyList", jsii.get(self, "placementStrategy"))

    @builtins.property
    @jsii.member(jsii_name="capacityProviderStrategyInput")
    def capacity_provider_strategy_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy]]], jsii.get(self, "capacityProviderStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="enableEcsManagedTagsInput")
    def enable_ecs_managed_tags_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableEcsManagedTagsInput"))

    @builtins.property
    @jsii.member(jsii_name="enableExecuteCommandInput")
    def enable_execute_command_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableExecuteCommandInput"))

    @builtins.property
    @jsii.member(jsii_name="groupInput")
    def group_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "groupInput"))

    @builtins.property
    @jsii.member(jsii_name="launchTypeInput")
    def launch_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "launchTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="networkConfigurationInput")
    def network_configuration_input(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration], jsii.get(self, "networkConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="overridesInput")
    def overrides_input(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersEcsTaskParametersOverrides"]:
        return typing.cast(typing.Optional["PipesPipeTargetParametersEcsTaskParametersOverrides"], jsii.get(self, "overridesInput"))

    @builtins.property
    @jsii.member(jsii_name="placementConstraintInput")
    def placement_constraint_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersPlacementConstraint"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersPlacementConstraint"]]], jsii.get(self, "placementConstraintInput"))

    @builtins.property
    @jsii.member(jsii_name="placementStrategyInput")
    def placement_strategy_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersPlacementStrategy"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersPlacementStrategy"]]], jsii.get(self, "placementStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="platformVersionInput")
    def platform_version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "platformVersionInput"))

    @builtins.property
    @jsii.member(jsii_name="propagateTagsInput")
    def propagate_tags_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "propagateTagsInput"))

    @builtins.property
    @jsii.member(jsii_name="referenceIdInput")
    def reference_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "referenceIdInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="taskCountInput")
    def task_count_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "taskCountInput"))

    @builtins.property
    @jsii.member(jsii_name="taskDefinitionArnInput")
    def task_definition_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "taskDefinitionArnInput"))

    @builtins.property
    @jsii.member(jsii_name="enableEcsManagedTags")
    def enable_ecs_managed_tags(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableEcsManagedTags"))

    @enable_ecs_managed_tags.setter
    def enable_ecs_managed_tags(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d501f5dfe4157869d2da624d7b5ec57fbbf2ac7dc4007064517a686183f7caa2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableEcsManagedTags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enableExecuteCommand")
    def enable_execute_command(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableExecuteCommand"))

    @enable_execute_command.setter
    def enable_execute_command(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__364edabb18823a1e7fbf5bd60903b35417cb044a4f99213065636bfb306c465d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableExecuteCommand", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="group")
    def group(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "group"))

    @group.setter
    def group(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d662ebd986e27b948bb15b0cc3659e00d2b9c69427234956aba0e0de299f15a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "group", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="launchType")
    def launch_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "launchType"))

    @launch_type.setter
    def launch_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18e13cc32a8d44bd0625ea84e21ff794d0a4c51aeb3748a80f53101b490e9f13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "launchType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="platformVersion")
    def platform_version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "platformVersion"))

    @platform_version.setter
    def platform_version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9a288ab54ee2f226f8462e23ac88640f13f3434fa65636e8dfcd905a6959688)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "platformVersion", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="propagateTags")
    def propagate_tags(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "propagateTags"))

    @propagate_tags.setter
    def propagate_tags(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8835698d9525f70a55319c99f1ca48bf98d537ba68f9fa7c027c3a3c94d78b6f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "propagateTags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="referenceId")
    def reference_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "referenceId"))

    @reference_id.setter
    def reference_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__55ad040deca0c57292fcca3c0ede9ff1e56063bbb60552328e431a530e3d1b90)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "referenceId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2b8d3176ffdfba72bfae1ccfca47128c6a30f8f452efcab0f1d9fd2f7a571587)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="taskCount")
    def task_count(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "taskCount"))

    @task_count.setter
    def task_count(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1449ce48c162b4f2066ab57a6b02d6c1a467e23effc9e524f25422ecdc043f1c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "taskCount", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="taskDefinitionArn")
    def task_definition_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "taskDefinitionArn"))

    @task_definition_arn.setter
    def task_definition_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9e41166613e2dda58535a72914aa837c7f4030c7ddb57f8d08f3950c94f0c4b2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "taskDefinitionArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersEcsTaskParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersEcsTaskParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersEcsTaskParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dcc3548cd6d83d014ca289bcf9ae1e3bb60819081fcd30c584ca963e1a8dda0b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverrides",
    jsii_struct_bases=[],
    name_mapping={
        "container_override": "containerOverride",
        "cpu": "cpu",
        "ephemeral_storage": "ephemeralStorage",
        "execution_role_arn": "executionRoleArn",
        "inference_accelerator_override": "inferenceAcceleratorOverride",
        "memory": "memory",
        "task_role_arn": "taskRoleArn",
    },
)
class PipesPipeTargetParametersEcsTaskParametersOverrides:
    def __init__(
        self,
        *,
        container_override: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride", typing.Dict[builtins.str, typing.Any]]]]] = None,
        cpu: typing.Optional[builtins.str] = None,
        ephemeral_storage: typing.Optional[typing.Union["PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage", typing.Dict[builtins.str, typing.Any]]] = None,
        execution_role_arn: typing.Optional[builtins.str] = None,
        inference_accelerator_override: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride", typing.Dict[builtins.str, typing.Any]]]]] = None,
        memory: typing.Optional[builtins.str] = None,
        task_role_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param container_override: container_override block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#container_override PipesPipe#container_override}
        :param cpu: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cpu PipesPipe#cpu}.
        :param ephemeral_storage: ephemeral_storage block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#ephemeral_storage PipesPipe#ephemeral_storage}
        :param execution_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#execution_role_arn PipesPipe#execution_role_arn}.
        :param inference_accelerator_override: inference_accelerator_override block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#inference_accelerator_override PipesPipe#inference_accelerator_override}
        :param memory: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory PipesPipe#memory}.
        :param task_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#task_role_arn PipesPipe#task_role_arn}.
        '''
        if isinstance(ephemeral_storage, dict):
            ephemeral_storage = PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage(**ephemeral_storage)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__39ef5796f7b54e009f6caa7575aecaca55661acaa198f0cf0ceaa93581507298)
            check_type(argname="argument container_override", value=container_override, expected_type=type_hints["container_override"])
            check_type(argname="argument cpu", value=cpu, expected_type=type_hints["cpu"])
            check_type(argname="argument ephemeral_storage", value=ephemeral_storage, expected_type=type_hints["ephemeral_storage"])
            check_type(argname="argument execution_role_arn", value=execution_role_arn, expected_type=type_hints["execution_role_arn"])
            check_type(argname="argument inference_accelerator_override", value=inference_accelerator_override, expected_type=type_hints["inference_accelerator_override"])
            check_type(argname="argument memory", value=memory, expected_type=type_hints["memory"])
            check_type(argname="argument task_role_arn", value=task_role_arn, expected_type=type_hints["task_role_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if container_override is not None:
            self._values["container_override"] = container_override
        if cpu is not None:
            self._values["cpu"] = cpu
        if ephemeral_storage is not None:
            self._values["ephemeral_storage"] = ephemeral_storage
        if execution_role_arn is not None:
            self._values["execution_role_arn"] = execution_role_arn
        if inference_accelerator_override is not None:
            self._values["inference_accelerator_override"] = inference_accelerator_override
        if memory is not None:
            self._values["memory"] = memory
        if task_role_arn is not None:
            self._values["task_role_arn"] = task_role_arn

    @builtins.property
    def container_override(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride"]]]:
        '''container_override block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#container_override PipesPipe#container_override}
        '''
        result = self._values.get("container_override")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride"]]], result)

    @builtins.property
    def cpu(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cpu PipesPipe#cpu}.'''
        result = self._values.get("cpu")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ephemeral_storage(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage"]:
        '''ephemeral_storage block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#ephemeral_storage PipesPipe#ephemeral_storage}
        '''
        result = self._values.get("ephemeral_storage")
        return typing.cast(typing.Optional["PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage"], result)

    @builtins.property
    def execution_role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#execution_role_arn PipesPipe#execution_role_arn}.'''
        result = self._values.get("execution_role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def inference_accelerator_override(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride"]]]:
        '''inference_accelerator_override block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#inference_accelerator_override PipesPipe#inference_accelerator_override}
        '''
        result = self._values.get("inference_accelerator_override")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride"]]], result)

    @builtins.property
    def memory(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory PipesPipe#memory}.'''
        result = self._values.get("memory")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def task_role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#task_role_arn PipesPipe#task_role_arn}.'''
        result = self._values.get("task_role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParametersOverrides(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride",
    jsii_struct_bases=[],
    name_mapping={
        "command": "command",
        "cpu": "cpu",
        "environment": "environment",
        "environment_file": "environmentFile",
        "memory": "memory",
        "memory_reservation": "memoryReservation",
        "name": "name",
        "resource_requirement": "resourceRequirement",
    },
)
class PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride:
    def __init__(
        self,
        *,
        command: typing.Optional[typing.Sequence[builtins.str]] = None,
        cpu: typing.Optional[jsii.Number] = None,
        environment: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment", typing.Dict[builtins.str, typing.Any]]]]] = None,
        environment_file: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile", typing.Dict[builtins.str, typing.Any]]]]] = None,
        memory: typing.Optional[jsii.Number] = None,
        memory_reservation: typing.Optional[jsii.Number] = None,
        name: typing.Optional[builtins.str] = None,
        resource_requirement: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param command: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#command PipesPipe#command}.
        :param cpu: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cpu PipesPipe#cpu}.
        :param environment: environment block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment PipesPipe#environment}
        :param environment_file: environment_file block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment_file PipesPipe#environment_file}
        :param memory: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory PipesPipe#memory}.
        :param memory_reservation: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory_reservation PipesPipe#memory_reservation}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.
        :param resource_requirement: resource_requirement block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resource_requirement PipesPipe#resource_requirement}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08577f5d49496f7f571968694c850042b0e12feefefdf2ec9c2529ff41017071)
            check_type(argname="argument command", value=command, expected_type=type_hints["command"])
            check_type(argname="argument cpu", value=cpu, expected_type=type_hints["cpu"])
            check_type(argname="argument environment", value=environment, expected_type=type_hints["environment"])
            check_type(argname="argument environment_file", value=environment_file, expected_type=type_hints["environment_file"])
            check_type(argname="argument memory", value=memory, expected_type=type_hints["memory"])
            check_type(argname="argument memory_reservation", value=memory_reservation, expected_type=type_hints["memory_reservation"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument resource_requirement", value=resource_requirement, expected_type=type_hints["resource_requirement"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if command is not None:
            self._values["command"] = command
        if cpu is not None:
            self._values["cpu"] = cpu
        if environment is not None:
            self._values["environment"] = environment
        if environment_file is not None:
            self._values["environment_file"] = environment_file
        if memory is not None:
            self._values["memory"] = memory
        if memory_reservation is not None:
            self._values["memory_reservation"] = memory_reservation
        if name is not None:
            self._values["name"] = name
        if resource_requirement is not None:
            self._values["resource_requirement"] = resource_requirement

    @builtins.property
    def command(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#command PipesPipe#command}.'''
        result = self._values.get("command")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def cpu(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cpu PipesPipe#cpu}.'''
        result = self._values.get("cpu")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def environment(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment"]]]:
        '''environment block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment PipesPipe#environment}
        '''
        result = self._values.get("environment")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment"]]], result)

    @builtins.property
    def environment_file(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile"]]]:
        '''environment_file block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment_file PipesPipe#environment_file}
        '''
        result = self._values.get("environment_file")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile"]]], result)

    @builtins.property
    def memory(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory PipesPipe#memory}.'''
        result = self._values.get("memory")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def memory_reservation(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory_reservation PipesPipe#memory_reservation}.'''
        result = self._values.get("memory_reservation")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def resource_requirement(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement"]]]:
        '''resource_requirement block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resource_requirement PipesPipe#resource_requirement}
        '''
        result = self._values.get("resource_requirement")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment:
    def __init__(
        self,
        *,
        name: typing.Optional[builtins.str] = None,
        value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#value PipesPipe#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__abcc7d752a0b0bbe8100bccc48e0b6b976aa94bf3d4fc7c99ef1b461d62efcb4)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if name is not None:
            self._values["name"] = name
        if value is not None:
            self._values["value"] = value

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def value(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#value PipesPipe#value}.'''
        result = self._values.get("value")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile",
    jsii_struct_bases=[],
    name_mapping={"type": "type", "value": "value"},
)
class PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile:
    def __init__(self, *, type: builtins.str, value: builtins.str) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#type PipesPipe#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#value PipesPipe#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__da32fd89668e927aee5e7a9bc691be997d0d53e46b9e8935e4bf21745de85042)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "type": type,
            "value": value,
        }

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#type PipesPipe#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#value PipesPipe#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFileList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFileList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__837cc0f4740f9f2c456ea7a9dd0f100fc00fed181d95bf42e1f778c4f9837067)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFileOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41fa5758f10641cb918f0908c9a3a6a897448c182fd6b1aad0bd53b5710389a1)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFileOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__50e522bbcf6d530b35437319bf53be5036ddc54f918845c42e14321616a98288)
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
            type_hints = typing.get_type_hints(_typecheckingstub__66ab9f53f55be41856d6c68b50bc694f073241f3cdb1a35276cf7aa2fc8bae5e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8378a0c74d10217458344ea8b8852d5a51aa35acbc0a526235a3dd3492f00b11)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4f13b0dc4b3d0123e2d9e3c75049a4f8fc4ae90307048139038695d6987b3aba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFileOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFileOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6b98560b32c2ab4514ae22fdc33ce3f64af1c4985dd58c6b1638ad38fd61f99a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__940da95a0fdb9e5551675d6d391974ebe57f6747165df4d645db304b8db3779c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b0369fec71a4a4c0784f5f57304f3cbaa7f4bf9870b43da5388acffbbc89fdbc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__712ef9a9bdef02ff0e3e44fd3fcde8df2a7edfa6625eeaceb8b4ddac65cead50)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2fb12fdba2a97738055a9acd9d1edd3ef6d6f7e0605e99ebd93c02d360bdbfe7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__885a83d33ad0cbb179eb041dc7cfe66ee982d6cbb179dbc63c9f241a26009edc)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87e5b64b5a72a4161b05b8e141b64332361e558d45e126c433dab05ee1e676be)
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
            type_hints = typing.get_type_hints(_typecheckingstub__94c6290d01aebd26e42e8efbff7bf64fa061b7e424d57f3aa3dacdc1c5a260ad)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1975c36fcf2ab6e4132683d2a8194a669b6f648ef1873b66370753775180f359)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bb616c78f8a130e10364eb0443aed234067de419ae888e53be33276b6bc1760c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__74d3490d8a697b21e95ebb5104c4b35bb22264c38f7b02618a19bc78a658cb51)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetValue")
    def reset_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetValue", []))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f28772a13cf0996b95a3a4ef59e22d961a464c654114686d9e2573406e8a9184)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bdb91c8314dffed215b3f7ed841e99d9eb9e8515601e9d4a3b8c9f12b4cc24ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b0f13b189c9a3234170797fc7e919435c49aef9a2d78a6d21ccce2a22a5f3e3c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c054be1c0caea30d56b42e8809d348d7e3fe3016dd9e6aecefb5cbaf4c1ace08)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3cf246fe0c458b5cb86076183cb1fc29e28a9c7af12b6a4c74c808c9ec1cd75)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6c6cdbd91d9d51a9e0dd3bb3341895a8501f716305ae1956f895c9e62a6ba0a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3b1bf0b50836188ccd77712f89c825a344f7551365f89c917816421c1ab9b26a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b7b188f42b35ca45a95a28b10bb977fca01beffe7a0eefa908482d4b90a8db05)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd5652fbac71e0bb2a0876b410930f337fa776fa3f5768bbe634da6b4b64bf8e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1131b3d8ea3ac9b4b74ed18d5d99173fe84a63dbf79f3bd5711d90a307775e56)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putEnvironment")
    def put_environment(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56284afb4ec5438d48c79eda83e31722ec08470111fdba6793af9d3db43d8b93)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEnvironment", [value]))

    @jsii.member(jsii_name="putEnvironmentFile")
    def put_environment_file(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8b4ac9bd66470c77584933f4eb8e48319305d3ed0d02b583643046980d96310)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEnvironmentFile", [value]))

    @jsii.member(jsii_name="putResourceRequirement")
    def put_resource_requirement(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__88fa81cc9f0770d780d5d36ffca245fd3818a0abe7078cef5fd43623a51c57df)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceRequirement", [value]))

    @jsii.member(jsii_name="resetCommand")
    def reset_command(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCommand", []))

    @jsii.member(jsii_name="resetCpu")
    def reset_cpu(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCpu", []))

    @jsii.member(jsii_name="resetEnvironment")
    def reset_environment(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnvironment", []))

    @jsii.member(jsii_name="resetEnvironmentFile")
    def reset_environment_file(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnvironmentFile", []))

    @jsii.member(jsii_name="resetMemory")
    def reset_memory(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMemory", []))

    @jsii.member(jsii_name="resetMemoryReservation")
    def reset_memory_reservation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMemoryReservation", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetResourceRequirement")
    def reset_resource_requirement(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceRequirement", []))

    @builtins.property
    @jsii.member(jsii_name="environment")
    def environment(
        self,
    ) -> PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentList:
        return typing.cast(PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentList, jsii.get(self, "environment"))

    @builtins.property
    @jsii.member(jsii_name="environmentFile")
    def environment_file(
        self,
    ) -> PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFileList:
        return typing.cast(PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFileList, jsii.get(self, "environmentFile"))

    @builtins.property
    @jsii.member(jsii_name="resourceRequirement")
    def resource_requirement(
        self,
    ) -> "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirementList":
        return typing.cast("PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirementList", jsii.get(self, "resourceRequirement"))

    @builtins.property
    @jsii.member(jsii_name="commandInput")
    def command_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "commandInput"))

    @builtins.property
    @jsii.member(jsii_name="cpuInput")
    def cpu_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "cpuInput"))

    @builtins.property
    @jsii.member(jsii_name="environmentFileInput")
    def environment_file_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile]]], jsii.get(self, "environmentFileInput"))

    @builtins.property
    @jsii.member(jsii_name="environmentInput")
    def environment_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment]]], jsii.get(self, "environmentInput"))

    @builtins.property
    @jsii.member(jsii_name="memoryInput")
    def memory_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "memoryInput"))

    @builtins.property
    @jsii.member(jsii_name="memoryReservationInput")
    def memory_reservation_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "memoryReservationInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceRequirementInput")
    def resource_requirement_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement"]]], jsii.get(self, "resourceRequirementInput"))

    @builtins.property
    @jsii.member(jsii_name="command")
    def command(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "command"))

    @command.setter
    def command(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d7196570abd4f64449706643cb19e1c0c3e05e21e36e6eef9cf65e695e5aea4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "command", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="cpu")
    def cpu(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "cpu"))

    @cpu.setter
    def cpu(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__438db7471cda0200f264b2a5ec886b9e160ae2d4cb152d3ec964ab05598fa1ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cpu", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="memory")
    def memory(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "memory"))

    @memory.setter
    def memory(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__697eb797e807769e770ba5e5275436b6444422ff717484db133e5f792f3f127a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "memory", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="memoryReservation")
    def memory_reservation(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "memoryReservation"))

    @memory_reservation.setter
    def memory_reservation(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c95bcb45182e9ac8aa36fa4dcb739bd29ec9b802ffccb5d765dd7b9403a89029)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "memoryReservation", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2853141969137568f955ed60b69b42e3f3e23fe644892183994509dd10cb9286)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ee14f8e6c9dce4f2b76667a92c7ba4bfe1967eddbc80e0f592c19a4392a592f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement",
    jsii_struct_bases=[],
    name_mapping={"type": "type", "value": "value"},
)
class PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement:
    def __init__(self, *, type: builtins.str, value: builtins.str) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#type PipesPipe#type}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#value PipesPipe#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d99303d5f1fc0958d9a6074d7686d41d6df07d958337fc6674862f6b45711371)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "type": type,
            "value": value,
        }

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#type PipesPipe#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#value PipesPipe#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirementList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirementList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ddce4348401790b8c8af5eaf5a2c92a13a3debe397bfdd5d6b3c0695026e0ae7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirementOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d60e8e209ea0a4ee2e3d74266d6c12ea1257133987c5091cf849eadd41e45d7f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirementOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__579ba1bad7764ae050450e8327824c4842ed7ca9bf8f5898cae7457b086456f1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__22d145d864433ca36de637cbdac2e9a1b3ca6ad6ccf2b69d2b4b9dfb2161160f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__778819f2540c0d33cdef632cb83cd1e81af6d86dd166f478bfde49b8f99e9d05)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa401540b3e911ab0225648839cf3cfc4da347d464f33736a7db5989181c4728)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirementOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirementOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__130f88b066663f6286eddf2905664155f6308c18d7db7a4724eba749d1603bda)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__edc5a93fb636d58db6a03850348519812af78e0b38e9a6ce64524d191c7c40bb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__91fa83b1aecf399d2cea2675ed93eb2e4d4f3957c9598e51bf6696a9541426ac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__002a5f760f36de6755482fd15d2183f06f7991a21d2ec27fb8872c31832e0bca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage",
    jsii_struct_bases=[],
    name_mapping={"size_in_gib": "sizeInGib"},
)
class PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage:
    def __init__(self, *, size_in_gib: jsii.Number) -> None:
        '''
        :param size_in_gib: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#size_in_gib PipesPipe#size_in_gib}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c85729766ed1ec77a9dc0398b013a35e37588491331f6f4d059f92edcb690d21)
            check_type(argname="argument size_in_gib", value=size_in_gib, expected_type=type_hints["size_in_gib"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "size_in_gib": size_in_gib,
        }

    @builtins.property
    def size_in_gib(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#size_in_gib PipesPipe#size_in_gib}.'''
        result = self._values.get("size_in_gib")
        assert result is not None, "Required property 'size_in_gib' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorageOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorageOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7b13461d14f5ab49b57434387e6f8b21fff537aa6eb5af5650dc652ece5b6a8f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="sizeInGibInput")
    def size_in_gib_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "sizeInGibInput"))

    @builtins.property
    @jsii.member(jsii_name="sizeInGib")
    def size_in_gib(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "sizeInGib"))

    @size_in_gib.setter
    def size_in_gib(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c43c9b31cd05ce17ee8deb7d3e7295e860321dab82c3a87120122e9a6db3417d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sizeInGib", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f7d01513119afb475159780ff71dfbc087bffb929696a9fec5ff81f4357a730e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride",
    jsii_struct_bases=[],
    name_mapping={"device_name": "deviceName", "device_type": "deviceType"},
)
class PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride:
    def __init__(
        self,
        *,
        device_name: typing.Optional[builtins.str] = None,
        device_type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param device_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#device_name PipesPipe#device_name}.
        :param device_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#device_type PipesPipe#device_type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46135d2d45104ffec0017b83049c98af884157f34dc77b600e3ceaf3fe963e92)
            check_type(argname="argument device_name", value=device_name, expected_type=type_hints["device_name"])
            check_type(argname="argument device_type", value=device_type, expected_type=type_hints["device_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if device_name is not None:
            self._values["device_name"] = device_name
        if device_type is not None:
            self._values["device_type"] = device_type

    @builtins.property
    def device_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#device_name PipesPipe#device_name}.'''
        result = self._values.get("device_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def device_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#device_type PipesPipe#device_type}.'''
        result = self._values.get("device_type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverrideList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverrideList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8162cc44e7d35c5cb0239751f8087f7787e04abb0054c2cb34f22c636d98e518)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverrideOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__03114e72c4322d1b0468630140c70acbcabddb7fa751c4aa4cc890a86232deaf)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverrideOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__868a75718dc3506df9633d25583b662dd21022469f3b0d8ab4423ec8eff818d6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__03a38f857a837ef15f5d9279f44dcfeb6a578799d7f2591a8aae50d22396db4b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2ea1dcd5a5c0994d4abf7f5ef11fc11d5bb48c332fbb3b28de948dd22033ca8a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b8943b3d0a8ab996fc8f657e53f03fa3b607113fdece8d5856facd126a8adfe2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverrideOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverrideOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7b2f57149ad07c54e81b03ac1f4d74184b46946c1753dda2585de32e5493bcf4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetDeviceName")
    def reset_device_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeviceName", []))

    @jsii.member(jsii_name="resetDeviceType")
    def reset_device_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeviceType", []))

    @builtins.property
    @jsii.member(jsii_name="deviceNameInput")
    def device_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deviceNameInput"))

    @builtins.property
    @jsii.member(jsii_name="deviceTypeInput")
    def device_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deviceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="deviceName")
    def device_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deviceName"))

    @device_name.setter
    def device_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c1aac100c4a67ddfd9c026c6b33cd6787cd9502c0d8d3244030bd60916483cf6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deviceName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deviceType")
    def device_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deviceType"))

    @device_type.setter
    def device_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__91010cde68d7699bb22a10722ae0ee60012d7a40b5ae36ccb41962a2bbc66bda)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deviceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59e136d5a2da6f87a4383ea45669c84249f77ce8fe592c96a76ef9241433ac7b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersOverridesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1cc2db6a955a456477f8549e67495f6ab55819ce24646f77fa674f4711549cd0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putContainerOverride")
    def put_container_override(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e56feab1e12c961a952310f386425f6ebef0403e3fd9c6d7cfb2fde5b3a9caae)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putContainerOverride", [value]))

    @jsii.member(jsii_name="putEphemeralStorage")
    def put_ephemeral_storage(self, *, size_in_gib: jsii.Number) -> None:
        '''
        :param size_in_gib: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#size_in_gib PipesPipe#size_in_gib}.
        '''
        value = PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage(
            size_in_gib=size_in_gib
        )

        return typing.cast(None, jsii.invoke(self, "putEphemeralStorage", [value]))

    @jsii.member(jsii_name="putInferenceAcceleratorOverride")
    def put_inference_accelerator_override(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d11a6c643bf1ee37b7f958305e0e1396deb14f904e217ef20cb22197948340c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInferenceAcceleratorOverride", [value]))

    @jsii.member(jsii_name="resetContainerOverride")
    def reset_container_override(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerOverride", []))

    @jsii.member(jsii_name="resetCpu")
    def reset_cpu(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCpu", []))

    @jsii.member(jsii_name="resetEphemeralStorage")
    def reset_ephemeral_storage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEphemeralStorage", []))

    @jsii.member(jsii_name="resetExecutionRoleArn")
    def reset_execution_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExecutionRoleArn", []))

    @jsii.member(jsii_name="resetInferenceAcceleratorOverride")
    def reset_inference_accelerator_override(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInferenceAcceleratorOverride", []))

    @jsii.member(jsii_name="resetMemory")
    def reset_memory(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMemory", []))

    @jsii.member(jsii_name="resetTaskRoleArn")
    def reset_task_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTaskRoleArn", []))

    @builtins.property
    @jsii.member(jsii_name="containerOverride")
    def container_override(
        self,
    ) -> PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideList:
        return typing.cast(PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideList, jsii.get(self, "containerOverride"))

    @builtins.property
    @jsii.member(jsii_name="ephemeralStorage")
    def ephemeral_storage(
        self,
    ) -> PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorageOutputReference:
        return typing.cast(PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorageOutputReference, jsii.get(self, "ephemeralStorage"))

    @builtins.property
    @jsii.member(jsii_name="inferenceAcceleratorOverride")
    def inference_accelerator_override(
        self,
    ) -> PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverrideList:
        return typing.cast(PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverrideList, jsii.get(self, "inferenceAcceleratorOverride"))

    @builtins.property
    @jsii.member(jsii_name="containerOverrideInput")
    def container_override_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride]]], jsii.get(self, "containerOverrideInput"))

    @builtins.property
    @jsii.member(jsii_name="cpuInput")
    def cpu_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cpuInput"))

    @builtins.property
    @jsii.member(jsii_name="ephemeralStorageInput")
    def ephemeral_storage_input(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage], jsii.get(self, "ephemeralStorageInput"))

    @builtins.property
    @jsii.member(jsii_name="executionRoleArnInput")
    def execution_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "executionRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="inferenceAcceleratorOverrideInput")
    def inference_accelerator_override_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride]]], jsii.get(self, "inferenceAcceleratorOverrideInput"))

    @builtins.property
    @jsii.member(jsii_name="memoryInput")
    def memory_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "memoryInput"))

    @builtins.property
    @jsii.member(jsii_name="taskRoleArnInput")
    def task_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "taskRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="cpu")
    def cpu(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "cpu"))

    @cpu.setter
    def cpu(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a7481f7f3793659045325f49426a9423c591ac494b819983e8f4a20fd8ca0d57)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cpu", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="executionRoleArn")
    def execution_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "executionRoleArn"))

    @execution_role_arn.setter
    def execution_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed01d3c4cd01d36ba5cc7b7ce4e5cd8960625c0eb32b6c33da838d9e47ef11c6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "executionRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="memory")
    def memory(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "memory"))

    @memory.setter
    def memory(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8bd9d72f00f6e39e5d1cb8c519389941fa1df58ddb1cd8ff8b6145ccfa8a9c1c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "memory", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="taskRoleArn")
    def task_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "taskRoleArn"))

    @task_role_arn.setter
    def task_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6fb89d528e281b49c04758581914c123d8c59aea3eb0d919b7a72d1526a497da)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "taskRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersEcsTaskParametersOverrides]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersEcsTaskParametersOverrides], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersEcsTaskParametersOverrides],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7ad5fcdc0ccb61ebb5952858eb1e511aea0402b2a37dbfdc3932daf12e6f5a26)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersPlacementConstraint",
    jsii_struct_bases=[],
    name_mapping={"expression": "expression", "type": "type"},
)
class PipesPipeTargetParametersEcsTaskParametersPlacementConstraint:
    def __init__(
        self,
        *,
        expression: typing.Optional[builtins.str] = None,
        type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param expression: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#expression PipesPipe#expression}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#type PipesPipe#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1f1b80c0fdb6e6e32812cb651dcde246535a447e93fd235d9d95ad1391262463)
            check_type(argname="argument expression", value=expression, expected_type=type_hints["expression"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if expression is not None:
            self._values["expression"] = expression
        if type is not None:
            self._values["type"] = type

    @builtins.property
    def expression(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#expression PipesPipe#expression}.'''
        result = self._values.get("expression")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#type PipesPipe#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParametersPlacementConstraint(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersEcsTaskParametersPlacementConstraintList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersPlacementConstraintList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b98b3d2d79462c4b6cda9804e3c49d906c0e32b4771f7847299b08a1b91b4410)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeTargetParametersEcsTaskParametersPlacementConstraintOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04200fb9a1e250a6c2af5c4a7ff83b4bef8d0f2f231e27d06360744427462a58)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeTargetParametersEcsTaskParametersPlacementConstraintOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f2ae220dd79fcb8161fdad9377b6d93630fa171db4abd361e0410499178ef879)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3cfc7d67e0d37cb2e65095c9a483370d0c9d42ff8dd1d7c5a40f7b0336f314eb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f06323a77d1cd06629c1ab18920a208670fa7c0068a61c0e2fad9d1f71e5ae32)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersPlacementConstraint]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersPlacementConstraint]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersPlacementConstraint]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f17e10bf5cd5e4f8e77852c5a8df8edb7eecedbdcfa41b22adca9b93d8217aea)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersPlacementConstraintOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersPlacementConstraintOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c239b5fe61c5ec0bf49bf7f0a4880e1725dac8d8e021f0492a4425e78c18df4a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetExpression")
    def reset_expression(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExpression", []))

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @builtins.property
    @jsii.member(jsii_name="expressionInput")
    def expression_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "expressionInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="expression")
    def expression(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "expression"))

    @expression.setter
    def expression(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ebfe58d86c29f438050fe9c705fa0b9437981e9709ac9864e9230a7918118de4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "expression", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f707107be38cabdbea87a25c218e33eb29996b5eb007f2d5023bb0e43ecf7b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersPlacementConstraint]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersPlacementConstraint]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersPlacementConstraint]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e750de8fd3b6f4ea6dbffcc5531e622704249a0766a0844247688cac23ce227)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersPlacementStrategy",
    jsii_struct_bases=[],
    name_mapping={"field": "field", "type": "type"},
)
class PipesPipeTargetParametersEcsTaskParametersPlacementStrategy:
    def __init__(
        self,
        *,
        field: typing.Optional[builtins.str] = None,
        type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param field: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#field PipesPipe#field}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#type PipesPipe#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__52c4a47b6947e234122f991488ae610625c5c7f18841b1bd8c3a2e8dcb6a27d1)
            check_type(argname="argument field", value=field, expected_type=type_hints["field"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if field is not None:
            self._values["field"] = field
        if type is not None:
            self._values["type"] = type

    @builtins.property
    def field(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#field PipesPipe#field}.'''
        result = self._values.get("field")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#type PipesPipe#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEcsTaskParametersPlacementStrategy(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersEcsTaskParametersPlacementStrategyList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersPlacementStrategyList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dd60441eb7dc5ac2c798d3bbc9bf10dc2b0083e1ab73e1535dfeb4e2767b1cf3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeTargetParametersEcsTaskParametersPlacementStrategyOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87b672024e97e2031f681004609c21c70cb695856eafcad68c353e91169c5a63)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeTargetParametersEcsTaskParametersPlacementStrategyOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__76245c33a5ced9f44f3f68e9ce95900a7d5a20025ecbfb38ff680b5799176e46)
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
            type_hints = typing.get_type_hints(_typecheckingstub__af95e95ede77083f37009d51e0da7c02ff780b8379771b5bcac755383ca717f1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4e09d996dacca10a81ffb706f4b17d515ba8f2c008611b13acc35256a4c09871)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersPlacementStrategy]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersPlacementStrategy]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersPlacementStrategy]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6eab37cda13d0daf57207fdae2cace0414ee7c256a549820d9fe0f9176d3c6f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersEcsTaskParametersPlacementStrategyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersPlacementStrategyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__788d0730cbbe98facff623d5a078ddea6f084ef6ff6ac8f03532eed5f0d98443)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetField")
    def reset_field(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetField", []))

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @builtins.property
    @jsii.member(jsii_name="fieldInput")
    def field_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "fieldInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="field")
    def field(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "field"))

    @field.setter
    def field(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c5d243c4776f0c6e3025820b725639cd1057e43b7c7d5dfd9ddc40effbf989a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "field", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__501514a4482eef7481805a02f80e096c124b8505f9c8a0fbeb9356f51124e704)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersPlacementStrategy]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersPlacementStrategy]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersPlacementStrategy]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__886496ed1e2309369e4d185489d9b0657ad374908b70c5360e343eadba3c4f63)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEventbridgeEventBusParameters",
    jsii_struct_bases=[],
    name_mapping={
        "detail_type": "detailType",
        "endpoint_id": "endpointId",
        "resources": "resources",
        "source": "source",
        "time": "time",
    },
)
class PipesPipeTargetParametersEventbridgeEventBusParameters:
    def __init__(
        self,
        *,
        detail_type: typing.Optional[builtins.str] = None,
        endpoint_id: typing.Optional[builtins.str] = None,
        resources: typing.Optional[typing.Sequence[builtins.str]] = None,
        source: typing.Optional[builtins.str] = None,
        time: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param detail_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#detail_type PipesPipe#detail_type}.
        :param endpoint_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#endpoint_id PipesPipe#endpoint_id}.
        :param resources: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resources PipesPipe#resources}.
        :param source: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source PipesPipe#source}.
        :param time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#time PipesPipe#time}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__64e3d6a17ef852c132b2b942afd65a0265c382cfe4d6cae16a1dfa563ef2b5d3)
            check_type(argname="argument detail_type", value=detail_type, expected_type=type_hints["detail_type"])
            check_type(argname="argument endpoint_id", value=endpoint_id, expected_type=type_hints["endpoint_id"])
            check_type(argname="argument resources", value=resources, expected_type=type_hints["resources"])
            check_type(argname="argument source", value=source, expected_type=type_hints["source"])
            check_type(argname="argument time", value=time, expected_type=type_hints["time"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if detail_type is not None:
            self._values["detail_type"] = detail_type
        if endpoint_id is not None:
            self._values["endpoint_id"] = endpoint_id
        if resources is not None:
            self._values["resources"] = resources
        if source is not None:
            self._values["source"] = source
        if time is not None:
            self._values["time"] = time

    @builtins.property
    def detail_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#detail_type PipesPipe#detail_type}.'''
        result = self._values.get("detail_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def endpoint_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#endpoint_id PipesPipe#endpoint_id}.'''
        result = self._values.get("endpoint_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def resources(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resources PipesPipe#resources}.'''
        result = self._values.get("resources")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def source(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source PipesPipe#source}.'''
        result = self._values.get("source")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def time(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#time PipesPipe#time}.'''
        result = self._values.get("time")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersEventbridgeEventBusParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersEventbridgeEventBusParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersEventbridgeEventBusParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0f5a68167e878d4f65efa2416c91f1994664b989256add841e321cb1f3717868)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDetailType")
    def reset_detail_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDetailType", []))

    @jsii.member(jsii_name="resetEndpointId")
    def reset_endpoint_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEndpointId", []))

    @jsii.member(jsii_name="resetResources")
    def reset_resources(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResources", []))

    @jsii.member(jsii_name="resetSource")
    def reset_source(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSource", []))

    @jsii.member(jsii_name="resetTime")
    def reset_time(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTime", []))

    @builtins.property
    @jsii.member(jsii_name="detailTypeInput")
    def detail_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "detailTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="endpointIdInput")
    def endpoint_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endpointIdInput"))

    @builtins.property
    @jsii.member(jsii_name="resourcesInput")
    def resources_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "resourcesInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceInput")
    def source_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceInput"))

    @builtins.property
    @jsii.member(jsii_name="timeInput")
    def time_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "timeInput"))

    @builtins.property
    @jsii.member(jsii_name="detailType")
    def detail_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "detailType"))

    @detail_type.setter
    def detail_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__48951c362039226f068aab684d4f3b626117c6e0c145a7a4b3edbea2f45c8f8b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "detailType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="endpointId")
    def endpoint_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endpointId"))

    @endpoint_id.setter
    def endpoint_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__98228a2f12e1f56c6f040a41e2d8d630b863140a645f13862020273850d1a63d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "endpointId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resources")
    def resources(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "resources"))

    @resources.setter
    def resources(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e2e7a34621651f2bcdefca3fdca20d621a1db43ed923b550b33a196a8b2b553d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resources", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="source")
    def source(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "source"))

    @source.setter
    def source(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ced1edc0e3ddc350a8f0d12d1843ed227b659067378dc189df6126f80e7d0b8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "source", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="time")
    def time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "time"))

    @time.setter
    def time(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__588d324b41630357c366da95f9847fd13891b311db67bee4e0e83b700f2017a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "time", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersEventbridgeEventBusParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersEventbridgeEventBusParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersEventbridgeEventBusParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc7a46eab3d914c898cf9d0bbc206743804a2cf4b5d7e756046e49982f574dc2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersHttpParameters",
    jsii_struct_bases=[],
    name_mapping={
        "header_parameters": "headerParameters",
        "path_parameter_values": "pathParameterValues",
        "query_string_parameters": "queryStringParameters",
    },
)
class PipesPipeTargetParametersHttpParameters:
    def __init__(
        self,
        *,
        header_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        path_parameter_values: typing.Optional[typing.Sequence[builtins.str]] = None,
        query_string_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param header_parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#header_parameters PipesPipe#header_parameters}.
        :param path_parameter_values: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#path_parameter_values PipesPipe#path_parameter_values}.
        :param query_string_parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#query_string_parameters PipesPipe#query_string_parameters}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1b818d22c13aba46b0b27e3ac3a7e7ce27ae675c791db4c1e32143bbfe05a7d)
            check_type(argname="argument header_parameters", value=header_parameters, expected_type=type_hints["header_parameters"])
            check_type(argname="argument path_parameter_values", value=path_parameter_values, expected_type=type_hints["path_parameter_values"])
            check_type(argname="argument query_string_parameters", value=query_string_parameters, expected_type=type_hints["query_string_parameters"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if header_parameters is not None:
            self._values["header_parameters"] = header_parameters
        if path_parameter_values is not None:
            self._values["path_parameter_values"] = path_parameter_values
        if query_string_parameters is not None:
            self._values["query_string_parameters"] = query_string_parameters

    @builtins.property
    def header_parameters(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#header_parameters PipesPipe#header_parameters}.'''
        result = self._values.get("header_parameters")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def path_parameter_values(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#path_parameter_values PipesPipe#path_parameter_values}.'''
        result = self._values.get("path_parameter_values")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def query_string_parameters(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#query_string_parameters PipesPipe#query_string_parameters}.'''
        result = self._values.get("query_string_parameters")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersHttpParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersHttpParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersHttpParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a87550998743aa3d1d25bb5285b190d71a135ba59ac0056590afca4f02591818)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetHeaderParameters")
    def reset_header_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHeaderParameters", []))

    @jsii.member(jsii_name="resetPathParameterValues")
    def reset_path_parameter_values(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPathParameterValues", []))

    @jsii.member(jsii_name="resetQueryStringParameters")
    def reset_query_string_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetQueryStringParameters", []))

    @builtins.property
    @jsii.member(jsii_name="headerParametersInput")
    def header_parameters_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "headerParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="pathParameterValuesInput")
    def path_parameter_values_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "pathParameterValuesInput"))

    @builtins.property
    @jsii.member(jsii_name="queryStringParametersInput")
    def query_string_parameters_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "queryStringParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="headerParameters")
    def header_parameters(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "headerParameters"))

    @header_parameters.setter
    def header_parameters(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87ef980e1c17e4a88e2c135a9f8a96aa092e97a2c3d448406ef5347154da1cd4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "headerParameters", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="pathParameterValues")
    def path_parameter_values(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "pathParameterValues"))

    @path_parameter_values.setter
    def path_parameter_values(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b4ed649f673c8f57d0c8d05411c5850c3a4524d391320d019017d865921cf254)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "pathParameterValues", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="queryStringParameters")
    def query_string_parameters(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "queryStringParameters"))

    @query_string_parameters.setter
    def query_string_parameters(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fbe9fadc6ccdbdcb16aeca176111251514b42027c484154fb7b6aad7e9617a41)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "queryStringParameters", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersHttpParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersHttpParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersHttpParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__19ef0d76bc5132dcce54f51efa0d0af0957f164503fcd3ce105db3ca51d5429d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersKinesisStreamParameters",
    jsii_struct_bases=[],
    name_mapping={"partition_key": "partitionKey"},
)
class PipesPipeTargetParametersKinesisStreamParameters:
    def __init__(self, *, partition_key: builtins.str) -> None:
        '''
        :param partition_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#partition_key PipesPipe#partition_key}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3c85c3db2d2657af20b798fd0bf122fc42b189e2ff3e8c99541d465602e73f3e)
            check_type(argname="argument partition_key", value=partition_key, expected_type=type_hints["partition_key"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "partition_key": partition_key,
        }

    @builtins.property
    def partition_key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#partition_key PipesPipe#partition_key}.'''
        result = self._values.get("partition_key")
        assert result is not None, "Required property 'partition_key' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersKinesisStreamParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersKinesisStreamParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersKinesisStreamParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__93d87f307c417e03a1225e98cde7e33ddfc87ed5a894a708b05a60d06c1331c4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="partitionKeyInput")
    def partition_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "partitionKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="partitionKey")
    def partition_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "partitionKey"))

    @partition_key.setter
    def partition_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea69fe8d76ce0466b01daeca9b9bbca038466d65bea2a2e6b4abd522d6b773e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "partitionKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersKinesisStreamParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersKinesisStreamParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersKinesisStreamParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0a669093e84b493219e8e4bf2f0f01f721486a9bee7e8e3104342e85cbc2de6c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersLambdaFunctionParameters",
    jsii_struct_bases=[],
    name_mapping={"invocation_type": "invocationType"},
)
class PipesPipeTargetParametersLambdaFunctionParameters:
    def __init__(self, *, invocation_type: builtins.str) -> None:
        '''
        :param invocation_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#invocation_type PipesPipe#invocation_type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc3faed38023fe7c76e1a770520539f35cb684d6eafad9d6daa4063db20da256)
            check_type(argname="argument invocation_type", value=invocation_type, expected_type=type_hints["invocation_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "invocation_type": invocation_type,
        }

    @builtins.property
    def invocation_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#invocation_type PipesPipe#invocation_type}.'''
        result = self._values.get("invocation_type")
        assert result is not None, "Required property 'invocation_type' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersLambdaFunctionParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersLambdaFunctionParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersLambdaFunctionParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d78227ba17aba3b3a375a69c2fabde662ae32080086374e1260134f695271779)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="invocationTypeInput")
    def invocation_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "invocationTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="invocationType")
    def invocation_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "invocationType"))

    @invocation_type.setter
    def invocation_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fedcf2d0a7b5a062eabc06ef9770edb1869cf665be071c97e3493d8e05781379)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "invocationType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersLambdaFunctionParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersLambdaFunctionParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersLambdaFunctionParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2944ae29cc928bdaab221437a3ca0e100891d639eb674c6d1f3559f7789ecc07)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__eed814113674132d3f46d9eb1e93381ef144c3e44689770a1a6564361e97cd35)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putBatchJobParameters")
    def put_batch_job_parameters(
        self,
        *,
        job_definition: builtins.str,
        job_name: builtins.str,
        array_properties: typing.Optional[typing.Union[PipesPipeTargetParametersBatchJobParametersArrayProperties, typing.Dict[builtins.str, typing.Any]]] = None,
        container_overrides: typing.Optional[typing.Union[PipesPipeTargetParametersBatchJobParametersContainerOverrides, typing.Dict[builtins.str, typing.Any]]] = None,
        depends_on: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersBatchJobParametersDependsOn, typing.Dict[builtins.str, typing.Any]]]]] = None,
        parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        retry_strategy: typing.Optional[typing.Union[PipesPipeTargetParametersBatchJobParametersRetryStrategy, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param job_definition: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#job_definition PipesPipe#job_definition}.
        :param job_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#job_name PipesPipe#job_name}.
        :param array_properties: array_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#array_properties PipesPipe#array_properties}
        :param container_overrides: container_overrides block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#container_overrides PipesPipe#container_overrides}
        :param depends_on: depends_on block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#depends_on PipesPipe#depends_on}
        :param parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parameters PipesPipe#parameters}.
        :param retry_strategy: retry_strategy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#retry_strategy PipesPipe#retry_strategy}
        '''
        value = PipesPipeTargetParametersBatchJobParameters(
            job_definition=job_definition,
            job_name=job_name,
            array_properties=array_properties,
            container_overrides=container_overrides,
            depends_on=depends_on,
            parameters=parameters,
            retry_strategy=retry_strategy,
        )

        return typing.cast(None, jsii.invoke(self, "putBatchJobParameters", [value]))

    @jsii.member(jsii_name="putCloudwatchLogsParameters")
    def put_cloudwatch_logs_parameters(
        self,
        *,
        log_stream_name: typing.Optional[builtins.str] = None,
        timestamp: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param log_stream_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_stream_name PipesPipe#log_stream_name}.
        :param timestamp: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#timestamp PipesPipe#timestamp}.
        '''
        value = PipesPipeTargetParametersCloudwatchLogsParameters(
            log_stream_name=log_stream_name, timestamp=timestamp
        )

        return typing.cast(None, jsii.invoke(self, "putCloudwatchLogsParameters", [value]))

    @jsii.member(jsii_name="putEcsTaskParameters")
    def put_ecs_task_parameters(
        self,
        *,
        task_definition_arn: builtins.str,
        capacity_provider_strategy: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy, typing.Dict[builtins.str, typing.Any]]]]] = None,
        enable_ecs_managed_tags: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_execute_command: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        group: typing.Optional[builtins.str] = None,
        launch_type: typing.Optional[builtins.str] = None,
        network_configuration: typing.Optional[typing.Union[PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
        overrides: typing.Optional[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverrides, typing.Dict[builtins.str, typing.Any]]] = None,
        placement_constraint: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersPlacementConstraint, typing.Dict[builtins.str, typing.Any]]]]] = None,
        placement_strategy: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersPlacementStrategy, typing.Dict[builtins.str, typing.Any]]]]] = None,
        platform_version: typing.Optional[builtins.str] = None,
        propagate_tags: typing.Optional[builtins.str] = None,
        reference_id: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        task_count: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param task_definition_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#task_definition_arn PipesPipe#task_definition_arn}.
        :param capacity_provider_strategy: capacity_provider_strategy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#capacity_provider_strategy PipesPipe#capacity_provider_strategy}
        :param enable_ecs_managed_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enable_ecs_managed_tags PipesPipe#enable_ecs_managed_tags}.
        :param enable_execute_command: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#enable_execute_command PipesPipe#enable_execute_command}.
        :param group: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#group PipesPipe#group}.
        :param launch_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#launch_type PipesPipe#launch_type}.
        :param network_configuration: network_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#network_configuration PipesPipe#network_configuration}
        :param overrides: overrides block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#overrides PipesPipe#overrides}
        :param placement_constraint: placement_constraint block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#placement_constraint PipesPipe#placement_constraint}
        :param placement_strategy: placement_strategy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#placement_strategy PipesPipe#placement_strategy}
        :param platform_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#platform_version PipesPipe#platform_version}.
        :param propagate_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#propagate_tags PipesPipe#propagate_tags}.
        :param reference_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#reference_id PipesPipe#reference_id}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#tags PipesPipe#tags}.
        :param task_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#task_count PipesPipe#task_count}.
        '''
        value = PipesPipeTargetParametersEcsTaskParameters(
            task_definition_arn=task_definition_arn,
            capacity_provider_strategy=capacity_provider_strategy,
            enable_ecs_managed_tags=enable_ecs_managed_tags,
            enable_execute_command=enable_execute_command,
            group=group,
            launch_type=launch_type,
            network_configuration=network_configuration,
            overrides=overrides,
            placement_constraint=placement_constraint,
            placement_strategy=placement_strategy,
            platform_version=platform_version,
            propagate_tags=propagate_tags,
            reference_id=reference_id,
            tags=tags,
            task_count=task_count,
        )

        return typing.cast(None, jsii.invoke(self, "putEcsTaskParameters", [value]))

    @jsii.member(jsii_name="putEventbridgeEventBusParameters")
    def put_eventbridge_event_bus_parameters(
        self,
        *,
        detail_type: typing.Optional[builtins.str] = None,
        endpoint_id: typing.Optional[builtins.str] = None,
        resources: typing.Optional[typing.Sequence[builtins.str]] = None,
        source: typing.Optional[builtins.str] = None,
        time: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param detail_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#detail_type PipesPipe#detail_type}.
        :param endpoint_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#endpoint_id PipesPipe#endpoint_id}.
        :param resources: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resources PipesPipe#resources}.
        :param source: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#source PipesPipe#source}.
        :param time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#time PipesPipe#time}.
        '''
        value = PipesPipeTargetParametersEventbridgeEventBusParameters(
            detail_type=detail_type,
            endpoint_id=endpoint_id,
            resources=resources,
            source=source,
            time=time,
        )

        return typing.cast(None, jsii.invoke(self, "putEventbridgeEventBusParameters", [value]))

    @jsii.member(jsii_name="putHttpParameters")
    def put_http_parameters(
        self,
        *,
        header_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        path_parameter_values: typing.Optional[typing.Sequence[builtins.str]] = None,
        query_string_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param header_parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#header_parameters PipesPipe#header_parameters}.
        :param path_parameter_values: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#path_parameter_values PipesPipe#path_parameter_values}.
        :param query_string_parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#query_string_parameters PipesPipe#query_string_parameters}.
        '''
        value = PipesPipeTargetParametersHttpParameters(
            header_parameters=header_parameters,
            path_parameter_values=path_parameter_values,
            query_string_parameters=query_string_parameters,
        )

        return typing.cast(None, jsii.invoke(self, "putHttpParameters", [value]))

    @jsii.member(jsii_name="putKinesisStreamParameters")
    def put_kinesis_stream_parameters(self, *, partition_key: builtins.str) -> None:
        '''
        :param partition_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#partition_key PipesPipe#partition_key}.
        '''
        value = PipesPipeTargetParametersKinesisStreamParameters(
            partition_key=partition_key
        )

        return typing.cast(None, jsii.invoke(self, "putKinesisStreamParameters", [value]))

    @jsii.member(jsii_name="putLambdaFunctionParameters")
    def put_lambda_function_parameters(self, *, invocation_type: builtins.str) -> None:
        '''
        :param invocation_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#invocation_type PipesPipe#invocation_type}.
        '''
        value = PipesPipeTargetParametersLambdaFunctionParameters(
            invocation_type=invocation_type
        )

        return typing.cast(None, jsii.invoke(self, "putLambdaFunctionParameters", [value]))

    @jsii.member(jsii_name="putRedshiftDataParameters")
    def put_redshift_data_parameters(
        self,
        *,
        database: builtins.str,
        sqls: typing.Sequence[builtins.str],
        db_user: typing.Optional[builtins.str] = None,
        secret_manager_arn: typing.Optional[builtins.str] = None,
        statement_name: typing.Optional[builtins.str] = None,
        with_event: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param database: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#database PipesPipe#database}.
        :param sqls: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqls PipesPipe#sqls}.
        :param db_user: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#db_user PipesPipe#db_user}.
        :param secret_manager_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#secret_manager_arn PipesPipe#secret_manager_arn}.
        :param statement_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#statement_name PipesPipe#statement_name}.
        :param with_event: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#with_event PipesPipe#with_event}.
        '''
        value = PipesPipeTargetParametersRedshiftDataParameters(
            database=database,
            sqls=sqls,
            db_user=db_user,
            secret_manager_arn=secret_manager_arn,
            statement_name=statement_name,
            with_event=with_event,
        )

        return typing.cast(None, jsii.invoke(self, "putRedshiftDataParameters", [value]))

    @jsii.member(jsii_name="putSagemakerPipelineParameters")
    def put_sagemaker_pipeline_parameters(
        self,
        *,
        pipeline_parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param pipeline_parameter: pipeline_parameter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#pipeline_parameter PipesPipe#pipeline_parameter}
        '''
        value = PipesPipeTargetParametersSagemakerPipelineParameters(
            pipeline_parameter=pipeline_parameter
        )

        return typing.cast(None, jsii.invoke(self, "putSagemakerPipelineParameters", [value]))

    @jsii.member(jsii_name="putSqsQueueParameters")
    def put_sqs_queue_parameters(
        self,
        *,
        message_deduplication_id: typing.Optional[builtins.str] = None,
        message_group_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param message_deduplication_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#message_deduplication_id PipesPipe#message_deduplication_id}.
        :param message_group_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#message_group_id PipesPipe#message_group_id}.
        '''
        value = PipesPipeTargetParametersSqsQueueParameters(
            message_deduplication_id=message_deduplication_id,
            message_group_id=message_group_id,
        )

        return typing.cast(None, jsii.invoke(self, "putSqsQueueParameters", [value]))

    @jsii.member(jsii_name="putStepFunctionStateMachineParameters")
    def put_step_function_state_machine_parameters(
        self,
        *,
        invocation_type: builtins.str,
    ) -> None:
        '''
        :param invocation_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#invocation_type PipesPipe#invocation_type}.
        '''
        value = PipesPipeTargetParametersStepFunctionStateMachineParameters(
            invocation_type=invocation_type
        )

        return typing.cast(None, jsii.invoke(self, "putStepFunctionStateMachineParameters", [value]))

    @jsii.member(jsii_name="resetBatchJobParameters")
    def reset_batch_job_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBatchJobParameters", []))

    @jsii.member(jsii_name="resetCloudwatchLogsParameters")
    def reset_cloudwatch_logs_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCloudwatchLogsParameters", []))

    @jsii.member(jsii_name="resetEcsTaskParameters")
    def reset_ecs_task_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEcsTaskParameters", []))

    @jsii.member(jsii_name="resetEventbridgeEventBusParameters")
    def reset_eventbridge_event_bus_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEventbridgeEventBusParameters", []))

    @jsii.member(jsii_name="resetHttpParameters")
    def reset_http_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHttpParameters", []))

    @jsii.member(jsii_name="resetInputTemplate")
    def reset_input_template(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInputTemplate", []))

    @jsii.member(jsii_name="resetKinesisStreamParameters")
    def reset_kinesis_stream_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKinesisStreamParameters", []))

    @jsii.member(jsii_name="resetLambdaFunctionParameters")
    def reset_lambda_function_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLambdaFunctionParameters", []))

    @jsii.member(jsii_name="resetRedshiftDataParameters")
    def reset_redshift_data_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRedshiftDataParameters", []))

    @jsii.member(jsii_name="resetSagemakerPipelineParameters")
    def reset_sagemaker_pipeline_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerPipelineParameters", []))

    @jsii.member(jsii_name="resetSqsQueueParameters")
    def reset_sqs_queue_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSqsQueueParameters", []))

    @jsii.member(jsii_name="resetStepFunctionStateMachineParameters")
    def reset_step_function_state_machine_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStepFunctionStateMachineParameters", []))

    @builtins.property
    @jsii.member(jsii_name="batchJobParameters")
    def batch_job_parameters(
        self,
    ) -> PipesPipeTargetParametersBatchJobParametersOutputReference:
        return typing.cast(PipesPipeTargetParametersBatchJobParametersOutputReference, jsii.get(self, "batchJobParameters"))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchLogsParameters")
    def cloudwatch_logs_parameters(
        self,
    ) -> PipesPipeTargetParametersCloudwatchLogsParametersOutputReference:
        return typing.cast(PipesPipeTargetParametersCloudwatchLogsParametersOutputReference, jsii.get(self, "cloudwatchLogsParameters"))

    @builtins.property
    @jsii.member(jsii_name="ecsTaskParameters")
    def ecs_task_parameters(
        self,
    ) -> PipesPipeTargetParametersEcsTaskParametersOutputReference:
        return typing.cast(PipesPipeTargetParametersEcsTaskParametersOutputReference, jsii.get(self, "ecsTaskParameters"))

    @builtins.property
    @jsii.member(jsii_name="eventbridgeEventBusParameters")
    def eventbridge_event_bus_parameters(
        self,
    ) -> PipesPipeTargetParametersEventbridgeEventBusParametersOutputReference:
        return typing.cast(PipesPipeTargetParametersEventbridgeEventBusParametersOutputReference, jsii.get(self, "eventbridgeEventBusParameters"))

    @builtins.property
    @jsii.member(jsii_name="httpParameters")
    def http_parameters(self) -> PipesPipeTargetParametersHttpParametersOutputReference:
        return typing.cast(PipesPipeTargetParametersHttpParametersOutputReference, jsii.get(self, "httpParameters"))

    @builtins.property
    @jsii.member(jsii_name="kinesisStreamParameters")
    def kinesis_stream_parameters(
        self,
    ) -> PipesPipeTargetParametersKinesisStreamParametersOutputReference:
        return typing.cast(PipesPipeTargetParametersKinesisStreamParametersOutputReference, jsii.get(self, "kinesisStreamParameters"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionParameters")
    def lambda_function_parameters(
        self,
    ) -> PipesPipeTargetParametersLambdaFunctionParametersOutputReference:
        return typing.cast(PipesPipeTargetParametersLambdaFunctionParametersOutputReference, jsii.get(self, "lambdaFunctionParameters"))

    @builtins.property
    @jsii.member(jsii_name="redshiftDataParameters")
    def redshift_data_parameters(
        self,
    ) -> "PipesPipeTargetParametersRedshiftDataParametersOutputReference":
        return typing.cast("PipesPipeTargetParametersRedshiftDataParametersOutputReference", jsii.get(self, "redshiftDataParameters"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerPipelineParameters")
    def sagemaker_pipeline_parameters(
        self,
    ) -> "PipesPipeTargetParametersSagemakerPipelineParametersOutputReference":
        return typing.cast("PipesPipeTargetParametersSagemakerPipelineParametersOutputReference", jsii.get(self, "sagemakerPipelineParameters"))

    @builtins.property
    @jsii.member(jsii_name="sqsQueueParameters")
    def sqs_queue_parameters(
        self,
    ) -> "PipesPipeTargetParametersSqsQueueParametersOutputReference":
        return typing.cast("PipesPipeTargetParametersSqsQueueParametersOutputReference", jsii.get(self, "sqsQueueParameters"))

    @builtins.property
    @jsii.member(jsii_name="stepFunctionStateMachineParameters")
    def step_function_state_machine_parameters(
        self,
    ) -> "PipesPipeTargetParametersStepFunctionStateMachineParametersOutputReference":
        return typing.cast("PipesPipeTargetParametersStepFunctionStateMachineParametersOutputReference", jsii.get(self, "stepFunctionStateMachineParameters"))

    @builtins.property
    @jsii.member(jsii_name="batchJobParametersInput")
    def batch_job_parameters_input(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersBatchJobParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersBatchJobParameters], jsii.get(self, "batchJobParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchLogsParametersInput")
    def cloudwatch_logs_parameters_input(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersCloudwatchLogsParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersCloudwatchLogsParameters], jsii.get(self, "cloudwatchLogsParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="ecsTaskParametersInput")
    def ecs_task_parameters_input(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersEcsTaskParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersEcsTaskParameters], jsii.get(self, "ecsTaskParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="eventbridgeEventBusParametersInput")
    def eventbridge_event_bus_parameters_input(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersEventbridgeEventBusParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersEventbridgeEventBusParameters], jsii.get(self, "eventbridgeEventBusParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="httpParametersInput")
    def http_parameters_input(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersHttpParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersHttpParameters], jsii.get(self, "httpParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="inputTemplateInput")
    def input_template_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "inputTemplateInput"))

    @builtins.property
    @jsii.member(jsii_name="kinesisStreamParametersInput")
    def kinesis_stream_parameters_input(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersKinesisStreamParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersKinesisStreamParameters], jsii.get(self, "kinesisStreamParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionParametersInput")
    def lambda_function_parameters_input(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersLambdaFunctionParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersLambdaFunctionParameters], jsii.get(self, "lambdaFunctionParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="redshiftDataParametersInput")
    def redshift_data_parameters_input(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersRedshiftDataParameters"]:
        return typing.cast(typing.Optional["PipesPipeTargetParametersRedshiftDataParameters"], jsii.get(self, "redshiftDataParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerPipelineParametersInput")
    def sagemaker_pipeline_parameters_input(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersSagemakerPipelineParameters"]:
        return typing.cast(typing.Optional["PipesPipeTargetParametersSagemakerPipelineParameters"], jsii.get(self, "sagemakerPipelineParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="sqsQueueParametersInput")
    def sqs_queue_parameters_input(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersSqsQueueParameters"]:
        return typing.cast(typing.Optional["PipesPipeTargetParametersSqsQueueParameters"], jsii.get(self, "sqsQueueParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="stepFunctionStateMachineParametersInput")
    def step_function_state_machine_parameters_input(
        self,
    ) -> typing.Optional["PipesPipeTargetParametersStepFunctionStateMachineParameters"]:
        return typing.cast(typing.Optional["PipesPipeTargetParametersStepFunctionStateMachineParameters"], jsii.get(self, "stepFunctionStateMachineParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="inputTemplate")
    def input_template(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "inputTemplate"))

    @input_template.setter
    def input_template(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7cceb44fc81d2219f4551167ad6ba0dd9217bf7ef1b82be523016082548d2fcf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "inputTemplate", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[PipesPipeTargetParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[PipesPipeTargetParameters]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2cf3738308998e94a7fb1c5c68345c78f8848ef36ab022849457d27648c408ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersRedshiftDataParameters",
    jsii_struct_bases=[],
    name_mapping={
        "database": "database",
        "sqls": "sqls",
        "db_user": "dbUser",
        "secret_manager_arn": "secretManagerArn",
        "statement_name": "statementName",
        "with_event": "withEvent",
    },
)
class PipesPipeTargetParametersRedshiftDataParameters:
    def __init__(
        self,
        *,
        database: builtins.str,
        sqls: typing.Sequence[builtins.str],
        db_user: typing.Optional[builtins.str] = None,
        secret_manager_arn: typing.Optional[builtins.str] = None,
        statement_name: typing.Optional[builtins.str] = None,
        with_event: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param database: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#database PipesPipe#database}.
        :param sqls: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqls PipesPipe#sqls}.
        :param db_user: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#db_user PipesPipe#db_user}.
        :param secret_manager_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#secret_manager_arn PipesPipe#secret_manager_arn}.
        :param statement_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#statement_name PipesPipe#statement_name}.
        :param with_event: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#with_event PipesPipe#with_event}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2088ba57199a43e4e536c3f3dd01f9fbd6f0ec9b7656268d55890a616baa8cf)
            check_type(argname="argument database", value=database, expected_type=type_hints["database"])
            check_type(argname="argument sqls", value=sqls, expected_type=type_hints["sqls"])
            check_type(argname="argument db_user", value=db_user, expected_type=type_hints["db_user"])
            check_type(argname="argument secret_manager_arn", value=secret_manager_arn, expected_type=type_hints["secret_manager_arn"])
            check_type(argname="argument statement_name", value=statement_name, expected_type=type_hints["statement_name"])
            check_type(argname="argument with_event", value=with_event, expected_type=type_hints["with_event"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "database": database,
            "sqls": sqls,
        }
        if db_user is not None:
            self._values["db_user"] = db_user
        if secret_manager_arn is not None:
            self._values["secret_manager_arn"] = secret_manager_arn
        if statement_name is not None:
            self._values["statement_name"] = statement_name
        if with_event is not None:
            self._values["with_event"] = with_event

    @builtins.property
    def database(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#database PipesPipe#database}.'''
        result = self._values.get("database")
        assert result is not None, "Required property 'database' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def sqls(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqls PipesPipe#sqls}.'''
        result = self._values.get("sqls")
        assert result is not None, "Required property 'sqls' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def db_user(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#db_user PipesPipe#db_user}.'''
        result = self._values.get("db_user")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def secret_manager_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#secret_manager_arn PipesPipe#secret_manager_arn}.'''
        result = self._values.get("secret_manager_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def statement_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#statement_name PipesPipe#statement_name}.'''
        result = self._values.get("statement_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def with_event(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#with_event PipesPipe#with_event}.'''
        result = self._values.get("with_event")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersRedshiftDataParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersRedshiftDataParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersRedshiftDataParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__29fc7b703cbf71ce2ca881f3560f3a3b9becc5a16368cab00aefa21363165279)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDbUser")
    def reset_db_user(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDbUser", []))

    @jsii.member(jsii_name="resetSecretManagerArn")
    def reset_secret_manager_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecretManagerArn", []))

    @jsii.member(jsii_name="resetStatementName")
    def reset_statement_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatementName", []))

    @jsii.member(jsii_name="resetWithEvent")
    def reset_with_event(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWithEvent", []))

    @builtins.property
    @jsii.member(jsii_name="databaseInput")
    def database_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "databaseInput"))

    @builtins.property
    @jsii.member(jsii_name="dbUserInput")
    def db_user_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dbUserInput"))

    @builtins.property
    @jsii.member(jsii_name="secretManagerArnInput")
    def secret_manager_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "secretManagerArnInput"))

    @builtins.property
    @jsii.member(jsii_name="sqlsInput")
    def sqls_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "sqlsInput"))

    @builtins.property
    @jsii.member(jsii_name="statementNameInput")
    def statement_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statementNameInput"))

    @builtins.property
    @jsii.member(jsii_name="withEventInput")
    def with_event_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "withEventInput"))

    @builtins.property
    @jsii.member(jsii_name="database")
    def database(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "database"))

    @database.setter
    def database(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee6bc2237b1fdb669524d4a9576c66ab7ccf352930fa2fe451223ac8f0d883f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "database", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dbUser")
    def db_user(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dbUser"))

    @db_user.setter
    def db_user(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__194cc724fb61eb846da946fa884ce7ca7e80595b02eb4cd608200b37409f56fc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dbUser", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="secretManagerArn")
    def secret_manager_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "secretManagerArn"))

    @secret_manager_arn.setter
    def secret_manager_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__03e77517152b6c555a05dc5763670715cc14b9576e33086742a0ea06c8366a42)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "secretManagerArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sqls")
    def sqls(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "sqls"))

    @sqls.setter
    def sqls(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__de1923ce3701108574286a65b2bc575b4b169e850303d7bdfa7b454a9d761156)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sqls", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="statementName")
    def statement_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "statementName"))

    @statement_name.setter
    def statement_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c61d6e03896f448aa657171d07872757c5df8e4002808585d1ea5b352322af3c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "statementName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="withEvent")
    def with_event(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "withEvent"))

    @with_event.setter
    def with_event(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__086170e6b99e8cae1c5b3d552ba2332b2bb476079ab2c89ba53b94a837f101cf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "withEvent", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersRedshiftDataParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersRedshiftDataParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersRedshiftDataParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a20bea2648ce70fc4cc37c1d6c3586ebdf6a38e2b977c81cbbaddd231cb914c3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersSagemakerPipelineParameters",
    jsii_struct_bases=[],
    name_mapping={"pipeline_parameter": "pipelineParameter"},
)
class PipesPipeTargetParametersSagemakerPipelineParameters:
    def __init__(
        self,
        *,
        pipeline_parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param pipeline_parameter: pipeline_parameter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#pipeline_parameter PipesPipe#pipeline_parameter}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9853f65935fecfe20b97f340d2ce50af229cb5bffd082901e083a99686d392ec)
            check_type(argname="argument pipeline_parameter", value=pipeline_parameter, expected_type=type_hints["pipeline_parameter"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if pipeline_parameter is not None:
            self._values["pipeline_parameter"] = pipeline_parameter

    @builtins.property
    def pipeline_parameter(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter"]]]:
        '''pipeline_parameter block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#pipeline_parameter PipesPipe#pipeline_parameter}
        '''
        result = self._values.get("pipeline_parameter")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersSagemakerPipelineParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersSagemakerPipelineParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersSagemakerPipelineParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2ae8b850d9695290088f0b4a5275e3435fcfe01041f845bc09b6c04b805a012c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putPipelineParameter")
    def put_pipeline_parameter(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b999f2d2834869dee6139c8c1c38ea98ac6f32c9eed1e31b517008e8016b65a5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPipelineParameter", [value]))

    @jsii.member(jsii_name="resetPipelineParameter")
    def reset_pipeline_parameter(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPipelineParameter", []))

    @builtins.property
    @jsii.member(jsii_name="pipelineParameter")
    def pipeline_parameter(
        self,
    ) -> "PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameterList":
        return typing.cast("PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameterList", jsii.get(self, "pipelineParameter"))

    @builtins.property
    @jsii.member(jsii_name="pipelineParameterInput")
    def pipeline_parameter_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter"]]], jsii.get(self, "pipelineParameterInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersSagemakerPipelineParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersSagemakerPipelineParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersSagemakerPipelineParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e12f26025b41ef3161b84b5db37c97cdabe536569bb3e2de3cc6d609b1f4ae20)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#value PipesPipe#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1fb8c18cd8af725cbf1724f4b4604cd4788e71dfe32626583989a0671109402f)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#value PipesPipe#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameterList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameterList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__439be317a949f657fdf68091e8b0e2275027f583e7a36bbcd30e575ffb1902a9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameterOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__258e2f03a2b49539be3580d681fa2c324fa4c54550c7f3c5f4c804811f583f29)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameterOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e47e1dfb64418d14430e0a21064975fc7cccd333e2eef93e2801edef1d6198fa)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2224fe84476ab7b29f814209e214c4fb619338ac76e07418e8f50830bdaea748)
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
            type_hints = typing.get_type_hints(_typecheckingstub__108883bb5c3fff3d210901240b52833611114d0ba396792eff86b499c9f9d4d7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__136677fd744af5df641f8736536e6e66183565c17c6336f3a3a00883cec50459)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameterOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameterOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cb12e4d536c962818373e82c8ad9a0a966a68597d18cf037be374fbd953d4c8d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6b5777a01e19d4a5c508dd949b5ce6b2619e5acae226110738dbf90f829f5d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__868a1fadee65d058bcb9539e87e9c16f99cb4d52dcf94dcd78564823fe039941)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05db194f5a51f9d0d323cd4086e26a1f0cd8cc00f11a1bac9ab5dfb02bfee23b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersSqsQueueParameters",
    jsii_struct_bases=[],
    name_mapping={
        "message_deduplication_id": "messageDeduplicationId",
        "message_group_id": "messageGroupId",
    },
)
class PipesPipeTargetParametersSqsQueueParameters:
    def __init__(
        self,
        *,
        message_deduplication_id: typing.Optional[builtins.str] = None,
        message_group_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param message_deduplication_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#message_deduplication_id PipesPipe#message_deduplication_id}.
        :param message_group_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#message_group_id PipesPipe#message_group_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efed3bfd2a70305e5e794fc322dc4de6cdce05d2a3d715514106b79659d77d54)
            check_type(argname="argument message_deduplication_id", value=message_deduplication_id, expected_type=type_hints["message_deduplication_id"])
            check_type(argname="argument message_group_id", value=message_group_id, expected_type=type_hints["message_group_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if message_deduplication_id is not None:
            self._values["message_deduplication_id"] = message_deduplication_id
        if message_group_id is not None:
            self._values["message_group_id"] = message_group_id

    @builtins.property
    def message_deduplication_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#message_deduplication_id PipesPipe#message_deduplication_id}.'''
        result = self._values.get("message_deduplication_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def message_group_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#message_group_id PipesPipe#message_group_id}.'''
        result = self._values.get("message_group_id")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersSqsQueueParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersSqsQueueParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersSqsQueueParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5a1d0a9b6ed3597a0c0b7b3c9a9fc69e46b7a0e9a097fa2ccecd0e19352743df)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMessageDeduplicationId")
    def reset_message_deduplication_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMessageDeduplicationId", []))

    @jsii.member(jsii_name="resetMessageGroupId")
    def reset_message_group_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMessageGroupId", []))

    @builtins.property
    @jsii.member(jsii_name="messageDeduplicationIdInput")
    def message_deduplication_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "messageDeduplicationIdInput"))

    @builtins.property
    @jsii.member(jsii_name="messageGroupIdInput")
    def message_group_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "messageGroupIdInput"))

    @builtins.property
    @jsii.member(jsii_name="messageDeduplicationId")
    def message_deduplication_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "messageDeduplicationId"))

    @message_deduplication_id.setter
    def message_deduplication_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__17930916624e8cf254d09e66813a291730b39fc4645c5d5f31cb19f0858a6955)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "messageDeduplicationId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="messageGroupId")
    def message_group_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "messageGroupId"))

    @message_group_id.setter
    def message_group_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3c127f0ef07ab67e6dc79342cc732488e7e0a2605e70ed4a2ad865d5b31d0e5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "messageGroupId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersSqsQueueParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersSqsQueueParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersSqsQueueParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__16ed07e9dd710e7dbb2638da9f458cd8180995515545eba054e3f4b1b36a1f67)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersStepFunctionStateMachineParameters",
    jsii_struct_bases=[],
    name_mapping={"invocation_type": "invocationType"},
)
class PipesPipeTargetParametersStepFunctionStateMachineParameters:
    def __init__(self, *, invocation_type: builtins.str) -> None:
        '''
        :param invocation_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#invocation_type PipesPipe#invocation_type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3a684c789e3784860d87ffef2d3f2166375b9d578883c9575663dc8b294e6a7)
            check_type(argname="argument invocation_type", value=invocation_type, expected_type=type_hints["invocation_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "invocation_type": invocation_type,
        }

    @builtins.property
    def invocation_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#invocation_type PipesPipe#invocation_type}.'''
        result = self._values.get("invocation_type")
        assert result is not None, "Required property 'invocation_type' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTargetParametersStepFunctionStateMachineParameters(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTargetParametersStepFunctionStateMachineParametersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTargetParametersStepFunctionStateMachineParametersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__da7f57cf3815d43c2f7e3e61f2707ee7901ff182c4959c54f9590d84a65a3d72)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="invocationTypeInput")
    def invocation_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "invocationTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="invocationType")
    def invocation_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "invocationType"))

    @invocation_type.setter
    def invocation_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__16cc4e90a098654d071eb848f7c798e1d7c3d3a0dffce9ed472e50987c71a71c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "invocationType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[PipesPipeTargetParametersStepFunctionStateMachineParameters]:
        return typing.cast(typing.Optional[PipesPipeTargetParametersStepFunctionStateMachineParameters], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[PipesPipeTargetParametersStepFunctionStateMachineParameters],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5b2979a64f70ba64c20dc18e1711c0907f194ed0aae562cc5729cdac87eea42c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.pipesPipe.PipesPipeTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class PipesPipeTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#create PipesPipe#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#delete PipesPipe#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#update PipesPipe#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f7a4d59c0892a5c4dc64208d8fc9c621fcd005a1b8526f339c3c1900c5c3c08)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#create PipesPipe#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#delete PipesPipe#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#update PipesPipe#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "PipesPipeTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class PipesPipeTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.pipesPipe.PipesPipeTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__53da592f5df8bcf33a5df03acc622469a0da02749b55ecd85d860bc4f5e39b29)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f6f1941728efd9fb4adf955aa2fa4a4c3bcac08ff08bda80a220cf0734005aff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c9f97d8e99843bbc4c309e4afe91f986f93f217c049966de2ac4b80da9d7d546)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__00dcde33f1154d888e421f0aaf32100bc86cad9f902451ed63c2505674e07b24)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ea27acc74d032408b342da603632e526c1ed494c0c5fd8c3c9e9027d1baae99)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "PipesPipe",
    "PipesPipeConfig",
    "PipesPipeEnrichmentParameters",
    "PipesPipeEnrichmentParametersHttpParameters",
    "PipesPipeEnrichmentParametersHttpParametersOutputReference",
    "PipesPipeEnrichmentParametersOutputReference",
    "PipesPipeLogConfiguration",
    "PipesPipeLogConfigurationCloudwatchLogsLogDestination",
    "PipesPipeLogConfigurationCloudwatchLogsLogDestinationOutputReference",
    "PipesPipeLogConfigurationFirehoseLogDestination",
    "PipesPipeLogConfigurationFirehoseLogDestinationOutputReference",
    "PipesPipeLogConfigurationOutputReference",
    "PipesPipeLogConfigurationS3LogDestination",
    "PipesPipeLogConfigurationS3LogDestinationOutputReference",
    "PipesPipeSourceParameters",
    "PipesPipeSourceParametersActivemqBrokerParameters",
    "PipesPipeSourceParametersActivemqBrokerParametersCredentials",
    "PipesPipeSourceParametersActivemqBrokerParametersCredentialsOutputReference",
    "PipesPipeSourceParametersActivemqBrokerParametersOutputReference",
    "PipesPipeSourceParametersDynamodbStreamParameters",
    "PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig",
    "PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfigOutputReference",
    "PipesPipeSourceParametersDynamodbStreamParametersOutputReference",
    "PipesPipeSourceParametersFilterCriteria",
    "PipesPipeSourceParametersFilterCriteriaFilter",
    "PipesPipeSourceParametersFilterCriteriaFilterList",
    "PipesPipeSourceParametersFilterCriteriaFilterOutputReference",
    "PipesPipeSourceParametersFilterCriteriaOutputReference",
    "PipesPipeSourceParametersKinesisStreamParameters",
    "PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig",
    "PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfigOutputReference",
    "PipesPipeSourceParametersKinesisStreamParametersOutputReference",
    "PipesPipeSourceParametersManagedStreamingKafkaParameters",
    "PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials",
    "PipesPipeSourceParametersManagedStreamingKafkaParametersCredentialsOutputReference",
    "PipesPipeSourceParametersManagedStreamingKafkaParametersOutputReference",
    "PipesPipeSourceParametersOutputReference",
    "PipesPipeSourceParametersRabbitmqBrokerParameters",
    "PipesPipeSourceParametersRabbitmqBrokerParametersCredentials",
    "PipesPipeSourceParametersRabbitmqBrokerParametersCredentialsOutputReference",
    "PipesPipeSourceParametersRabbitmqBrokerParametersOutputReference",
    "PipesPipeSourceParametersSelfManagedKafkaParameters",
    "PipesPipeSourceParametersSelfManagedKafkaParametersCredentials",
    "PipesPipeSourceParametersSelfManagedKafkaParametersCredentialsOutputReference",
    "PipesPipeSourceParametersSelfManagedKafkaParametersOutputReference",
    "PipesPipeSourceParametersSelfManagedKafkaParametersVpc",
    "PipesPipeSourceParametersSelfManagedKafkaParametersVpcOutputReference",
    "PipesPipeSourceParametersSqsQueueParameters",
    "PipesPipeSourceParametersSqsQueueParametersOutputReference",
    "PipesPipeTargetParameters",
    "PipesPipeTargetParametersBatchJobParameters",
    "PipesPipeTargetParametersBatchJobParametersArrayProperties",
    "PipesPipeTargetParametersBatchJobParametersArrayPropertiesOutputReference",
    "PipesPipeTargetParametersBatchJobParametersContainerOverrides",
    "PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment",
    "PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironmentList",
    "PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironmentOutputReference",
    "PipesPipeTargetParametersBatchJobParametersContainerOverridesOutputReference",
    "PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement",
    "PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirementList",
    "PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirementOutputReference",
    "PipesPipeTargetParametersBatchJobParametersDependsOn",
    "PipesPipeTargetParametersBatchJobParametersDependsOnList",
    "PipesPipeTargetParametersBatchJobParametersDependsOnOutputReference",
    "PipesPipeTargetParametersBatchJobParametersOutputReference",
    "PipesPipeTargetParametersBatchJobParametersRetryStrategy",
    "PipesPipeTargetParametersBatchJobParametersRetryStrategyOutputReference",
    "PipesPipeTargetParametersCloudwatchLogsParameters",
    "PipesPipeTargetParametersCloudwatchLogsParametersOutputReference",
    "PipesPipeTargetParametersEcsTaskParameters",
    "PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy",
    "PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategyList",
    "PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategyOutputReference",
    "PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration",
    "PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration",
    "PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfigurationOutputReference",
    "PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationOutputReference",
    "PipesPipeTargetParametersEcsTaskParametersOutputReference",
    "PipesPipeTargetParametersEcsTaskParametersOverrides",
    "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride",
    "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment",
    "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile",
    "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFileList",
    "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFileOutputReference",
    "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentList",
    "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentOutputReference",
    "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideList",
    "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideOutputReference",
    "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement",
    "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirementList",
    "PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirementOutputReference",
    "PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage",
    "PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorageOutputReference",
    "PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride",
    "PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverrideList",
    "PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverrideOutputReference",
    "PipesPipeTargetParametersEcsTaskParametersOverridesOutputReference",
    "PipesPipeTargetParametersEcsTaskParametersPlacementConstraint",
    "PipesPipeTargetParametersEcsTaskParametersPlacementConstraintList",
    "PipesPipeTargetParametersEcsTaskParametersPlacementConstraintOutputReference",
    "PipesPipeTargetParametersEcsTaskParametersPlacementStrategy",
    "PipesPipeTargetParametersEcsTaskParametersPlacementStrategyList",
    "PipesPipeTargetParametersEcsTaskParametersPlacementStrategyOutputReference",
    "PipesPipeTargetParametersEventbridgeEventBusParameters",
    "PipesPipeTargetParametersEventbridgeEventBusParametersOutputReference",
    "PipesPipeTargetParametersHttpParameters",
    "PipesPipeTargetParametersHttpParametersOutputReference",
    "PipesPipeTargetParametersKinesisStreamParameters",
    "PipesPipeTargetParametersKinesisStreamParametersOutputReference",
    "PipesPipeTargetParametersLambdaFunctionParameters",
    "PipesPipeTargetParametersLambdaFunctionParametersOutputReference",
    "PipesPipeTargetParametersOutputReference",
    "PipesPipeTargetParametersRedshiftDataParameters",
    "PipesPipeTargetParametersRedshiftDataParametersOutputReference",
    "PipesPipeTargetParametersSagemakerPipelineParameters",
    "PipesPipeTargetParametersSagemakerPipelineParametersOutputReference",
    "PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter",
    "PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameterList",
    "PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameterOutputReference",
    "PipesPipeTargetParametersSqsQueueParameters",
    "PipesPipeTargetParametersSqsQueueParametersOutputReference",
    "PipesPipeTargetParametersStepFunctionStateMachineParameters",
    "PipesPipeTargetParametersStepFunctionStateMachineParametersOutputReference",
    "PipesPipeTimeouts",
    "PipesPipeTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__b89e6f44489675daafd151c6aa271f00c16fb4bc092cbdb0120f254b805d7323(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    role_arn: builtins.str,
    source: builtins.str,
    target: builtins.str,
    description: typing.Optional[builtins.str] = None,
    desired_state: typing.Optional[builtins.str] = None,
    enrichment: typing.Optional[builtins.str] = None,
    enrichment_parameters: typing.Optional[typing.Union[PipesPipeEnrichmentParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    kms_key_identifier: typing.Optional[builtins.str] = None,
    log_configuration: typing.Optional[typing.Union[PipesPipeLogConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    source_parameters: typing.Optional[typing.Union[PipesPipeSourceParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    target_parameters: typing.Optional[typing.Union[PipesPipeTargetParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    timeouts: typing.Optional[typing.Union[PipesPipeTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__e8026625d8c8b8b0fe1cb9860ac62a81d34b62aa582b2ce1dc516591a32aa19d(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8fe2d3d11bb97474ee443aed2947f9a88facff277194062eb2845addf7cabe5f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e78f4639feff3ede62c975a8afa02e6e03e0240f580d0fd7b38c65301709ce80(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08feb17a29232b542dc7bc3768a8a0d822f13145a5ce71d31e019c705eeab56f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33b3b81045e38dbb6bff1d1bd8c2f583fd99a49b7858f639c4162ac5103e7c65(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e43012401d6c259e8038e3dcd642031f8410e2f4cfa84b045f68c93bbcd8c6f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d403656ebf3a4924ebf87f30ce8e00a0f53ad45c90073b45790bf1e7e840aa7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e80879332f32ad35067fda6062ecfb7c2678915fc20d09adb95dc40bf7066453(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce9e6578451a5eaec096487a0356ed97e37c41cc13a8827977831da8d9a9a14a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5464f844f2b66ae57d409844423fc9b07694f52e946e75f5feed57b9b05ca4d8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1975a6c8d77d4cd58da559482e21b60f03398d26e569cdfc4c36dc88ccb077bb(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6aa0a93de4275d95e3474317cd02c227cea56022088400367c3ed42f891dae13(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f8e24e90047e07927acb768d52665c8b1561e5494807c049b4c96100177f7f7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8de1ac79f8c2d0d09de9459993b5ba1027a3dc1103f7202ae3c520fc3986978(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    role_arn: builtins.str,
    source: builtins.str,
    target: builtins.str,
    description: typing.Optional[builtins.str] = None,
    desired_state: typing.Optional[builtins.str] = None,
    enrichment: typing.Optional[builtins.str] = None,
    enrichment_parameters: typing.Optional[typing.Union[PipesPipeEnrichmentParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    kms_key_identifier: typing.Optional[builtins.str] = None,
    log_configuration: typing.Optional[typing.Union[PipesPipeLogConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    source_parameters: typing.Optional[typing.Union[PipesPipeSourceParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    target_parameters: typing.Optional[typing.Union[PipesPipeTargetParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    timeouts: typing.Optional[typing.Union[PipesPipeTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4247023c534340b71563f95390bc449795ea54c5b7d59e8b67e7949d8f41b00c(
    *,
    http_parameters: typing.Optional[typing.Union[PipesPipeEnrichmentParametersHttpParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    input_template: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f636e8c9485868602bf4f13ec268e9b45a24119390008e2e3b0b4e654409e272(
    *,
    header_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    path_parameter_values: typing.Optional[typing.Sequence[builtins.str]] = None,
    query_string_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3c9fdbfabafb509d7cb27e1f749e1f8df9e32d1b32a3a305a7916e310faabf76(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7e9d2cf0c7c653b89b7a7bfb58b50e430bca7c5339f9a9d2f632290825f2ede(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f28d88f24366ae32af21382e561c812ceb478e9f7b15ecd313f79b0f0b0cafc6(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42b8db0754ba10d68e70084dee19152d86396fed635618b85c0807255cb045be(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31f0bcf5725634d49c2a58cc78bb0eef7b901056ef4787095e5628773306e03b(
    value: typing.Optional[PipesPipeEnrichmentParametersHttpParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b9443c1d3cf28e8b44f2d54aaaa34c2ac63bdc4b1e68517fc0f0c84ae23dd66(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7a26fa2c595db8042466924793b4e6e7cbb87bf9f2cf7e57dd47de1a74258a79(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d45cf69dc66c73b89d62dcbfe2995d47d5c10146690d4ebe15c7eac69a13355(
    value: typing.Optional[PipesPipeEnrichmentParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7aeea0e3f1ff0ea511087093609d2af8df403bacb838b3ab02551282e770d522(
    *,
    level: builtins.str,
    cloudwatch_logs_log_destination: typing.Optional[typing.Union[PipesPipeLogConfigurationCloudwatchLogsLogDestination, typing.Dict[builtins.str, typing.Any]]] = None,
    firehose_log_destination: typing.Optional[typing.Union[PipesPipeLogConfigurationFirehoseLogDestination, typing.Dict[builtins.str, typing.Any]]] = None,
    include_execution_data: typing.Optional[typing.Sequence[builtins.str]] = None,
    s3_log_destination: typing.Optional[typing.Union[PipesPipeLogConfigurationS3LogDestination, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd285bd6e9ccda20e978fff34cfdeed48c6a0d25ffd929136cac65edbc365cf9(
    *,
    log_group_arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__669b0fb9dc6204f33698bb93f689200cf0ecd7ee3be4255a1eea685adb2727d2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04cbae9b04bb6b44b82d1196d3ab2ed13c07d817bf27dc15e6bd3fe629eec31f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0837a07bec9cd857a96f63a2954836b36d7c0efd22b1b1755fe20a2a56148b2(
    value: typing.Optional[PipesPipeLogConfigurationCloudwatchLogsLogDestination],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6114c0a1ed26a403a78367f5120a5674770dc0d3d11031410fab6b0773a38fa(
    *,
    delivery_stream_arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f29d7a4d660f6273aac4ddee93294ccb68540954ad9aa3b7a10d7340983b6f20(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b5ef324da14198a0dcb38a0b155d3b49b428834add4dceef8d0aef52d364d4f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__13340658e3fb61d48c613bc9613c3eb029514b33df67aec8ea809dddf8ad6a46(
    value: typing.Optional[PipesPipeLogConfigurationFirehoseLogDestination],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__70fb43949f208d1dccfebaa6c21a8bf1622a9a73ff98e4f1d6e4ffe5b916d698(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f287f88f1183e0d338f705c83f621b8184f0149cf1d78cb5e23a420f2d170236(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68dc5fe56dc3f76c6f4dbedc948d8908dbfc1db73b5dccbe9eef152f9d712549(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be7b112b99ec30b8f413ddf338dd66c39838c30edb28e1663f38ba54a9457c74(
    value: typing.Optional[PipesPipeLogConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37571c34d7b37a62522076f63ac96a4532cde781e60925bea341769755b09974(
    *,
    bucket_name: builtins.str,
    bucket_owner: builtins.str,
    output_format: typing.Optional[builtins.str] = None,
    prefix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61119b8e4711355f6fb53d324d2e1e7e244ea3ff49f0ff2bf3c1b64fe77401dc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__92b93571f28bf47304dd639d86a04c3ddaecd700531ea6f73bd7901ed5ef2242(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f551dd21a9b6737471a0228ddecded830649dd4b711594dd14c1700d9e8d852(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7efcab4acdf785e21174b620b0f11540a6072be7e52f26fe789df546ea0458f0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02d84a7cc230d9a6f0a2e8e780952dacd32702843fb4be6fe55ecb0c591b2bf5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a85588aabb8eaab01d77025b55621b945ef178640a02499678d681acd6a96d13(
    value: typing.Optional[PipesPipeLogConfigurationS3LogDestination],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d3ffc28030f6ca5d68facf4e8e5d59dc2e7f40a08696c4d72339cbb11b30f50(
    *,
    activemq_broker_parameters: typing.Optional[typing.Union[PipesPipeSourceParametersActivemqBrokerParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    dynamodb_stream_parameters: typing.Optional[typing.Union[PipesPipeSourceParametersDynamodbStreamParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    filter_criteria: typing.Optional[typing.Union[PipesPipeSourceParametersFilterCriteria, typing.Dict[builtins.str, typing.Any]]] = None,
    kinesis_stream_parameters: typing.Optional[typing.Union[PipesPipeSourceParametersKinesisStreamParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    managed_streaming_kafka_parameters: typing.Optional[typing.Union[PipesPipeSourceParametersManagedStreamingKafkaParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    rabbitmq_broker_parameters: typing.Optional[typing.Union[PipesPipeSourceParametersRabbitmqBrokerParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    self_managed_kafka_parameters: typing.Optional[typing.Union[PipesPipeSourceParametersSelfManagedKafkaParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    sqs_queue_parameters: typing.Optional[typing.Union[PipesPipeSourceParametersSqsQueueParameters, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d55b2cd766db58c0e7eab88ba934ff083f0147a281f6993ded68f00d041c8027(
    *,
    credentials: typing.Union[PipesPipeSourceParametersActivemqBrokerParametersCredentials, typing.Dict[builtins.str, typing.Any]],
    queue_name: builtins.str,
    batch_size: typing.Optional[jsii.Number] = None,
    maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__92457138513fd8e331c29c189da356548843d82dab1dae6d328f98505ea2e48b(
    *,
    basic_auth: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d8bbfd9bcea0314556a7ddb53bd0e4486fee7be82ef4e011d244c7502389528(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd5e1f5d8ff6fe4be538f29a766164a34b07beb43f00136e75e584fb9a13ee6b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7adc334905fe5734b56382b6d7056dad5e0e2711e96a6666e712e771d782a1e(
    value: typing.Optional[PipesPipeSourceParametersActivemqBrokerParametersCredentials],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__26ba1d51d0648056d4cc2fad9458aa48ceb45b40decbbabd207fa493da798909(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49929e3c7cde7049ddd66df39ae492e77dc7feb737a435578f0fbafefc625854(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d836db929b1cc83dfc16558c6d80910dcec488f5ca6b059afb5aa340de1e27e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb0d7615a8273ab83243e61c039541472ec452f66a0ebcf9126f1b577f4942e7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8bc1862a133fac1128a176f2dca1d1a7f273b9c5f93625e294ec051adf4f358(
    value: typing.Optional[PipesPipeSourceParametersActivemqBrokerParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0687a383db9cdaf0b611a20990baa11ccbb6632fc7c74fba9d18d96d8b855a36(
    *,
    starting_position: builtins.str,
    batch_size: typing.Optional[jsii.Number] = None,
    dead_letter_config: typing.Optional[typing.Union[PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
    maximum_record_age_in_seconds: typing.Optional[jsii.Number] = None,
    maximum_retry_attempts: typing.Optional[jsii.Number] = None,
    on_partial_batch_item_failure: typing.Optional[builtins.str] = None,
    parallelization_factor: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3e07dd2f3bd5f02ddfd0d3b1a07903fdf53555683e634c0f0228f5c1e4320df(
    *,
    arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f9e8a11b5438a0246bcb0e54b557dbcb816bc69d942a4b81cff953617e504ac(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__19bc24623aaf63b6e7744d49ecbac349eeb2a797b229fea25bf6c00f9e942ea3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e9693fe51d2e6a8100dc064632f25485620adf5fe3b12d1b876f6447ec759f9(
    value: typing.Optional[PipesPipeSourceParametersDynamodbStreamParametersDeadLetterConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f286ba7778c20d61f6987748b6e996216dfc8acaad93dab7146a7b7eaf9a4b37(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4eeb3a39acd20ef8c146b243248c51974aba64913b5954926a574917aeb9e404(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__011947d897b3186d7650aed26a6c0ccabc3a2b8ef25aa9313b289de2eb1f6b72(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fbee289e529ab01410e77224acfecc9cc7390e7ec55d05270853713d1e403549(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdaa72efb0577dc419d9e4d2583f0507f963d568e91f45f37efe1b2c795f9cae(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d8b861946f998055bbcae39c4723c079d7f344c58b2f71620dc6fc0842a81b3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff51be4e574481f889a1218b6f26db6f7df8ba7e02e5b0f3f58681b797a17d9d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e49815aee67e1b5f36412d4e58a0af07c910abb7f62c37d9329af01fe1ef53c5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__901482e7defbe2379adf48585ef851b3de98feb29c98b823b1df605a55010093(
    value: typing.Optional[PipesPipeSourceParametersDynamodbStreamParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9856f42e2d449ba9002d8d54108b21a151ec50125c0d2c7e8edb15b82f16ba31(
    *,
    filter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeSourceParametersFilterCriteriaFilter, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ad8c73d81c99f61eec0d7f8e17db44f8bc38a916a6ac32675235185713d1eac8(
    *,
    pattern: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__25d41abe05ea17d427e73d3aa70a4620e9fa011ca89361df01430a402a93ad63(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0c6aca63ce0f36728a088351d561b4a188e0b81537e01370a6f8e6135514b67(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dbac4168ddfc80183734bf1c37eb090218be3bf32db6a5c744bf39a9c23d8568(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__757ff1518314ebe127b8dc351a41bf7c55b8896831908ba491773cb03ab83644(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__821c6eeb9fb7136f692caae59be6897283b47d9faf0d0f3561ca76b572021ed8(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e246c549e80a4347af098ba9ad31c36cb4b87b7f0471145f23aa4ea366791c82(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeSourceParametersFilterCriteriaFilter]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__13c16beb42c7e6888de0683c89246749419e4b89dd1fa5251f452213f47d671a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6b3aaffc6167c89dbbe2c7239eda771fd95eedaa62a7d3fdb566ad871ae844e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__179e74b8c703bd09eda1a53889047beb3bbd58bc66b959f2c47bdc425dcf086d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeSourceParametersFilterCriteriaFilter]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2ffaea0067dea924530cd47524988e5155226ba4bdeeafdb40b5d539e6686e1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bfd345a60a35d66ddcc81d254b7aa037251575eec3a0a7f4aa7e352096f8636a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeSourceParametersFilterCriteriaFilter, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8201869cf245198fd4eb0d608a0e49131f660466bc4b63e926dea5220633ae17(
    value: typing.Optional[PipesPipeSourceParametersFilterCriteria],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5f95a126e313490d27a7f201850a6698c578b3f4bfa815cfb417bf9c68a8bd5(
    *,
    starting_position: builtins.str,
    batch_size: typing.Optional[jsii.Number] = None,
    dead_letter_config: typing.Optional[typing.Union[PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
    maximum_record_age_in_seconds: typing.Optional[jsii.Number] = None,
    maximum_retry_attempts: typing.Optional[jsii.Number] = None,
    on_partial_batch_item_failure: typing.Optional[builtins.str] = None,
    parallelization_factor: typing.Optional[jsii.Number] = None,
    starting_position_timestamp: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__74ea332862b7f8ee72669b89a407ddd61ad126fdfeb1f3fa7c867066fda6f825(
    *,
    arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__031c618e35ba0c64db5e617e385eadd07c17dbe97248e8cef8817d3e69be8fba(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94460ebeafa0c3abfbc28921bd09bc56954e1f0266486ba1d7195e3441d040b0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1be3d2130c1e363302b9ae969c447115671bc48704f8bbaf59ab2abfc144be2b(
    value: typing.Optional[PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__221a640a9d0a57a7a5aa24a87a5348f71a8f3d9fbf3962ea4249cf05b0e77e17(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b055fae94e3942c005f07f9f94efc0203bb21becfc44366d8190005de680b079(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ccb81546cbd3b5bdf1140d554641fa633d4da580e036c0cfa9de5e93ef758b21(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__abdc9c142f8b309296e5afae3e025db82f640154008fea431dab1a0f98d5789d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0cf0ebcb5ed8a9b181e85a428ee295f45a791f873daef0e699ffcf3b14d977d9(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53b1d10a90f4b40755d677885bc2eb9d61ec5b399275fa1b8085c027d36dc9e7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__adc7d7710e9c7cede762e77a7037996cb76bbfb2cb41b9d4fe320118feaa6ea7(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44c961654c9c66a1bc2e9f4fd2f9dd0529cde44bfbb441aff48ea7be01e9c72a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dbd774f3b083140291800de2d6365936a5371ea51b65d37e794e89a555f6c03e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae1e0b8294246678fbdb4538770e0c605a67043a9df3f4ea689042c4076b44b5(
    value: typing.Optional[PipesPipeSourceParametersKinesisStreamParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3e11123d9383a36597eb7b57f9a75fe4ede7ae97f9aeb08141d664664dc2de0(
    *,
    topic_name: builtins.str,
    batch_size: typing.Optional[jsii.Number] = None,
    consumer_group_id: typing.Optional[builtins.str] = None,
    credentials: typing.Optional[typing.Union[PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials, typing.Dict[builtins.str, typing.Any]]] = None,
    maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
    starting_position: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__45d3438104698004079d511ed541d41fdc42b2b2f0be095ce812603313cda294(
    *,
    client_certificate_tls_auth: typing.Optional[builtins.str] = None,
    sasl_scram512_auth: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__715d65dd58333451343facf133b2554ded4631040acb6a60273128b7edb21787(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__671291adff4a2dfca0332630f834ad35937e866edf5b1d68f27230a2ddd00584(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86a36f98a948cd46ef019b37c40c486041076a8dae4f006304c0d6b29bbbcadd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f21556764fed2e96d0f00e3857fbe24fe8d76aa9452cc07d7120a34f6174fc9(
    value: typing.Optional[PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c373615458ac9aca86599682f03de4ef6c3c690eceb61f0b5174c3671512fcb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e06777520ad417734f939c4a308e2b189bac59cac8da97e9f3cbca16c96edc54(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__237177ab239a3c80e8deae0cedc5b88124abe094542b40e08fba993a2cc695fb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f29b47895a6656b2783d3f1846618258825633516546e3cd6c2ca95684307a95(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88eccf6a8504b9f93e1a6709bcb875f0a3a38fb054d18ff6052f304b62fb65df(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef883d17345ab9bc1e55a266a303718e81e72d0613624f07d182a0e5101a9ebc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc3189b1a6d52bdd2f4ae86e5836b37bf304714b4914bfc22159d725b291b90f(
    value: typing.Optional[PipesPipeSourceParametersManagedStreamingKafkaParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__66e2329907fb1d3acac80c64b1f0409e3ade33f24465ee75e911ad36a5dc9fb4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90d0de8e0adc643981abdaa29d36e8bf095fc75877b229660975172d3c6e1b86(
    value: typing.Optional[PipesPipeSourceParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e40ad5041151d05360b806cf4c35690abc0cfea9a62eb9f6939be9a0d9641ee(
    *,
    credentials: typing.Union[PipesPipeSourceParametersRabbitmqBrokerParametersCredentials, typing.Dict[builtins.str, typing.Any]],
    queue_name: builtins.str,
    batch_size: typing.Optional[jsii.Number] = None,
    maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
    virtual_host: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05d90e5aba1bbf8c0343f0065a56e20d56ca1f1217a58153b69f22b823d4cb38(
    *,
    basic_auth: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e033f2a2911b8b4cb32861b6716a0fb72a848b0f0042e00b9170d11ae305f2dc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d3937ab4647f5e4fc9532807efa53fce42355dd815821d5626d3b1bd2aeb5b3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__937c11c6154672122e3f914a070ff7662b731d05c4a36ceaf6e4750750778875(
    value: typing.Optional[PipesPipeSourceParametersRabbitmqBrokerParametersCredentials],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__371550d505f967587070567d2f9cccfdf1bcfce61c2e15670038e9746c2e0cb4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02765592f57636a1b818b078484f672270a6b8862cc1fdc59b7289b69703f2f9(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c376b43d03e7837327f536756bf2a3fe61a68d4f0cdb3de0e7eb063129a163d4(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d394a0474ef4ce133aa19c149e9027d7d433ff52c38283ce8dd8d889f46279a0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a93445781a3701f528dc467b6fc35362b482342a2d47d871c9d33963cc9898bc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3135f82c8f85c97ef8e48037fe351f1556a76196990ba6bfbc9a7f5dee00cce5(
    value: typing.Optional[PipesPipeSourceParametersRabbitmqBrokerParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__666f1a73da278e9f9c37601388a46fd58d7db3150fae443824fc1259c7630071(
    *,
    topic_name: builtins.str,
    additional_bootstrap_servers: typing.Optional[typing.Sequence[builtins.str]] = None,
    batch_size: typing.Optional[jsii.Number] = None,
    consumer_group_id: typing.Optional[builtins.str] = None,
    credentials: typing.Optional[typing.Union[PipesPipeSourceParametersSelfManagedKafkaParametersCredentials, typing.Dict[builtins.str, typing.Any]]] = None,
    maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
    server_root_ca_certificate: typing.Optional[builtins.str] = None,
    starting_position: typing.Optional[builtins.str] = None,
    vpc: typing.Optional[typing.Union[PipesPipeSourceParametersSelfManagedKafkaParametersVpc, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f71efa59f4e3386e2c18175c4597eb08b6b72876ba694ad9e8b0a6472a481a8e(
    *,
    basic_auth: typing.Optional[builtins.str] = None,
    client_certificate_tls_auth: typing.Optional[builtins.str] = None,
    sasl_scram256_auth: typing.Optional[builtins.str] = None,
    sasl_scram512_auth: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5eb871f47dd85546bed75e17b7a18e6b65bcd470ccf70f67165bddc8afc49a6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6489b8b62ec9ac0067f72a419ebac6ffe6c3a07bc21396293beac732b73fafb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ecd2500d12d7c2cd874b47c214d49aa91fc458c448229e70c4d90f6a186fb763(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05bf727c171dc1ce8ea1391dfd028b19f623de61a2d5de02746f7910beb8e9e4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a75dd99e800ba072915883faeccc64af08d1279385fca92b85247de4974e7c74(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__499f54720e3f344c62a464441ce5960de0057f4896c72fcdfa52dd1cc8f72be8(
    value: typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParametersCredentials],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9c135ead28ddda8a0b2f5f6ab89b48a3218d653427fc1d892d30c1b87e5b881(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4736c4e40f32169e394a36fb083d49362346cf36b9e012edb5d748ec37dd9e06(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ff7684e6af3ef48ef815627ff1065e0961f7be724b4bb61337cf0ce1d641e8c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4230d7c64b6f740b6c1489fedeca85873add6e7546286bffe8f90e01298736d2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fcfb12bd119501d552199ec66113e03875590c307f4d8e06d9a9cfbe757a7c66(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93b12465659c41ae70e50979824a1ae25f471cbc0685ea8ee612a6c6bdcc6f0d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6682cf2e4db1be3935d15a39a25c0f7a5447092d432f9f641104d1d4f91fb5f5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5646c0d762285f7a1b81f436dbad1ccaa4bc5c39ced787d28f710df36d1272d0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9270b1165449d225a6f6946824d2feca263727d14c989e6652cc9b9ea8ce3b7(
    value: typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c27c2c050c51c630c2b4f1e64a472673bda3900a8b68db6e5e93f92327757564(
    *,
    security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
    subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a1ea60554898cb5fc6babb6ceda4a0d8a561d8b850538b2a4e0962c732a8699(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__de79ce16971f5d3d74f4c9ccae505331b37fb38836d15a4b0753c78ba762eb9f(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__11a8db0fa54c469c092da4bcd60020355be715b744c97abb43a9cc16c16a28c3(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5bfd54af0d669a591d9acada49aec2af97260632b9edc022e74486d423d1fe4(
    value: typing.Optional[PipesPipeSourceParametersSelfManagedKafkaParametersVpc],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e54dfb3f93b2e0f3ff22b99c0abccc0d8c9c09dce0f1d469d0bcac59c03c32d2(
    *,
    batch_size: typing.Optional[jsii.Number] = None,
    maximum_batching_window_in_seconds: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84223229e1bb785498070be2fbb7bd3c938278ad830c8525299142ad11ceb42c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__256ec22a4ac26c314ab966e1195503cd8670029515b81aa27271b91e0ace8b5d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__842b7fa6a7c12ef38a658d0f695305daad265770e937f529e98d5ada4d682b6c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8dd538ab8affb5111324ef141d6953a2e61314e980a2553d14ec499902ba8f1(
    value: typing.Optional[PipesPipeSourceParametersSqsQueueParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9c5885a36ab8ae92f577c0bd8a558592bac45f3626ff0444853581536917ce2(
    *,
    batch_job_parameters: typing.Optional[typing.Union[PipesPipeTargetParametersBatchJobParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    cloudwatch_logs_parameters: typing.Optional[typing.Union[PipesPipeTargetParametersCloudwatchLogsParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    ecs_task_parameters: typing.Optional[typing.Union[PipesPipeTargetParametersEcsTaskParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    eventbridge_event_bus_parameters: typing.Optional[typing.Union[PipesPipeTargetParametersEventbridgeEventBusParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    http_parameters: typing.Optional[typing.Union[PipesPipeTargetParametersHttpParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    input_template: typing.Optional[builtins.str] = None,
    kinesis_stream_parameters: typing.Optional[typing.Union[PipesPipeTargetParametersKinesisStreamParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    lambda_function_parameters: typing.Optional[typing.Union[PipesPipeTargetParametersLambdaFunctionParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    redshift_data_parameters: typing.Optional[typing.Union[PipesPipeTargetParametersRedshiftDataParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    sagemaker_pipeline_parameters: typing.Optional[typing.Union[PipesPipeTargetParametersSagemakerPipelineParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    sqs_queue_parameters: typing.Optional[typing.Union[PipesPipeTargetParametersSqsQueueParameters, typing.Dict[builtins.str, typing.Any]]] = None,
    step_function_state_machine_parameters: typing.Optional[typing.Union[PipesPipeTargetParametersStepFunctionStateMachineParameters, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd88bf3b3d71eedd2ed159b69e0c79d875991062f25963718e514f22f41d440d(
    *,
    job_definition: builtins.str,
    job_name: builtins.str,
    array_properties: typing.Optional[typing.Union[PipesPipeTargetParametersBatchJobParametersArrayProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    container_overrides: typing.Optional[typing.Union[PipesPipeTargetParametersBatchJobParametersContainerOverrides, typing.Dict[builtins.str, typing.Any]]] = None,
    depends_on: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersBatchJobParametersDependsOn, typing.Dict[builtins.str, typing.Any]]]]] = None,
    parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    retry_strategy: typing.Optional[typing.Union[PipesPipeTargetParametersBatchJobParametersRetryStrategy, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c337dccd07514db5f7c6c4690e3e730514a6351e020e76b2ce5d06c4724d83d6(
    *,
    size: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fa85321750217aa5fe4fb36c2fdb1bc4b144e6ed63753a6f2eb9918f2fa4acce(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3cacf4257b4897b73121e1f46aa5447f0c10950ceefe961adf433a5165c4994(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1b1004afd29dbb4b6c3a09ed512f9a178245a74ed5b70c38d4292f9b5359f91(
    value: typing.Optional[PipesPipeTargetParametersBatchJobParametersArrayProperties],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ba72582eabb7ac4d4d3ed1fb921d5d7c544b98b355a2eb5d5e4b768bc21a2a2(
    *,
    command: typing.Optional[typing.Sequence[builtins.str]] = None,
    environment: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment, typing.Dict[builtins.str, typing.Any]]]]] = None,
    instance_type: typing.Optional[builtins.str] = None,
    resource_requirement: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__123149da96222bf9163c435649497b08f880c9d81d510cb4b7a1e03068094c84(
    *,
    name: typing.Optional[builtins.str] = None,
    value: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d12c7250827bc8820bcf195f816fe5aedffc2e911a19091c5426e3bcb1958fab(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf869664cf8bb5a0b40a0b642dd9a237a332c9fb0cda744299ca5f87d22be476(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e3a78fa2155505b68f39e0a0cf77bbe7c1f131de52649f9e5378b5b6158baee(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9b97e0e532d5722c069ad43e7ff65855f3aa16c045f598cb18351723e93fe61(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3709d9a6c294616ac4dce966a2e25549919171d51408e26b8b04d6288f589bd(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cee5e1991b8808baf7eddf486c3a070de5af0d65f769450ee94d2be554e31244(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18ea0750042817d59626a82802d7d4db6e6b95a19c5b0981d3d9c7e885b7f04b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f62c2620795737e7e3c9db8e49b4fd3b12937309c2e598caa8c86ba708935e4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0dacbf48b99e98da440127d95e89500d9c1bb20961f816e383bc198df013f22b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d29373496063c9d2347c732210abd502fda3fc9484156b297127c01df5bad54(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c3ac3006ff4abf99e5a9a4e1f5a749d95825052b6c49c94856334335dfd84dc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f70a620acd175e469b103c860760bddb75e5244ad00d017cda877fa5e332072e(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3802880b3d855bfb2a92f8369587230c569a9fa6cb5b5654037343c91b34832(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__364f7f5097985e2beef14c26f3a7468d7b6f68e35c97329f9c924e96dfc58d84(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59ff26712875ab9036865115b5eecdc0917412d8677a703806b5e6678b26b3f3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e319a80fcad8385de006e70f3d91d0bc2391d1d5694cf2a1222b520e0701a26(
    value: typing.Optional[PipesPipeTargetParametersBatchJobParametersContainerOverrides],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3655b923f048a858d5bcba9963b967c0e5ddd1b8e5ff954bd84bf5de868095bc(
    *,
    type: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a07035f9ad7586bf951abb0bbc2449093485e8cdee806d0fc75b5979d842601(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce477592e619f3a2da4bbbf5c7339a267a956da0b123b43cefef318047ac9c70(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__668dca9c066a86f502fae2099ec33b7b79bc70d79119a9a2d017fb3aa673faf4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bfd3c5a72b6d9540cf4d6fc60f3aea9d1274e2423863758c0cff6d74b9491889(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76a6925388688a6a182292370eb1ad9bf2d67a860082b8774baafd737d5bd217(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f49d8d520b303f5917463c6e4425acc693f4975f1ca4c42592939a19afa480c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef0e0cbab7ee78c0ac413a2f755ff11f0e09806da743b1e4c01cee3fcf902989(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe8ab2b6edbfc46813fab86b75e4d56a12ec91361663abc395a826a7e1a6cbb1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a11ea8d89622e2da3b24b7e018fd9d6f528bc0a129270daecb68bdc08a5eee05(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42a65189c75dae0ba812c806634c81d40598e9550326bb0b3cc0b59dc640ac37(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a901e9218f10f851b16a3dacd4f8c52f8156f0c815f4b609457ef5d67555a79(
    *,
    job_id: typing.Optional[builtins.str] = None,
    type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__563d01db68956c0810b879bac49e11a71399ff4693ab486864bec46b56fa1d9c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0973636d3e140c4bf056fb67e28490dc8899d3fa6113546a59a678fd62555413(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02e38650c52962fd0732eaf414c5035a083b5b85b9f371f3a73846c4809fef61(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94dbe8a835e76aeb9475a7441b5e81956a77219b286a65743411f67ab62835d5(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b500a359d28554c583c26a89315f2c17559637b6b05f29c9c6a2a76f95d75743(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff3685a1042951e3aa8ad38cfdcd3189c69febc9a8880d7ec0348e877ce51348(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersBatchJobParametersDependsOn]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7605a0a40841f7b70584dcdb68c6eca965ec414d772a9d2069e26721e71f5cc2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__286cff0becc48e0cd7f21e3f2f23cc5eb5f73ac4cc03fbdcad543fcd4578abcc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee8aca87211f20d0befb5d7b76dd572ab49ef147b1a6b5d2da3a8100a85a468c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c5322a19347e10f1dc70b509733d55b7cb7097824b5f0e94a0e475eaf950a41(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersBatchJobParametersDependsOn]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31006fdf581d45751e24004f00de7e08f4a804c3ec0869cda41867385743651a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__668fcf57a484a7c0cda4f8688f9b3672b6607a6c102a447fb347a6d1b4d8b271(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersBatchJobParametersDependsOn, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99e6eb7d98c30c03706df8ae62bba35759dc017a62ec6d75ee40c5eeca6b5d9f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c331e52bea5769436141387c090ddd4c0974d3b7deec9ebda3449d086caee466(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a1436ab57ec7820e7262cb6145a167b9b64972358798c55b7533c3e45a2324c(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__748527c429507dc963c901f0593edb55b933a8dd6da6fc7e046c19bbb77ce0a6(
    value: typing.Optional[PipesPipeTargetParametersBatchJobParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d26009a146e84a113dc727308ecf6077796ce66a5f5d8acd865944bd8a2ec2a8(
    *,
    attempts: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b73d2166fe2d5c6683205dc5f7e312642ac51044f29dbec803c8f4b3f728d94(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2150bba12c5dd69e0b5e78183eab2dd9296952d92dd718a0efe56c2082263bfc(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__407f33c36f696c05eff65291d735545d5297e6adcce3ef36805eb25491cd73e2(
    value: typing.Optional[PipesPipeTargetParametersBatchJobParametersRetryStrategy],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ccdb1bb41cf0b4c0d45e71a116ace3ca32e655cc396be11543194daa8404a52(
    *,
    log_stream_name: typing.Optional[builtins.str] = None,
    timestamp: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9baf69fd4ec01625885256da138fd1e0dfdd2a4e4d6873ed7300fd4063ecbe61(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56425ecb3ded45e68a261187a06b593bfff7ef9ddcecf2abe4ef1de97ff269db(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c04e9d2cba4f22dec7f9a3aac24029360059b0a51afeecf28e26c7535b2c10bd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8172e7b44c97730f6237a15f9dba364d19b66ea4a5d9e3689d0b0dc750641f47(
    value: typing.Optional[PipesPipeTargetParametersCloudwatchLogsParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3ad392d65bff780b91549d814469756a62ea739cdbbd752ac5ac4ae7f59f626(
    *,
    task_definition_arn: builtins.str,
    capacity_provider_strategy: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy, typing.Dict[builtins.str, typing.Any]]]]] = None,
    enable_ecs_managed_tags: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_execute_command: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    group: typing.Optional[builtins.str] = None,
    launch_type: typing.Optional[builtins.str] = None,
    network_configuration: typing.Optional[typing.Union[PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    overrides: typing.Optional[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverrides, typing.Dict[builtins.str, typing.Any]]] = None,
    placement_constraint: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersPlacementConstraint, typing.Dict[builtins.str, typing.Any]]]]] = None,
    placement_strategy: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersPlacementStrategy, typing.Dict[builtins.str, typing.Any]]]]] = None,
    platform_version: typing.Optional[builtins.str] = None,
    propagate_tags: typing.Optional[builtins.str] = None,
    reference_id: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    task_count: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb570d0bb3a2894405eb8fedb4fb360ced253ca138a342e5c20a3666fbac4510(
    *,
    capacity_provider: builtins.str,
    base: typing.Optional[jsii.Number] = None,
    weight: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3af14df7e41368b9147b7288120e2c2fdea056aac3a74a416fd9e54efca64e2c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4bdaaf193bfd3b11b110d62be99ef223af9cb474aa4a9e2241981344515af6ce(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7a076fdea0108322e0db68b2e9cf45e742511fec391c6ff7d748101b8400087(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2b5056541fdb2050cd35d4e464c90de250ff9d2a797ef6840fae07c89173fcf(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__20cb6e0275aa5ec7497e1fa0af9abad223472c078518119b30a973873f518dfc(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f87b738a67a0b1414fd61e7393120df430527fe865764f36712f2210ee1f056e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9765328b2cd6e68aadf418aa703c6a64e5337650b2d921ec94b5407d18fce232(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__139474ac8cb7d3cd2ca6e5436fbfdf08fb1527b70766804423117835d23922ed(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee99449ad4a3570a127f1b38c903c1bb9a21064ac43dd6d72b3048a4ad1f0c43(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ddbbb101db159a1191ad7d6c6537e6521f656759a9b51eca685d07019629e01c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4bba523f35c7eae19a8d06a08a349662f5c61ca447c0f5e6bf004c4a554cb8fd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__088fbb821147eb337dac5f1b4f0ca27b6dfb9e4b8cf6796096d7c193261998d8(
    *,
    aws_vpc_configuration: typing.Optional[typing.Union[PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab0ac95a3d62ba0a221832b6bd284bc44b227915fa828d1431d27db62efe4f17(
    *,
    assign_public_ip: typing.Optional[builtins.str] = None,
    security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
    subnets: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9cb7a77a7890594a1ea57b3681371b7c727417eab3f785e80c2f39d084585cd6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb770f4c4136474c11250c19b3cba5feef97cd754c34d86e46315b717497c2d9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a67be150acaa67e45c6b610244e38d907475863f633aeb53d62806e5274e8683(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8636a1ee993c372cf2e3e85ae80bb083ff92c88ee268105530a6040c4d82c330(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a331735de758a50e84b6c4b9663358c8215dbb1d01fa99c19ae6a714f20dda4d(
    value: typing.Optional[PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f98381eb758c8fc2fba1c6d55b3895297fbf2a7e555b9089d0922f20b0d3c014(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a6cd92f6d2a4bbc607dbf1263683b68b3828a5fd003c1d31cb293fb494c8e62(
    value: typing.Optional[PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd6d444abda207a4e11ccdf76aa69137b8e49ab85d68476f0218d3696e505005(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0dacfb03e9c2f2605f897fee19b1e7b92fbf8da44f7878f4b5bd383114a6ca7f(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersCapacityProviderStrategy, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a03fb62d00098866bcc9f27ac7e1b5d7a9ce419cdb049a8dfa839f15589eee38(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersPlacementConstraint, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c38f3856ff7796ebb31c2520f96d9f699ba9e776e21b0dc75dc13c63b9090c9b(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersPlacementStrategy, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d501f5dfe4157869d2da624d7b5ec57fbbf2ac7dc4007064517a686183f7caa2(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__364edabb18823a1e7fbf5bd60903b35417cb044a4f99213065636bfb306c465d(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d662ebd986e27b948bb15b0cc3659e00d2b9c69427234956aba0e0de299f15a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18e13cc32a8d44bd0625ea84e21ff794d0a4c51aeb3748a80f53101b490e9f13(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9a288ab54ee2f226f8462e23ac88640f13f3434fa65636e8dfcd905a6959688(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8835698d9525f70a55319c99f1ca48bf98d537ba68f9fa7c027c3a3c94d78b6f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__55ad040deca0c57292fcca3c0ede9ff1e56063bbb60552328e431a530e3d1b90(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2b8d3176ffdfba72bfae1ccfca47128c6a30f8f452efcab0f1d9fd2f7a571587(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1449ce48c162b4f2066ab57a6b02d6c1a467e23effc9e524f25422ecdc043f1c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e41166613e2dda58535a72914aa837c7f4030c7ddb57f8d08f3950c94f0c4b2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dcc3548cd6d83d014ca289bcf9ae1e3bb60819081fcd30c584ca963e1a8dda0b(
    value: typing.Optional[PipesPipeTargetParametersEcsTaskParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__39ef5796f7b54e009f6caa7575aecaca55661acaa198f0cf0ceaa93581507298(
    *,
    container_override: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride, typing.Dict[builtins.str, typing.Any]]]]] = None,
    cpu: typing.Optional[builtins.str] = None,
    ephemeral_storage: typing.Optional[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage, typing.Dict[builtins.str, typing.Any]]] = None,
    execution_role_arn: typing.Optional[builtins.str] = None,
    inference_accelerator_override: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride, typing.Dict[builtins.str, typing.Any]]]]] = None,
    memory: typing.Optional[builtins.str] = None,
    task_role_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08577f5d49496f7f571968694c850042b0e12feefefdf2ec9c2529ff41017071(
    *,
    command: typing.Optional[typing.Sequence[builtins.str]] = None,
    cpu: typing.Optional[jsii.Number] = None,
    environment: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment, typing.Dict[builtins.str, typing.Any]]]]] = None,
    environment_file: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile, typing.Dict[builtins.str, typing.Any]]]]] = None,
    memory: typing.Optional[jsii.Number] = None,
    memory_reservation: typing.Optional[jsii.Number] = None,
    name: typing.Optional[builtins.str] = None,
    resource_requirement: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__abcc7d752a0b0bbe8100bccc48e0b6b976aa94bf3d4fc7c99ef1b461d62efcb4(
    *,
    name: typing.Optional[builtins.str] = None,
    value: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da32fd89668e927aee5e7a9bc691be997d0d53e46b9e8935e4bf21745de85042(
    *,
    type: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__837cc0f4740f9f2c456ea7a9dd0f100fc00fed181d95bf42e1f778c4f9837067(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41fa5758f10641cb918f0908c9a3a6a897448c182fd6b1aad0bd53b5710389a1(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__50e522bbcf6d530b35437319bf53be5036ddc54f918845c42e14321616a98288(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__66ab9f53f55be41856d6c68b50bc694f073241f3cdb1a35276cf7aa2fc8bae5e(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8378a0c74d10217458344ea8b8852d5a51aa35acbc0a526235a3dd3492f00b11(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f13b0dc4b3d0123e2d9e3c75049a4f8fc4ae90307048139038695d6987b3aba(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b98560b32c2ab4514ae22fdc33ce3f64af1c4985dd58c6b1638ad38fd61f99a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__940da95a0fdb9e5551675d6d391974ebe57f6747165df4d645db304b8db3779c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0369fec71a4a4c0784f5f57304f3cbaa7f4bf9870b43da5388acffbbc89fdbc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__712ef9a9bdef02ff0e3e44fd3fcde8df2a7edfa6625eeaceb8b4ddac65cead50(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2fb12fdba2a97738055a9acd9d1edd3ef6d6f7e0605e99ebd93c02d360bdbfe7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__885a83d33ad0cbb179eb041dc7cfe66ee982d6cbb179dbc63c9f241a26009edc(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87e5b64b5a72a4161b05b8e141b64332361e558d45e126c433dab05ee1e676be(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94c6290d01aebd26e42e8efbff7bf64fa061b7e424d57f3aa3dacdc1c5a260ad(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1975c36fcf2ab6e4132683d2a8194a669b6f648ef1873b66370753775180f359(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb616c78f8a130e10364eb0443aed234067de419ae888e53be33276b6bc1760c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__74d3490d8a697b21e95ebb5104c4b35bb22264c38f7b02618a19bc78a658cb51(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f28772a13cf0996b95a3a4ef59e22d961a464c654114686d9e2573406e8a9184(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdb91c8314dffed215b3f7ed841e99d9eb9e8515601e9d4a3b8c9f12b4cc24ce(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0f13b189c9a3234170797fc7e919435c49aef9a2d78a6d21ccce2a22a5f3e3c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c054be1c0caea30d56b42e8809d348d7e3fe3016dd9e6aecefb5cbaf4c1ace08(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3cf246fe0c458b5cb86076183cb1fc29e28a9c7af12b6a4c74c808c9ec1cd75(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6c6cdbd91d9d51a9e0dd3bb3341895a8501f716305ae1956f895c9e62a6ba0a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b1bf0b50836188ccd77712f89c825a344f7551365f89c917816421c1ab9b26a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7b188f42b35ca45a95a28b10bb977fca01beffe7a0eefa908482d4b90a8db05(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd5652fbac71e0bb2a0876b410930f337fa776fa3f5768bbe634da6b4b64bf8e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1131b3d8ea3ac9b4b74ed18d5d99173fe84a63dbf79f3bd5711d90a307775e56(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56284afb4ec5438d48c79eda83e31722ec08470111fdba6793af9d3db43d8b93(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8b4ac9bd66470c77584933f4eb8e48319305d3ed0d02b583643046980d96310(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88fa81cc9f0770d780d5d36ffca245fd3818a0abe7078cef5fd43623a51c57df(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d7196570abd4f64449706643cb19e1c0c3e05e21e36e6eef9cf65e695e5aea4(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__438db7471cda0200f264b2a5ec886b9e160ae2d4cb152d3ec964ab05598fa1ab(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__697eb797e807769e770ba5e5275436b6444422ff717484db133e5f792f3f127a(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c95bcb45182e9ac8aa36fa4dcb739bd29ec9b802ffccb5d765dd7b9403a89029(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2853141969137568f955ed60b69b42e3f3e23fe644892183994509dd10cb9286(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ee14f8e6c9dce4f2b76667a92c7ba4bfe1967eddbc80e0f592c19a4392a592f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d99303d5f1fc0958d9a6074d7686d41d6df07d958337fc6674862f6b45711371(
    *,
    type: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ddce4348401790b8c8af5eaf5a2c92a13a3debe397bfdd5d6b3c0695026e0ae7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d60e8e209ea0a4ee2e3d74266d6c12ea1257133987c5091cf849eadd41e45d7f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__579ba1bad7764ae050450e8327824c4842ed7ca9bf8f5898cae7457b086456f1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22d145d864433ca36de637cbdac2e9a1b3ca6ad6ccf2b69d2b4b9dfb2161160f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__778819f2540c0d33cdef632cb83cd1e81af6d86dd166f478bfde49b8f99e9d05(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa401540b3e911ab0225648839cf3cfc4da347d464f33736a7db5989181c4728(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__130f88b066663f6286eddf2905664155f6308c18d7db7a4724eba749d1603bda(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__edc5a93fb636d58db6a03850348519812af78e0b38e9a6ce64524d191c7c40bb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__91fa83b1aecf399d2cea2675ed93eb2e4d4f3957c9598e51bf6696a9541426ac(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__002a5f760f36de6755482fd15d2183f06f7991a21d2ec27fb8872c31832e0bca(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c85729766ed1ec77a9dc0398b013a35e37588491331f6f4d059f92edcb690d21(
    *,
    size_in_gib: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b13461d14f5ab49b57434387e6f8b21fff537aa6eb5af5650dc652ece5b6a8f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c43c9b31cd05ce17ee8deb7d3e7295e860321dab82c3a87120122e9a6db3417d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7d01513119afb475159780ff71dfbc087bffb929696a9fec5ff81f4357a730e(
    value: typing.Optional[PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46135d2d45104ffec0017b83049c98af884157f34dc77b600e3ceaf3fe963e92(
    *,
    device_name: typing.Optional[builtins.str] = None,
    device_type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8162cc44e7d35c5cb0239751f8087f7787e04abb0054c2cb34f22c636d98e518(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__03114e72c4322d1b0468630140c70acbcabddb7fa751c4aa4cc890a86232deaf(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__868a75718dc3506df9633d25583b662dd21022469f3b0d8ab4423ec8eff818d6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__03a38f857a837ef15f5d9279f44dcfeb6a578799d7f2591a8aae50d22396db4b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ea1dcd5a5c0994d4abf7f5ef11fc11d5bb48c332fbb3b28de948dd22033ca8a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8943b3d0a8ab996fc8f657e53f03fa3b607113fdece8d5856facd126a8adfe2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b2f57149ad07c54e81b03ac1f4d74184b46946c1753dda2585de32e5493bcf4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1aac100c4a67ddfd9c026c6b33cd6787cd9502c0d8d3244030bd60916483cf6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__91010cde68d7699bb22a10722ae0ee60012d7a40b5ae36ccb41962a2bbc66bda(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59e136d5a2da6f87a4383ea45669c84249f77ce8fe592c96a76ef9241433ac7b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1cc2db6a955a456477f8549e67495f6ab55819ce24646f77fa674f4711549cd0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e56feab1e12c961a952310f386425f6ebef0403e3fd9c6d7cfb2fde5b3a9caae(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d11a6c643bf1ee37b7f958305e0e1396deb14f904e217ef20cb22197948340c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7481f7f3793659045325f49426a9423c591ac494b819983e8f4a20fd8ca0d57(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed01d3c4cd01d36ba5cc7b7ce4e5cd8960625c0eb32b6c33da838d9e47ef11c6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8bd9d72f00f6e39e5d1cb8c519389941fa1df58ddb1cd8ff8b6145ccfa8a9c1c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6fb89d528e281b49c04758581914c123d8c59aea3eb0d919b7a72d1526a497da(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ad5fcdc0ccb61ebb5952858eb1e511aea0402b2a37dbfdc3932daf12e6f5a26(
    value: typing.Optional[PipesPipeTargetParametersEcsTaskParametersOverrides],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f1b80c0fdb6e6e32812cb651dcde246535a447e93fd235d9d95ad1391262463(
    *,
    expression: typing.Optional[builtins.str] = None,
    type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b98b3d2d79462c4b6cda9804e3c49d906c0e32b4771f7847299b08a1b91b4410(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04200fb9a1e250a6c2af5c4a7ff83b4bef8d0f2f231e27d06360744427462a58(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f2ae220dd79fcb8161fdad9377b6d93630fa171db4abd361e0410499178ef879(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3cfc7d67e0d37cb2e65095c9a483370d0c9d42ff8dd1d7c5a40f7b0336f314eb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f06323a77d1cd06629c1ab18920a208670fa7c0068a61c0e2fad9d1f71e5ae32(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f17e10bf5cd5e4f8e77852c5a8df8edb7eecedbdcfa41b22adca9b93d8217aea(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersPlacementConstraint]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c239b5fe61c5ec0bf49bf7f0a4880e1725dac8d8e021f0492a4425e78c18df4a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebfe58d86c29f438050fe9c705fa0b9437981e9709ac9864e9230a7918118de4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f707107be38cabdbea87a25c218e33eb29996b5eb007f2d5023bb0e43ecf7b3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e750de8fd3b6f4ea6dbffcc5531e622704249a0766a0844247688cac23ce227(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersPlacementConstraint]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__52c4a47b6947e234122f991488ae610625c5c7f18841b1bd8c3a2e8dcb6a27d1(
    *,
    field: typing.Optional[builtins.str] = None,
    type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd60441eb7dc5ac2c798d3bbc9bf10dc2b0083e1ab73e1535dfeb4e2767b1cf3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87b672024e97e2031f681004609c21c70cb695856eafcad68c353e91169c5a63(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76245c33a5ced9f44f3f68e9ce95900a7d5a20025ecbfb38ff680b5799176e46(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af95e95ede77083f37009d51e0da7c02ff780b8379771b5bcac755383ca717f1(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e09d996dacca10a81ffb706f4b17d515ba8f2c008611b13acc35256a4c09871(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6eab37cda13d0daf57207fdae2cace0414ee7c256a549820d9fe0f9176d3c6f4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersEcsTaskParametersPlacementStrategy]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__788d0730cbbe98facff623d5a078ddea6f084ef6ff6ac8f03532eed5f0d98443(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c5d243c4776f0c6e3025820b725639cd1057e43b7c7d5dfd9ddc40effbf989a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__501514a4482eef7481805a02f80e096c124b8505f9c8a0fbeb9356f51124e704(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__886496ed1e2309369e4d185489d9b0657ad374908b70c5360e343eadba3c4f63(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersEcsTaskParametersPlacementStrategy]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64e3d6a17ef852c132b2b942afd65a0265c382cfe4d6cae16a1dfa563ef2b5d3(
    *,
    detail_type: typing.Optional[builtins.str] = None,
    endpoint_id: typing.Optional[builtins.str] = None,
    resources: typing.Optional[typing.Sequence[builtins.str]] = None,
    source: typing.Optional[builtins.str] = None,
    time: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f5a68167e878d4f65efa2416c91f1994664b989256add841e321cb1f3717868(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__48951c362039226f068aab684d4f3b626117c6e0c145a7a4b3edbea2f45c8f8b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98228a2f12e1f56c6f040a41e2d8d630b863140a645f13862020273850d1a63d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2e7a34621651f2bcdefca3fdca20d621a1db43ed923b550b33a196a8b2b553d(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ced1edc0e3ddc350a8f0d12d1843ed227b659067378dc189df6126f80e7d0b8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__588d324b41630357c366da95f9847fd13891b311db67bee4e0e83b700f2017a4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc7a46eab3d914c898cf9d0bbc206743804a2cf4b5d7e756046e49982f574dc2(
    value: typing.Optional[PipesPipeTargetParametersEventbridgeEventBusParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1b818d22c13aba46b0b27e3ac3a7e7ce27ae675c791db4c1e32143bbfe05a7d(
    *,
    header_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    path_parameter_values: typing.Optional[typing.Sequence[builtins.str]] = None,
    query_string_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a87550998743aa3d1d25bb5285b190d71a135ba59ac0056590afca4f02591818(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87ef980e1c17e4a88e2c135a9f8a96aa092e97a2c3d448406ef5347154da1cd4(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b4ed649f673c8f57d0c8d05411c5850c3a4524d391320d019017d865921cf254(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fbe9fadc6ccdbdcb16aeca176111251514b42027c484154fb7b6aad7e9617a41(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__19ef0d76bc5132dcce54f51efa0d0af0957f164503fcd3ce105db3ca51d5429d(
    value: typing.Optional[PipesPipeTargetParametersHttpParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3c85c3db2d2657af20b798fd0bf122fc42b189e2ff3e8c99541d465602e73f3e(
    *,
    partition_key: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93d87f307c417e03a1225e98cde7e33ddfc87ed5a894a708b05a60d06c1331c4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea69fe8d76ce0466b01daeca9b9bbca038466d65bea2a2e6b4abd522d6b773e8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a669093e84b493219e8e4bf2f0f01f721486a9bee7e8e3104342e85cbc2de6c(
    value: typing.Optional[PipesPipeTargetParametersKinesisStreamParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc3faed38023fe7c76e1a770520539f35cb684d6eafad9d6daa4063db20da256(
    *,
    invocation_type: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d78227ba17aba3b3a375a69c2fabde662ae32080086374e1260134f695271779(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fedcf2d0a7b5a062eabc06ef9770edb1869cf665be071c97e3493d8e05781379(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2944ae29cc928bdaab221437a3ca0e100891d639eb674c6d1f3559f7789ecc07(
    value: typing.Optional[PipesPipeTargetParametersLambdaFunctionParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eed814113674132d3f46d9eb1e93381ef144c3e44689770a1a6564361e97cd35(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7cceb44fc81d2219f4551167ad6ba0dd9217bf7ef1b82be523016082548d2fcf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2cf3738308998e94a7fb1c5c68345c78f8848ef36ab022849457d27648c408ed(
    value: typing.Optional[PipesPipeTargetParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2088ba57199a43e4e536c3f3dd01f9fbd6f0ec9b7656268d55890a616baa8cf(
    *,
    database: builtins.str,
    sqls: typing.Sequence[builtins.str],
    db_user: typing.Optional[builtins.str] = None,
    secret_manager_arn: typing.Optional[builtins.str] = None,
    statement_name: typing.Optional[builtins.str] = None,
    with_event: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29fc7b703cbf71ce2ca881f3560f3a3b9becc5a16368cab00aefa21363165279(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee6bc2237b1fdb669524d4a9576c66ab7ccf352930fa2fe451223ac8f0d883f9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__194cc724fb61eb846da946fa884ce7ca7e80595b02eb4cd608200b37409f56fc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__03e77517152b6c555a05dc5763670715cc14b9576e33086742a0ea06c8366a42(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__de1923ce3701108574286a65b2bc575b4b169e850303d7bdfa7b454a9d761156(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c61d6e03896f448aa657171d07872757c5df8e4002808585d1ea5b352322af3c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__086170e6b99e8cae1c5b3d552ba2332b2bb476079ab2c89ba53b94a837f101cf(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a20bea2648ce70fc4cc37c1d6c3586ebdf6a38e2b977c81cbbaddd231cb914c3(
    value: typing.Optional[PipesPipeTargetParametersRedshiftDataParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9853f65935fecfe20b97f340d2ce50af229cb5bffd082901e083a99686d392ec(
    *,
    pipeline_parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ae8b850d9695290088f0b4a5275e3435fcfe01041f845bc09b6c04b805a012c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b999f2d2834869dee6139c8c1c38ea98ac6f32c9eed1e31b517008e8016b65a5(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e12f26025b41ef3161b84b5db37c97cdabe536569bb3e2de3cc6d609b1f4ae20(
    value: typing.Optional[PipesPipeTargetParametersSagemakerPipelineParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1fb8c18cd8af725cbf1724f4b4604cd4788e71dfe32626583989a0671109402f(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__439be317a949f657fdf68091e8b0e2275027f583e7a36bbcd30e575ffb1902a9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__258e2f03a2b49539be3580d681fa2c324fa4c54550c7f3c5f4c804811f583f29(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e47e1dfb64418d14430e0a21064975fc7cccd333e2eef93e2801edef1d6198fa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2224fe84476ab7b29f814209e214c4fb619338ac76e07418e8f50830bdaea748(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__108883bb5c3fff3d210901240b52833611114d0ba396792eff86b499c9f9d4d7(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__136677fd744af5df641f8736536e6e66183565c17c6336f3a3a00883cec50459(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb12e4d536c962818373e82c8ad9a0a966a68597d18cf037be374fbd953d4c8d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6b5777a01e19d4a5c508dd949b5ce6b2619e5acae226110738dbf90f829f5d9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__868a1fadee65d058bcb9539e87e9c16f99cb4d52dcf94dcd78564823fe039941(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05db194f5a51f9d0d323cd4086e26a1f0cd8cc00f11a1bac9ab5dfb02bfee23b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTargetParametersSagemakerPipelineParametersPipelineParameter]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efed3bfd2a70305e5e794fc322dc4de6cdce05d2a3d715514106b79659d77d54(
    *,
    message_deduplication_id: typing.Optional[builtins.str] = None,
    message_group_id: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a1d0a9b6ed3597a0c0b7b3c9a9fc69e46b7a0e9a097fa2ccecd0e19352743df(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__17930916624e8cf254d09e66813a291730b39fc4645c5d5f31cb19f0858a6955(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3c127f0ef07ab67e6dc79342cc732488e7e0a2605e70ed4a2ad865d5b31d0e5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__16ed07e9dd710e7dbb2638da9f458cd8180995515545eba054e3f4b1b36a1f67(
    value: typing.Optional[PipesPipeTargetParametersSqsQueueParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3a684c789e3784860d87ffef2d3f2166375b9d578883c9575663dc8b294e6a7(
    *,
    invocation_type: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da7f57cf3815d43c2f7e3e61f2707ee7901ff182c4959c54f9590d84a65a3d72(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__16cc4e90a098654d071eb848f7c798e1d7c3d3a0dffce9ed472e50987c71a71c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b2979a64f70ba64c20dc18e1711c0907f194ed0aae562cc5729cdac87eea42c(
    value: typing.Optional[PipesPipeTargetParametersStepFunctionStateMachineParameters],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f7a4d59c0892a5c4dc64208d8fc9c621fcd005a1b8526f339c3c1900c5c3c08(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53da592f5df8bcf33a5df03acc622469a0da02749b55ecd85d860bc4f5e39b29(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6f1941728efd9fb4adf955aa2fa4a4c3bcac08ff08bda80a220cf0734005aff(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c9f97d8e99843bbc4c309e4afe91f986f93f217c049966de2ac4b80da9d7d546(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00dcde33f1154d888e421f0aaf32100bc86cad9f902451ed63c2505674e07b24(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ea27acc74d032408b342da603632e526c1ed494c0c5fd8c3c9e9027d1baae99(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, PipesPipeTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
