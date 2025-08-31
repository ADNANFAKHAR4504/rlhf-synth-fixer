package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.067Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersManagedStreamingKafkaParameters")
@software.amazon.jsii.Jsii.Proxy(PipesPipeSourceParametersManagedStreamingKafkaParameters.Jsii$Proxy.class)
public interface PipesPipeSourceParametersManagedStreamingKafkaParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#topic_name PipesPipe#topic_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTopicName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBatchSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#consumer_group_id PipesPipe#consumer_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConsumerGroupId() {
        return null;
    }

    /**
     * credentials block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials getCredentials() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumBatchingWindowInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartingPosition() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeSourceParametersManagedStreamingKafkaParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeSourceParametersManagedStreamingKafkaParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeSourceParametersManagedStreamingKafkaParameters> {
        java.lang.String topicName;
        java.lang.Number batchSize;
        java.lang.String consumerGroupId;
        imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials credentials;
        java.lang.Number maximumBatchingWindowInSeconds;
        java.lang.String startingPosition;

        /**
         * Sets the value of {@link PipesPipeSourceParametersManagedStreamingKafkaParameters#getTopicName}
         * @param topicName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#topic_name PipesPipe#topic_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder topicName(java.lang.String topicName) {
            this.topicName = topicName;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersManagedStreamingKafkaParameters#getBatchSize}
         * @param batchSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
         * @return {@code this}
         */
        public Builder batchSize(java.lang.Number batchSize) {
            this.batchSize = batchSize;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersManagedStreamingKafkaParameters#getConsumerGroupId}
         * @param consumerGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#consumer_group_id PipesPipe#consumer_group_id}.
         * @return {@code this}
         */
        public Builder consumerGroupId(java.lang.String consumerGroupId) {
            this.consumerGroupId = consumerGroupId;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersManagedStreamingKafkaParameters#getCredentials}
         * @param credentials credentials block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
         * @return {@code this}
         */
        public Builder credentials(imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials credentials) {
            this.credentials = credentials;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersManagedStreamingKafkaParameters#getMaximumBatchingWindowInSeconds}
         * @param maximumBatchingWindowInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
         * @return {@code this}
         */
        public Builder maximumBatchingWindowInSeconds(java.lang.Number maximumBatchingWindowInSeconds) {
            this.maximumBatchingWindowInSeconds = maximumBatchingWindowInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersManagedStreamingKafkaParameters#getStartingPosition}
         * @param startingPosition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
         * @return {@code this}
         */
        public Builder startingPosition(java.lang.String startingPosition) {
            this.startingPosition = startingPosition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeSourceParametersManagedStreamingKafkaParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeSourceParametersManagedStreamingKafkaParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeSourceParametersManagedStreamingKafkaParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeSourceParametersManagedStreamingKafkaParameters {
        private final java.lang.String topicName;
        private final java.lang.Number batchSize;
        private final java.lang.String consumerGroupId;
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials credentials;
        private final java.lang.Number maximumBatchingWindowInSeconds;
        private final java.lang.String startingPosition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.topicName = software.amazon.jsii.Kernel.get(this, "topicName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.batchSize = software.amazon.jsii.Kernel.get(this, "batchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.consumerGroupId = software.amazon.jsii.Kernel.get(this, "consumerGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.credentials = software.amazon.jsii.Kernel.get(this, "credentials", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials.class));
            this.maximumBatchingWindowInSeconds = software.amazon.jsii.Kernel.get(this, "maximumBatchingWindowInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.startingPosition = software.amazon.jsii.Kernel.get(this, "startingPosition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.topicName = java.util.Objects.requireNonNull(builder.topicName, "topicName is required");
            this.batchSize = builder.batchSize;
            this.consumerGroupId = builder.consumerGroupId;
            this.credentials = builder.credentials;
            this.maximumBatchingWindowInSeconds = builder.maximumBatchingWindowInSeconds;
            this.startingPosition = builder.startingPosition;
        }

        @Override
        public final java.lang.String getTopicName() {
            return this.topicName;
        }

        @Override
        public final java.lang.Number getBatchSize() {
            return this.batchSize;
        }

        @Override
        public final java.lang.String getConsumerGroupId() {
            return this.consumerGroupId;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParametersCredentials getCredentials() {
            return this.credentials;
        }

        @Override
        public final java.lang.Number getMaximumBatchingWindowInSeconds() {
            return this.maximumBatchingWindowInSeconds;
        }

        @Override
        public final java.lang.String getStartingPosition() {
            return this.startingPosition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("topicName", om.valueToTree(this.getTopicName()));
            if (this.getBatchSize() != null) {
                data.set("batchSize", om.valueToTree(this.getBatchSize()));
            }
            if (this.getConsumerGroupId() != null) {
                data.set("consumerGroupId", om.valueToTree(this.getConsumerGroupId()));
            }
            if (this.getCredentials() != null) {
                data.set("credentials", om.valueToTree(this.getCredentials()));
            }
            if (this.getMaximumBatchingWindowInSeconds() != null) {
                data.set("maximumBatchingWindowInSeconds", om.valueToTree(this.getMaximumBatchingWindowInSeconds()));
            }
            if (this.getStartingPosition() != null) {
                data.set("startingPosition", om.valueToTree(this.getStartingPosition()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeSourceParametersManagedStreamingKafkaParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeSourceParametersManagedStreamingKafkaParameters.Jsii$Proxy that = (PipesPipeSourceParametersManagedStreamingKafkaParameters.Jsii$Proxy) o;

            if (!topicName.equals(that.topicName)) return false;
            if (this.batchSize != null ? !this.batchSize.equals(that.batchSize) : that.batchSize != null) return false;
            if (this.consumerGroupId != null ? !this.consumerGroupId.equals(that.consumerGroupId) : that.consumerGroupId != null) return false;
            if (this.credentials != null ? !this.credentials.equals(that.credentials) : that.credentials != null) return false;
            if (this.maximumBatchingWindowInSeconds != null ? !this.maximumBatchingWindowInSeconds.equals(that.maximumBatchingWindowInSeconds) : that.maximumBatchingWindowInSeconds != null) return false;
            return this.startingPosition != null ? this.startingPosition.equals(that.startingPosition) : that.startingPosition == null;
        }

        @Override
        public final int hashCode() {
            int result = this.topicName.hashCode();
            result = 31 * result + (this.batchSize != null ? this.batchSize.hashCode() : 0);
            result = 31 * result + (this.consumerGroupId != null ? this.consumerGroupId.hashCode() : 0);
            result = 31 * result + (this.credentials != null ? this.credentials.hashCode() : 0);
            result = 31 * result + (this.maximumBatchingWindowInSeconds != null ? this.maximumBatchingWindowInSeconds.hashCode() : 0);
            result = 31 * result + (this.startingPosition != null ? this.startingPosition.hashCode() : 0);
            return result;
        }
    }
}
