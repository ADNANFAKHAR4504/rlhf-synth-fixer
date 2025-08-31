package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeLogConfiguration")
@software.amazon.jsii.Jsii.Proxy(PipesPipeLogConfiguration.Jsii$Proxy.class)
public interface PipesPipeLogConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#level PipesPipe#level}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLevel();

    /**
     * cloudwatch_logs_log_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cloudwatch_logs_log_destination PipesPipe#cloudwatch_logs_log_destination}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination getCloudwatchLogsLogDestination() {
        return null;
    }

    /**
     * firehose_log_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#firehose_log_destination PipesPipe#firehose_log_destination}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeLogConfigurationFirehoseLogDestination getFirehoseLogDestination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#include_execution_data PipesPipe#include_execution_data}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIncludeExecutionData() {
        return null;
    }

    /**
     * s3_log_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#s3_log_destination PipesPipe#s3_log_destination}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeLogConfigurationS3LogDestination getS3LogDestination() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeLogConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeLogConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeLogConfiguration> {
        java.lang.String level;
        imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination cloudwatchLogsLogDestination;
        imports.aws.pipes_pipe.PipesPipeLogConfigurationFirehoseLogDestination firehoseLogDestination;
        java.util.List<java.lang.String> includeExecutionData;
        imports.aws.pipes_pipe.PipesPipeLogConfigurationS3LogDestination s3LogDestination;

        /**
         * Sets the value of {@link PipesPipeLogConfiguration#getLevel}
         * @param level Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#level PipesPipe#level}. This parameter is required.
         * @return {@code this}
         */
        public Builder level(java.lang.String level) {
            this.level = level;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeLogConfiguration#getCloudwatchLogsLogDestination}
         * @param cloudwatchLogsLogDestination cloudwatch_logs_log_destination block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cloudwatch_logs_log_destination PipesPipe#cloudwatch_logs_log_destination}
         * @return {@code this}
         */
        public Builder cloudwatchLogsLogDestination(imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination cloudwatchLogsLogDestination) {
            this.cloudwatchLogsLogDestination = cloudwatchLogsLogDestination;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeLogConfiguration#getFirehoseLogDestination}
         * @param firehoseLogDestination firehose_log_destination block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#firehose_log_destination PipesPipe#firehose_log_destination}
         * @return {@code this}
         */
        public Builder firehoseLogDestination(imports.aws.pipes_pipe.PipesPipeLogConfigurationFirehoseLogDestination firehoseLogDestination) {
            this.firehoseLogDestination = firehoseLogDestination;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeLogConfiguration#getIncludeExecutionData}
         * @param includeExecutionData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#include_execution_data PipesPipe#include_execution_data}.
         * @return {@code this}
         */
        public Builder includeExecutionData(java.util.List<java.lang.String> includeExecutionData) {
            this.includeExecutionData = includeExecutionData;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeLogConfiguration#getS3LogDestination}
         * @param s3LogDestination s3_log_destination block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#s3_log_destination PipesPipe#s3_log_destination}
         * @return {@code this}
         */
        public Builder s3LogDestination(imports.aws.pipes_pipe.PipesPipeLogConfigurationS3LogDestination s3LogDestination) {
            this.s3LogDestination = s3LogDestination;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeLogConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeLogConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeLogConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeLogConfiguration {
        private final java.lang.String level;
        private final imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination cloudwatchLogsLogDestination;
        private final imports.aws.pipes_pipe.PipesPipeLogConfigurationFirehoseLogDestination firehoseLogDestination;
        private final java.util.List<java.lang.String> includeExecutionData;
        private final imports.aws.pipes_pipe.PipesPipeLogConfigurationS3LogDestination s3LogDestination;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.level = software.amazon.jsii.Kernel.get(this, "level", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cloudwatchLogsLogDestination = software.amazon.jsii.Kernel.get(this, "cloudwatchLogsLogDestination", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination.class));
            this.firehoseLogDestination = software.amazon.jsii.Kernel.get(this, "firehoseLogDestination", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeLogConfigurationFirehoseLogDestination.class));
            this.includeExecutionData = software.amazon.jsii.Kernel.get(this, "includeExecutionData", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.s3LogDestination = software.amazon.jsii.Kernel.get(this, "s3LogDestination", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeLogConfigurationS3LogDestination.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.level = java.util.Objects.requireNonNull(builder.level, "level is required");
            this.cloudwatchLogsLogDestination = builder.cloudwatchLogsLogDestination;
            this.firehoseLogDestination = builder.firehoseLogDestination;
            this.includeExecutionData = builder.includeExecutionData;
            this.s3LogDestination = builder.s3LogDestination;
        }

        @Override
        public final java.lang.String getLevel() {
            return this.level;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeLogConfigurationCloudwatchLogsLogDestination getCloudwatchLogsLogDestination() {
            return this.cloudwatchLogsLogDestination;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeLogConfigurationFirehoseLogDestination getFirehoseLogDestination() {
            return this.firehoseLogDestination;
        }

        @Override
        public final java.util.List<java.lang.String> getIncludeExecutionData() {
            return this.includeExecutionData;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeLogConfigurationS3LogDestination getS3LogDestination() {
            return this.s3LogDestination;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("level", om.valueToTree(this.getLevel()));
            if (this.getCloudwatchLogsLogDestination() != null) {
                data.set("cloudwatchLogsLogDestination", om.valueToTree(this.getCloudwatchLogsLogDestination()));
            }
            if (this.getFirehoseLogDestination() != null) {
                data.set("firehoseLogDestination", om.valueToTree(this.getFirehoseLogDestination()));
            }
            if (this.getIncludeExecutionData() != null) {
                data.set("includeExecutionData", om.valueToTree(this.getIncludeExecutionData()));
            }
            if (this.getS3LogDestination() != null) {
                data.set("s3LogDestination", om.valueToTree(this.getS3LogDestination()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeLogConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeLogConfiguration.Jsii$Proxy that = (PipesPipeLogConfiguration.Jsii$Proxy) o;

            if (!level.equals(that.level)) return false;
            if (this.cloudwatchLogsLogDestination != null ? !this.cloudwatchLogsLogDestination.equals(that.cloudwatchLogsLogDestination) : that.cloudwatchLogsLogDestination != null) return false;
            if (this.firehoseLogDestination != null ? !this.firehoseLogDestination.equals(that.firehoseLogDestination) : that.firehoseLogDestination != null) return false;
            if (this.includeExecutionData != null ? !this.includeExecutionData.equals(that.includeExecutionData) : that.includeExecutionData != null) return false;
            return this.s3LogDestination != null ? this.s3LogDestination.equals(that.s3LogDestination) : that.s3LogDestination == null;
        }

        @Override
        public final int hashCode() {
            int result = this.level.hashCode();
            result = 31 * result + (this.cloudwatchLogsLogDestination != null ? this.cloudwatchLogsLogDestination.hashCode() : 0);
            result = 31 * result + (this.firehoseLogDestination != null ? this.firehoseLogDestination.hashCode() : 0);
            result = 31 * result + (this.includeExecutionData != null ? this.includeExecutionData.hashCode() : 0);
            result = 31 * result + (this.s3LogDestination != null ? this.s3LogDestination.hashCode() : 0);
            return result;
        }
    }
}
