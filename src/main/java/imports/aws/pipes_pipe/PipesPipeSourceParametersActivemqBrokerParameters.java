package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.067Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersActivemqBrokerParameters")
@software.amazon.jsii.Jsii.Proxy(PipesPipeSourceParametersActivemqBrokerParameters.Jsii$Proxy.class)
public interface PipesPipeSourceParametersActivemqBrokerParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * credentials block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
     */
    @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersCredentials getCredentials();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#queue_name PipesPipe#queue_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getQueueName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBatchSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumBatchingWindowInSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeSourceParametersActivemqBrokerParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeSourceParametersActivemqBrokerParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeSourceParametersActivemqBrokerParameters> {
        imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersCredentials credentials;
        java.lang.String queueName;
        java.lang.Number batchSize;
        java.lang.Number maximumBatchingWindowInSeconds;

        /**
         * Sets the value of {@link PipesPipeSourceParametersActivemqBrokerParameters#getCredentials}
         * @param credentials credentials block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
         * @return {@code this}
         */
        public Builder credentials(imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersCredentials credentials) {
            this.credentials = credentials;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersActivemqBrokerParameters#getQueueName}
         * @param queueName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#queue_name PipesPipe#queue_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder queueName(java.lang.String queueName) {
            this.queueName = queueName;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersActivemqBrokerParameters#getBatchSize}
         * @param batchSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
         * @return {@code this}
         */
        public Builder batchSize(java.lang.Number batchSize) {
            this.batchSize = batchSize;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersActivemqBrokerParameters#getMaximumBatchingWindowInSeconds}
         * @param maximumBatchingWindowInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
         * @return {@code this}
         */
        public Builder maximumBatchingWindowInSeconds(java.lang.Number maximumBatchingWindowInSeconds) {
            this.maximumBatchingWindowInSeconds = maximumBatchingWindowInSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeSourceParametersActivemqBrokerParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeSourceParametersActivemqBrokerParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeSourceParametersActivemqBrokerParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeSourceParametersActivemqBrokerParameters {
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersCredentials credentials;
        private final java.lang.String queueName;
        private final java.lang.Number batchSize;
        private final java.lang.Number maximumBatchingWindowInSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.credentials = software.amazon.jsii.Kernel.get(this, "credentials", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersCredentials.class));
            this.queueName = software.amazon.jsii.Kernel.get(this, "queueName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.batchSize = software.amazon.jsii.Kernel.get(this, "batchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maximumBatchingWindowInSeconds = software.amazon.jsii.Kernel.get(this, "maximumBatchingWindowInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.credentials = java.util.Objects.requireNonNull(builder.credentials, "credentials is required");
            this.queueName = java.util.Objects.requireNonNull(builder.queueName, "queueName is required");
            this.batchSize = builder.batchSize;
            this.maximumBatchingWindowInSeconds = builder.maximumBatchingWindowInSeconds;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersCredentials getCredentials() {
            return this.credentials;
        }

        @Override
        public final java.lang.String getQueueName() {
            return this.queueName;
        }

        @Override
        public final java.lang.Number getBatchSize() {
            return this.batchSize;
        }

        @Override
        public final java.lang.Number getMaximumBatchingWindowInSeconds() {
            return this.maximumBatchingWindowInSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("credentials", om.valueToTree(this.getCredentials()));
            data.set("queueName", om.valueToTree(this.getQueueName()));
            if (this.getBatchSize() != null) {
                data.set("batchSize", om.valueToTree(this.getBatchSize()));
            }
            if (this.getMaximumBatchingWindowInSeconds() != null) {
                data.set("maximumBatchingWindowInSeconds", om.valueToTree(this.getMaximumBatchingWindowInSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeSourceParametersActivemqBrokerParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeSourceParametersActivemqBrokerParameters.Jsii$Proxy that = (PipesPipeSourceParametersActivemqBrokerParameters.Jsii$Proxy) o;

            if (!credentials.equals(that.credentials)) return false;
            if (!queueName.equals(that.queueName)) return false;
            if (this.batchSize != null ? !this.batchSize.equals(that.batchSize) : that.batchSize != null) return false;
            return this.maximumBatchingWindowInSeconds != null ? this.maximumBatchingWindowInSeconds.equals(that.maximumBatchingWindowInSeconds) : that.maximumBatchingWindowInSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.credentials.hashCode();
            result = 31 * result + (this.queueName.hashCode());
            result = 31 * result + (this.batchSize != null ? this.batchSize.hashCode() : 0);
            result = 31 * result + (this.maximumBatchingWindowInSeconds != null ? this.maximumBatchingWindowInSeconds.hashCode() : 0);
            return result;
        }
    }
}
