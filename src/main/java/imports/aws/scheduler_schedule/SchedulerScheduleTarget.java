package imports.aws.scheduler_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.358Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.schedulerSchedule.SchedulerScheduleTarget")
@software.amazon.jsii.Jsii.Proxy(SchedulerScheduleTarget.Jsii$Proxy.class)
public interface SchedulerScheduleTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#arn SchedulerSchedule#arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#role_arn SchedulerSchedule#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * dead_letter_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#dead_letter_config SchedulerSchedule#dead_letter_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetDeadLetterConfig getDeadLetterConfig() {
        return null;
    }

    /**
     * ecs_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#ecs_parameters SchedulerSchedule#ecs_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetEcsParameters getEcsParameters() {
        return null;
    }

    /**
     * eventbridge_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#eventbridge_parameters SchedulerSchedule#eventbridge_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetEventbridgeParameters getEventbridgeParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#input SchedulerSchedule#input}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInput() {
        return null;
    }

    /**
     * kinesis_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#kinesis_parameters SchedulerSchedule#kinesis_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetKinesisParameters getKinesisParameters() {
        return null;
    }

    /**
     * retry_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#retry_policy SchedulerSchedule#retry_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetRetryPolicy getRetryPolicy() {
        return null;
    }

    /**
     * sagemaker_pipeline_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#sagemaker_pipeline_parameters SchedulerSchedule#sagemaker_pipeline_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetSagemakerPipelineParameters getSagemakerPipelineParameters() {
        return null;
    }

    /**
     * sqs_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#sqs_parameters SchedulerSchedule#sqs_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParameters getSqsParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SchedulerScheduleTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SchedulerScheduleTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SchedulerScheduleTarget> {
        java.lang.String arn;
        java.lang.String roleArn;
        imports.aws.scheduler_schedule.SchedulerScheduleTargetDeadLetterConfig deadLetterConfig;
        imports.aws.scheduler_schedule.SchedulerScheduleTargetEcsParameters ecsParameters;
        imports.aws.scheduler_schedule.SchedulerScheduleTargetEventbridgeParameters eventbridgeParameters;
        java.lang.String input;
        imports.aws.scheduler_schedule.SchedulerScheduleTargetKinesisParameters kinesisParameters;
        imports.aws.scheduler_schedule.SchedulerScheduleTargetRetryPolicy retryPolicy;
        imports.aws.scheduler_schedule.SchedulerScheduleTargetSagemakerPipelineParameters sagemakerPipelineParameters;
        imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParameters sqsParameters;

        /**
         * Sets the value of {@link SchedulerScheduleTarget#getArn}
         * @param arn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#arn SchedulerSchedule#arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder arn(java.lang.String arn) {
            this.arn = arn;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleTarget#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#role_arn SchedulerSchedule#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleTarget#getDeadLetterConfig}
         * @param deadLetterConfig dead_letter_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#dead_letter_config SchedulerSchedule#dead_letter_config}
         * @return {@code this}
         */
        public Builder deadLetterConfig(imports.aws.scheduler_schedule.SchedulerScheduleTargetDeadLetterConfig deadLetterConfig) {
            this.deadLetterConfig = deadLetterConfig;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleTarget#getEcsParameters}
         * @param ecsParameters ecs_parameters block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#ecs_parameters SchedulerSchedule#ecs_parameters}
         * @return {@code this}
         */
        public Builder ecsParameters(imports.aws.scheduler_schedule.SchedulerScheduleTargetEcsParameters ecsParameters) {
            this.ecsParameters = ecsParameters;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleTarget#getEventbridgeParameters}
         * @param eventbridgeParameters eventbridge_parameters block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#eventbridge_parameters SchedulerSchedule#eventbridge_parameters}
         * @return {@code this}
         */
        public Builder eventbridgeParameters(imports.aws.scheduler_schedule.SchedulerScheduleTargetEventbridgeParameters eventbridgeParameters) {
            this.eventbridgeParameters = eventbridgeParameters;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleTarget#getInput}
         * @param input Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#input SchedulerSchedule#input}.
         * @return {@code this}
         */
        public Builder input(java.lang.String input) {
            this.input = input;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleTarget#getKinesisParameters}
         * @param kinesisParameters kinesis_parameters block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#kinesis_parameters SchedulerSchedule#kinesis_parameters}
         * @return {@code this}
         */
        public Builder kinesisParameters(imports.aws.scheduler_schedule.SchedulerScheduleTargetKinesisParameters kinesisParameters) {
            this.kinesisParameters = kinesisParameters;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleTarget#getRetryPolicy}
         * @param retryPolicy retry_policy block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#retry_policy SchedulerSchedule#retry_policy}
         * @return {@code this}
         */
        public Builder retryPolicy(imports.aws.scheduler_schedule.SchedulerScheduleTargetRetryPolicy retryPolicy) {
            this.retryPolicy = retryPolicy;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleTarget#getSagemakerPipelineParameters}
         * @param sagemakerPipelineParameters sagemaker_pipeline_parameters block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#sagemaker_pipeline_parameters SchedulerSchedule#sagemaker_pipeline_parameters}
         * @return {@code this}
         */
        public Builder sagemakerPipelineParameters(imports.aws.scheduler_schedule.SchedulerScheduleTargetSagemakerPipelineParameters sagemakerPipelineParameters) {
            this.sagemakerPipelineParameters = sagemakerPipelineParameters;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleTarget#getSqsParameters}
         * @param sqsParameters sqs_parameters block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#sqs_parameters SchedulerSchedule#sqs_parameters}
         * @return {@code this}
         */
        public Builder sqsParameters(imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParameters sqsParameters) {
            this.sqsParameters = sqsParameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SchedulerScheduleTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SchedulerScheduleTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SchedulerScheduleTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SchedulerScheduleTarget {
        private final java.lang.String arn;
        private final java.lang.String roleArn;
        private final imports.aws.scheduler_schedule.SchedulerScheduleTargetDeadLetterConfig deadLetterConfig;
        private final imports.aws.scheduler_schedule.SchedulerScheduleTargetEcsParameters ecsParameters;
        private final imports.aws.scheduler_schedule.SchedulerScheduleTargetEventbridgeParameters eventbridgeParameters;
        private final java.lang.String input;
        private final imports.aws.scheduler_schedule.SchedulerScheduleTargetKinesisParameters kinesisParameters;
        private final imports.aws.scheduler_schedule.SchedulerScheduleTargetRetryPolicy retryPolicy;
        private final imports.aws.scheduler_schedule.SchedulerScheduleTargetSagemakerPipelineParameters sagemakerPipelineParameters;
        private final imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParameters sqsParameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.arn = software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deadLetterConfig = software.amazon.jsii.Kernel.get(this, "deadLetterConfig", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetDeadLetterConfig.class));
            this.ecsParameters = software.amazon.jsii.Kernel.get(this, "ecsParameters", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetEcsParameters.class));
            this.eventbridgeParameters = software.amazon.jsii.Kernel.get(this, "eventbridgeParameters", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetEventbridgeParameters.class));
            this.input = software.amazon.jsii.Kernel.get(this, "input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kinesisParameters = software.amazon.jsii.Kernel.get(this, "kinesisParameters", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetKinesisParameters.class));
            this.retryPolicy = software.amazon.jsii.Kernel.get(this, "retryPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetRetryPolicy.class));
            this.sagemakerPipelineParameters = software.amazon.jsii.Kernel.get(this, "sagemakerPipelineParameters", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetSagemakerPipelineParameters.class));
            this.sqsParameters = software.amazon.jsii.Kernel.get(this, "sqsParameters", software.amazon.jsii.NativeType.forClass(imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParameters.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.arn = java.util.Objects.requireNonNull(builder.arn, "arn is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.deadLetterConfig = builder.deadLetterConfig;
            this.ecsParameters = builder.ecsParameters;
            this.eventbridgeParameters = builder.eventbridgeParameters;
            this.input = builder.input;
            this.kinesisParameters = builder.kinesisParameters;
            this.retryPolicy = builder.retryPolicy;
            this.sagemakerPipelineParameters = builder.sagemakerPipelineParameters;
            this.sqsParameters = builder.sqsParameters;
        }

        @Override
        public final java.lang.String getArn() {
            return this.arn;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final imports.aws.scheduler_schedule.SchedulerScheduleTargetDeadLetterConfig getDeadLetterConfig() {
            return this.deadLetterConfig;
        }

        @Override
        public final imports.aws.scheduler_schedule.SchedulerScheduleTargetEcsParameters getEcsParameters() {
            return this.ecsParameters;
        }

        @Override
        public final imports.aws.scheduler_schedule.SchedulerScheduleTargetEventbridgeParameters getEventbridgeParameters() {
            return this.eventbridgeParameters;
        }

        @Override
        public final java.lang.String getInput() {
            return this.input;
        }

        @Override
        public final imports.aws.scheduler_schedule.SchedulerScheduleTargetKinesisParameters getKinesisParameters() {
            return this.kinesisParameters;
        }

        @Override
        public final imports.aws.scheduler_schedule.SchedulerScheduleTargetRetryPolicy getRetryPolicy() {
            return this.retryPolicy;
        }

        @Override
        public final imports.aws.scheduler_schedule.SchedulerScheduleTargetSagemakerPipelineParameters getSagemakerPipelineParameters() {
            return this.sagemakerPipelineParameters;
        }

        @Override
        public final imports.aws.scheduler_schedule.SchedulerScheduleTargetSqsParameters getSqsParameters() {
            return this.sqsParameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("arn", om.valueToTree(this.getArn()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getDeadLetterConfig() != null) {
                data.set("deadLetterConfig", om.valueToTree(this.getDeadLetterConfig()));
            }
            if (this.getEcsParameters() != null) {
                data.set("ecsParameters", om.valueToTree(this.getEcsParameters()));
            }
            if (this.getEventbridgeParameters() != null) {
                data.set("eventbridgeParameters", om.valueToTree(this.getEventbridgeParameters()));
            }
            if (this.getInput() != null) {
                data.set("input", om.valueToTree(this.getInput()));
            }
            if (this.getKinesisParameters() != null) {
                data.set("kinesisParameters", om.valueToTree(this.getKinesisParameters()));
            }
            if (this.getRetryPolicy() != null) {
                data.set("retryPolicy", om.valueToTree(this.getRetryPolicy()));
            }
            if (this.getSagemakerPipelineParameters() != null) {
                data.set("sagemakerPipelineParameters", om.valueToTree(this.getSagemakerPipelineParameters()));
            }
            if (this.getSqsParameters() != null) {
                data.set("sqsParameters", om.valueToTree(this.getSqsParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.schedulerSchedule.SchedulerScheduleTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SchedulerScheduleTarget.Jsii$Proxy that = (SchedulerScheduleTarget.Jsii$Proxy) o;

            if (!arn.equals(that.arn)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.deadLetterConfig != null ? !this.deadLetterConfig.equals(that.deadLetterConfig) : that.deadLetterConfig != null) return false;
            if (this.ecsParameters != null ? !this.ecsParameters.equals(that.ecsParameters) : that.ecsParameters != null) return false;
            if (this.eventbridgeParameters != null ? !this.eventbridgeParameters.equals(that.eventbridgeParameters) : that.eventbridgeParameters != null) return false;
            if (this.input != null ? !this.input.equals(that.input) : that.input != null) return false;
            if (this.kinesisParameters != null ? !this.kinesisParameters.equals(that.kinesisParameters) : that.kinesisParameters != null) return false;
            if (this.retryPolicy != null ? !this.retryPolicy.equals(that.retryPolicy) : that.retryPolicy != null) return false;
            if (this.sagemakerPipelineParameters != null ? !this.sagemakerPipelineParameters.equals(that.sagemakerPipelineParameters) : that.sagemakerPipelineParameters != null) return false;
            return this.sqsParameters != null ? this.sqsParameters.equals(that.sqsParameters) : that.sqsParameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.arn.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.deadLetterConfig != null ? this.deadLetterConfig.hashCode() : 0);
            result = 31 * result + (this.ecsParameters != null ? this.ecsParameters.hashCode() : 0);
            result = 31 * result + (this.eventbridgeParameters != null ? this.eventbridgeParameters.hashCode() : 0);
            result = 31 * result + (this.input != null ? this.input.hashCode() : 0);
            result = 31 * result + (this.kinesisParameters != null ? this.kinesisParameters.hashCode() : 0);
            result = 31 * result + (this.retryPolicy != null ? this.retryPolicy.hashCode() : 0);
            result = 31 * result + (this.sagemakerPipelineParameters != null ? this.sagemakerPipelineParameters.hashCode() : 0);
            result = 31 * result + (this.sqsParameters != null ? this.sqsParameters.hashCode() : 0);
            return result;
        }
    }
}
