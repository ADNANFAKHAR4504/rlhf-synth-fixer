package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersCloudwatchLogsParameters")
@software.amazon.jsii.Jsii.Proxy(PipesPipeTargetParametersCloudwatchLogsParameters.Jsii$Proxy.class)
public interface PipesPipeTargetParametersCloudwatchLogsParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_stream_name PipesPipe#log_stream_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogStreamName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#timestamp PipesPipe#timestamp}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimestamp() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeTargetParametersCloudwatchLogsParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeTargetParametersCloudwatchLogsParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeTargetParametersCloudwatchLogsParameters> {
        java.lang.String logStreamName;
        java.lang.String timestamp;

        /**
         * Sets the value of {@link PipesPipeTargetParametersCloudwatchLogsParameters#getLogStreamName}
         * @param logStreamName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#log_stream_name PipesPipe#log_stream_name}.
         * @return {@code this}
         */
        public Builder logStreamName(java.lang.String logStreamName) {
            this.logStreamName = logStreamName;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersCloudwatchLogsParameters#getTimestamp}
         * @param timestamp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#timestamp PipesPipe#timestamp}.
         * @return {@code this}
         */
        public Builder timestamp(java.lang.String timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeTargetParametersCloudwatchLogsParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeTargetParametersCloudwatchLogsParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeTargetParametersCloudwatchLogsParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeTargetParametersCloudwatchLogsParameters {
        private final java.lang.String logStreamName;
        private final java.lang.String timestamp;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.logStreamName = software.amazon.jsii.Kernel.get(this, "logStreamName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timestamp = software.amazon.jsii.Kernel.get(this, "timestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.logStreamName = builder.logStreamName;
            this.timestamp = builder.timestamp;
        }

        @Override
        public final java.lang.String getLogStreamName() {
            return this.logStreamName;
        }

        @Override
        public final java.lang.String getTimestamp() {
            return this.timestamp;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLogStreamName() != null) {
                data.set("logStreamName", om.valueToTree(this.getLogStreamName()));
            }
            if (this.getTimestamp() != null) {
                data.set("timestamp", om.valueToTree(this.getTimestamp()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeTargetParametersCloudwatchLogsParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeTargetParametersCloudwatchLogsParameters.Jsii$Proxy that = (PipesPipeTargetParametersCloudwatchLogsParameters.Jsii$Proxy) o;

            if (this.logStreamName != null ? !this.logStreamName.equals(that.logStreamName) : that.logStreamName != null) return false;
            return this.timestamp != null ? this.timestamp.equals(that.timestamp) : that.timestamp == null;
        }

        @Override
        public final int hashCode() {
            int result = this.logStreamName != null ? this.logStreamName.hashCode() : 0;
            result = 31 * result + (this.timestamp != null ? this.timestamp.hashCode() : 0);
            return result;
        }
    }
}
