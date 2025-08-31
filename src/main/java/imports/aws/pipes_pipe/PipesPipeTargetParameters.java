package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParameters")
@software.amazon.jsii.Jsii.Proxy(PipesPipeTargetParameters.Jsii$Proxy.class)
public interface PipesPipeTargetParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * batch_job_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_job_parameters PipesPipe#batch_job_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParameters getBatchJobParameters() {
        return null;
    }

    /**
     * cloudwatch_logs_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cloudwatch_logs_parameters PipesPipe#cloudwatch_logs_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParameters getCloudwatchLogsParameters() {
        return null;
    }

    /**
     * ecs_task_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#ecs_task_parameters PipesPipe#ecs_task_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParameters getEcsTaskParameters() {
        return null;
    }

    /**
     * eventbridge_event_bus_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#eventbridge_event_bus_parameters PipesPipe#eventbridge_event_bus_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEventbridgeEventBusParameters getEventbridgeEventBusParameters() {
        return null;
    }

    /**
     * http_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#http_parameters PipesPipe#http_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParameters getHttpParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#input_template PipesPipe#input_template}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputTemplate() {
        return null;
    }

    /**
     * kinesis_stream_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kinesis_stream_parameters PipesPipe#kinesis_stream_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersKinesisStreamParameters getKinesisStreamParameters() {
        return null;
    }

    /**
     * lambda_function_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#lambda_function_parameters PipesPipe#lambda_function_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersLambdaFunctionParameters getLambdaFunctionParameters() {
        return null;
    }

    /**
     * redshift_data_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#redshift_data_parameters PipesPipe#redshift_data_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersRedshiftDataParameters getRedshiftDataParameters() {
        return null;
    }

    /**
     * sagemaker_pipeline_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sagemaker_pipeline_parameters PipesPipe#sagemaker_pipeline_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersSagemakerPipelineParameters getSagemakerPipelineParameters() {
        return null;
    }

    /**
     * sqs_queue_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqs_queue_parameters PipesPipe#sqs_queue_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParameters getSqsQueueParameters() {
        return null;
    }

    /**
     * step_function_state_machine_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#step_function_state_machine_parameters PipesPipe#step_function_state_machine_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersStepFunctionStateMachineParameters getStepFunctionStateMachineParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeTargetParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeTargetParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeTargetParameters> {
        imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParameters batchJobParameters;
        imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParameters cloudwatchLogsParameters;
        imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParameters ecsTaskParameters;
        imports.aws.pipes_pipe.PipesPipeTargetParametersEventbridgeEventBusParameters eventbridgeEventBusParameters;
        imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParameters httpParameters;
        java.lang.String inputTemplate;
        imports.aws.pipes_pipe.PipesPipeTargetParametersKinesisStreamParameters kinesisStreamParameters;
        imports.aws.pipes_pipe.PipesPipeTargetParametersLambdaFunctionParameters lambdaFunctionParameters;
        imports.aws.pipes_pipe.PipesPipeTargetParametersRedshiftDataParameters redshiftDataParameters;
        imports.aws.pipes_pipe.PipesPipeTargetParametersSagemakerPipelineParameters sagemakerPipelineParameters;
        imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParameters sqsQueueParameters;
        imports.aws.pipes_pipe.PipesPipeTargetParametersStepFunctionStateMachineParameters stepFunctionStateMachineParameters;

        /**
         * Sets the value of {@link PipesPipeTargetParameters#getBatchJobParameters}
         * @param batchJobParameters batch_job_parameters block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_job_parameters PipesPipe#batch_job_parameters}
         * @return {@code this}
         */
        public Builder batchJobParameters(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParameters batchJobParameters) {
            this.batchJobParameters = batchJobParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParameters#getCloudwatchLogsParameters}
         * @param cloudwatchLogsParameters cloudwatch_logs_parameters block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cloudwatch_logs_parameters PipesPipe#cloudwatch_logs_parameters}
         * @return {@code this}
         */
        public Builder cloudwatchLogsParameters(imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParameters cloudwatchLogsParameters) {
            this.cloudwatchLogsParameters = cloudwatchLogsParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParameters#getEcsTaskParameters}
         * @param ecsTaskParameters ecs_task_parameters block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#ecs_task_parameters PipesPipe#ecs_task_parameters}
         * @return {@code this}
         */
        public Builder ecsTaskParameters(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParameters ecsTaskParameters) {
            this.ecsTaskParameters = ecsTaskParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParameters#getEventbridgeEventBusParameters}
         * @param eventbridgeEventBusParameters eventbridge_event_bus_parameters block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#eventbridge_event_bus_parameters PipesPipe#eventbridge_event_bus_parameters}
         * @return {@code this}
         */
        public Builder eventbridgeEventBusParameters(imports.aws.pipes_pipe.PipesPipeTargetParametersEventbridgeEventBusParameters eventbridgeEventBusParameters) {
            this.eventbridgeEventBusParameters = eventbridgeEventBusParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParameters#getHttpParameters}
         * @param httpParameters http_parameters block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#http_parameters PipesPipe#http_parameters}
         * @return {@code this}
         */
        public Builder httpParameters(imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParameters httpParameters) {
            this.httpParameters = httpParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParameters#getInputTemplate}
         * @param inputTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#input_template PipesPipe#input_template}.
         * @return {@code this}
         */
        public Builder inputTemplate(java.lang.String inputTemplate) {
            this.inputTemplate = inputTemplate;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParameters#getKinesisStreamParameters}
         * @param kinesisStreamParameters kinesis_stream_parameters block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kinesis_stream_parameters PipesPipe#kinesis_stream_parameters}
         * @return {@code this}
         */
        public Builder kinesisStreamParameters(imports.aws.pipes_pipe.PipesPipeTargetParametersKinesisStreamParameters kinesisStreamParameters) {
            this.kinesisStreamParameters = kinesisStreamParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParameters#getLambdaFunctionParameters}
         * @param lambdaFunctionParameters lambda_function_parameters block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#lambda_function_parameters PipesPipe#lambda_function_parameters}
         * @return {@code this}
         */
        public Builder lambdaFunctionParameters(imports.aws.pipes_pipe.PipesPipeTargetParametersLambdaFunctionParameters lambdaFunctionParameters) {
            this.lambdaFunctionParameters = lambdaFunctionParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParameters#getRedshiftDataParameters}
         * @param redshiftDataParameters redshift_data_parameters block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#redshift_data_parameters PipesPipe#redshift_data_parameters}
         * @return {@code this}
         */
        public Builder redshiftDataParameters(imports.aws.pipes_pipe.PipesPipeTargetParametersRedshiftDataParameters redshiftDataParameters) {
            this.redshiftDataParameters = redshiftDataParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParameters#getSagemakerPipelineParameters}
         * @param sagemakerPipelineParameters sagemaker_pipeline_parameters block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sagemaker_pipeline_parameters PipesPipe#sagemaker_pipeline_parameters}
         * @return {@code this}
         */
        public Builder sagemakerPipelineParameters(imports.aws.pipes_pipe.PipesPipeTargetParametersSagemakerPipelineParameters sagemakerPipelineParameters) {
            this.sagemakerPipelineParameters = sagemakerPipelineParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParameters#getSqsQueueParameters}
         * @param sqsQueueParameters sqs_queue_parameters block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqs_queue_parameters PipesPipe#sqs_queue_parameters}
         * @return {@code this}
         */
        public Builder sqsQueueParameters(imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParameters sqsQueueParameters) {
            this.sqsQueueParameters = sqsQueueParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParameters#getStepFunctionStateMachineParameters}
         * @param stepFunctionStateMachineParameters step_function_state_machine_parameters block.
         *                                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#step_function_state_machine_parameters PipesPipe#step_function_state_machine_parameters}
         * @return {@code this}
         */
        public Builder stepFunctionStateMachineParameters(imports.aws.pipes_pipe.PipesPipeTargetParametersStepFunctionStateMachineParameters stepFunctionStateMachineParameters) {
            this.stepFunctionStateMachineParameters = stepFunctionStateMachineParameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeTargetParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeTargetParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeTargetParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeTargetParameters {
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParameters batchJobParameters;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParameters cloudwatchLogsParameters;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParameters ecsTaskParameters;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersEventbridgeEventBusParameters eventbridgeEventBusParameters;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParameters httpParameters;
        private final java.lang.String inputTemplate;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersKinesisStreamParameters kinesisStreamParameters;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersLambdaFunctionParameters lambdaFunctionParameters;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersRedshiftDataParameters redshiftDataParameters;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersSagemakerPipelineParameters sagemakerPipelineParameters;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParameters sqsQueueParameters;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersStepFunctionStateMachineParameters stepFunctionStateMachineParameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.batchJobParameters = software.amazon.jsii.Kernel.get(this, "batchJobParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParameters.class));
            this.cloudwatchLogsParameters = software.amazon.jsii.Kernel.get(this, "cloudwatchLogsParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParameters.class));
            this.ecsTaskParameters = software.amazon.jsii.Kernel.get(this, "ecsTaskParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParameters.class));
            this.eventbridgeEventBusParameters = software.amazon.jsii.Kernel.get(this, "eventbridgeEventBusParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEventbridgeEventBusParameters.class));
            this.httpParameters = software.amazon.jsii.Kernel.get(this, "httpParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParameters.class));
            this.inputTemplate = software.amazon.jsii.Kernel.get(this, "inputTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kinesisStreamParameters = software.amazon.jsii.Kernel.get(this, "kinesisStreamParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersKinesisStreamParameters.class));
            this.lambdaFunctionParameters = software.amazon.jsii.Kernel.get(this, "lambdaFunctionParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersLambdaFunctionParameters.class));
            this.redshiftDataParameters = software.amazon.jsii.Kernel.get(this, "redshiftDataParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersRedshiftDataParameters.class));
            this.sagemakerPipelineParameters = software.amazon.jsii.Kernel.get(this, "sagemakerPipelineParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersSagemakerPipelineParameters.class));
            this.sqsQueueParameters = software.amazon.jsii.Kernel.get(this, "sqsQueueParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParameters.class));
            this.stepFunctionStateMachineParameters = software.amazon.jsii.Kernel.get(this, "stepFunctionStateMachineParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersStepFunctionStateMachineParameters.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.batchJobParameters = builder.batchJobParameters;
            this.cloudwatchLogsParameters = builder.cloudwatchLogsParameters;
            this.ecsTaskParameters = builder.ecsTaskParameters;
            this.eventbridgeEventBusParameters = builder.eventbridgeEventBusParameters;
            this.httpParameters = builder.httpParameters;
            this.inputTemplate = builder.inputTemplate;
            this.kinesisStreamParameters = builder.kinesisStreamParameters;
            this.lambdaFunctionParameters = builder.lambdaFunctionParameters;
            this.redshiftDataParameters = builder.redshiftDataParameters;
            this.sagemakerPipelineParameters = builder.sagemakerPipelineParameters;
            this.sqsQueueParameters = builder.sqsQueueParameters;
            this.stepFunctionStateMachineParameters = builder.stepFunctionStateMachineParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParameters getBatchJobParameters() {
            return this.batchJobParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersCloudwatchLogsParameters getCloudwatchLogsParameters() {
            return this.cloudwatchLogsParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParameters getEcsTaskParameters() {
            return this.ecsTaskParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersEventbridgeEventBusParameters getEventbridgeEventBusParameters() {
            return this.eventbridgeEventBusParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersHttpParameters getHttpParameters() {
            return this.httpParameters;
        }

        @Override
        public final java.lang.String getInputTemplate() {
            return this.inputTemplate;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersKinesisStreamParameters getKinesisStreamParameters() {
            return this.kinesisStreamParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersLambdaFunctionParameters getLambdaFunctionParameters() {
            return this.lambdaFunctionParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersRedshiftDataParameters getRedshiftDataParameters() {
            return this.redshiftDataParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersSagemakerPipelineParameters getSagemakerPipelineParameters() {
            return this.sagemakerPipelineParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersSqsQueueParameters getSqsQueueParameters() {
            return this.sqsQueueParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersStepFunctionStateMachineParameters getStepFunctionStateMachineParameters() {
            return this.stepFunctionStateMachineParameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBatchJobParameters() != null) {
                data.set("batchJobParameters", om.valueToTree(this.getBatchJobParameters()));
            }
            if (this.getCloudwatchLogsParameters() != null) {
                data.set("cloudwatchLogsParameters", om.valueToTree(this.getCloudwatchLogsParameters()));
            }
            if (this.getEcsTaskParameters() != null) {
                data.set("ecsTaskParameters", om.valueToTree(this.getEcsTaskParameters()));
            }
            if (this.getEventbridgeEventBusParameters() != null) {
                data.set("eventbridgeEventBusParameters", om.valueToTree(this.getEventbridgeEventBusParameters()));
            }
            if (this.getHttpParameters() != null) {
                data.set("httpParameters", om.valueToTree(this.getHttpParameters()));
            }
            if (this.getInputTemplate() != null) {
                data.set("inputTemplate", om.valueToTree(this.getInputTemplate()));
            }
            if (this.getKinesisStreamParameters() != null) {
                data.set("kinesisStreamParameters", om.valueToTree(this.getKinesisStreamParameters()));
            }
            if (this.getLambdaFunctionParameters() != null) {
                data.set("lambdaFunctionParameters", om.valueToTree(this.getLambdaFunctionParameters()));
            }
            if (this.getRedshiftDataParameters() != null) {
                data.set("redshiftDataParameters", om.valueToTree(this.getRedshiftDataParameters()));
            }
            if (this.getSagemakerPipelineParameters() != null) {
                data.set("sagemakerPipelineParameters", om.valueToTree(this.getSagemakerPipelineParameters()));
            }
            if (this.getSqsQueueParameters() != null) {
                data.set("sqsQueueParameters", om.valueToTree(this.getSqsQueueParameters()));
            }
            if (this.getStepFunctionStateMachineParameters() != null) {
                data.set("stepFunctionStateMachineParameters", om.valueToTree(this.getStepFunctionStateMachineParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeTargetParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeTargetParameters.Jsii$Proxy that = (PipesPipeTargetParameters.Jsii$Proxy) o;

            if (this.batchJobParameters != null ? !this.batchJobParameters.equals(that.batchJobParameters) : that.batchJobParameters != null) return false;
            if (this.cloudwatchLogsParameters != null ? !this.cloudwatchLogsParameters.equals(that.cloudwatchLogsParameters) : that.cloudwatchLogsParameters != null) return false;
            if (this.ecsTaskParameters != null ? !this.ecsTaskParameters.equals(that.ecsTaskParameters) : that.ecsTaskParameters != null) return false;
            if (this.eventbridgeEventBusParameters != null ? !this.eventbridgeEventBusParameters.equals(that.eventbridgeEventBusParameters) : that.eventbridgeEventBusParameters != null) return false;
            if (this.httpParameters != null ? !this.httpParameters.equals(that.httpParameters) : that.httpParameters != null) return false;
            if (this.inputTemplate != null ? !this.inputTemplate.equals(that.inputTemplate) : that.inputTemplate != null) return false;
            if (this.kinesisStreamParameters != null ? !this.kinesisStreamParameters.equals(that.kinesisStreamParameters) : that.kinesisStreamParameters != null) return false;
            if (this.lambdaFunctionParameters != null ? !this.lambdaFunctionParameters.equals(that.lambdaFunctionParameters) : that.lambdaFunctionParameters != null) return false;
            if (this.redshiftDataParameters != null ? !this.redshiftDataParameters.equals(that.redshiftDataParameters) : that.redshiftDataParameters != null) return false;
            if (this.sagemakerPipelineParameters != null ? !this.sagemakerPipelineParameters.equals(that.sagemakerPipelineParameters) : that.sagemakerPipelineParameters != null) return false;
            if (this.sqsQueueParameters != null ? !this.sqsQueueParameters.equals(that.sqsQueueParameters) : that.sqsQueueParameters != null) return false;
            return this.stepFunctionStateMachineParameters != null ? this.stepFunctionStateMachineParameters.equals(that.stepFunctionStateMachineParameters) : that.stepFunctionStateMachineParameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.batchJobParameters != null ? this.batchJobParameters.hashCode() : 0;
            result = 31 * result + (this.cloudwatchLogsParameters != null ? this.cloudwatchLogsParameters.hashCode() : 0);
            result = 31 * result + (this.ecsTaskParameters != null ? this.ecsTaskParameters.hashCode() : 0);
            result = 31 * result + (this.eventbridgeEventBusParameters != null ? this.eventbridgeEventBusParameters.hashCode() : 0);
            result = 31 * result + (this.httpParameters != null ? this.httpParameters.hashCode() : 0);
            result = 31 * result + (this.inputTemplate != null ? this.inputTemplate.hashCode() : 0);
            result = 31 * result + (this.kinesisStreamParameters != null ? this.kinesisStreamParameters.hashCode() : 0);
            result = 31 * result + (this.lambdaFunctionParameters != null ? this.lambdaFunctionParameters.hashCode() : 0);
            result = 31 * result + (this.redshiftDataParameters != null ? this.redshiftDataParameters.hashCode() : 0);
            result = 31 * result + (this.sagemakerPipelineParameters != null ? this.sagemakerPipelineParameters.hashCode() : 0);
            result = 31 * result + (this.sqsQueueParameters != null ? this.sqsQueueParameters.hashCode() : 0);
            result = 31 * result + (this.stepFunctionStateMachineParameters != null ? this.stepFunctionStateMachineParameters.hashCode() : 0);
            return result;
        }
    }
}
