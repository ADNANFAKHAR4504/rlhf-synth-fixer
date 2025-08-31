package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParameters")
@software.amazon.jsii.Jsii.Proxy(PipesPipeSourceParametersSelfManagedKafkaParameters.Jsii$Proxy.class)
public interface PipesPipeSourceParametersSelfManagedKafkaParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#topic_name PipesPipe#topic_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTopicName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#additional_bootstrap_servers PipesPipe#additional_bootstrap_servers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdditionalBootstrapServers() {
        return null;
    }

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
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials getCredentials() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumBatchingWindowInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#server_root_ca_certificate PipesPipe#server_root_ca_certificate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServerRootCaCertificate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartingPosition() {
        return null;
    }

    /**
     * vpc block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#vpc PipesPipe#vpc}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpc getVpc() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeSourceParametersSelfManagedKafkaParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeSourceParametersSelfManagedKafkaParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeSourceParametersSelfManagedKafkaParameters> {
        java.lang.String topicName;
        java.util.List<java.lang.String> additionalBootstrapServers;
        java.lang.Number batchSize;
        java.lang.String consumerGroupId;
        imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials credentials;
        java.lang.Number maximumBatchingWindowInSeconds;
        java.lang.String serverRootCaCertificate;
        java.lang.String startingPosition;
        imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpc vpc;

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParameters#getTopicName}
         * @param topicName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#topic_name PipesPipe#topic_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder topicName(java.lang.String topicName) {
            this.topicName = topicName;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParameters#getAdditionalBootstrapServers}
         * @param additionalBootstrapServers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#additional_bootstrap_servers PipesPipe#additional_bootstrap_servers}.
         * @return {@code this}
         */
        public Builder additionalBootstrapServers(java.util.List<java.lang.String> additionalBootstrapServers) {
            this.additionalBootstrapServers = additionalBootstrapServers;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParameters#getBatchSize}
         * @param batchSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
         * @return {@code this}
         */
        public Builder batchSize(java.lang.Number batchSize) {
            this.batchSize = batchSize;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParameters#getConsumerGroupId}
         * @param consumerGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#consumer_group_id PipesPipe#consumer_group_id}.
         * @return {@code this}
         */
        public Builder consumerGroupId(java.lang.String consumerGroupId) {
            this.consumerGroupId = consumerGroupId;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParameters#getCredentials}
         * @param credentials credentials block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#credentials PipesPipe#credentials}
         * @return {@code this}
         */
        public Builder credentials(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials credentials) {
            this.credentials = credentials;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParameters#getMaximumBatchingWindowInSeconds}
         * @param maximumBatchingWindowInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
         * @return {@code this}
         */
        public Builder maximumBatchingWindowInSeconds(java.lang.Number maximumBatchingWindowInSeconds) {
            this.maximumBatchingWindowInSeconds = maximumBatchingWindowInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParameters#getServerRootCaCertificate}
         * @param serverRootCaCertificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#server_root_ca_certificate PipesPipe#server_root_ca_certificate}.
         * @return {@code this}
         */
        public Builder serverRootCaCertificate(java.lang.String serverRootCaCertificate) {
            this.serverRootCaCertificate = serverRootCaCertificate;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParameters#getStartingPosition}
         * @param startingPosition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
         * @return {@code this}
         */
        public Builder startingPosition(java.lang.String startingPosition) {
            this.startingPosition = startingPosition;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersSelfManagedKafkaParameters#getVpc}
         * @param vpc vpc block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#vpc PipesPipe#vpc}
         * @return {@code this}
         */
        public Builder vpc(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpc vpc) {
            this.vpc = vpc;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeSourceParametersSelfManagedKafkaParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeSourceParametersSelfManagedKafkaParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeSourceParametersSelfManagedKafkaParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeSourceParametersSelfManagedKafkaParameters {
        private final java.lang.String topicName;
        private final java.util.List<java.lang.String> additionalBootstrapServers;
        private final java.lang.Number batchSize;
        private final java.lang.String consumerGroupId;
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials credentials;
        private final java.lang.Number maximumBatchingWindowInSeconds;
        private final java.lang.String serverRootCaCertificate;
        private final java.lang.String startingPosition;
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpc vpc;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.topicName = software.amazon.jsii.Kernel.get(this, "topicName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.additionalBootstrapServers = software.amazon.jsii.Kernel.get(this, "additionalBootstrapServers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.batchSize = software.amazon.jsii.Kernel.get(this, "batchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.consumerGroupId = software.amazon.jsii.Kernel.get(this, "consumerGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.credentials = software.amazon.jsii.Kernel.get(this, "credentials", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials.class));
            this.maximumBatchingWindowInSeconds = software.amazon.jsii.Kernel.get(this, "maximumBatchingWindowInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.serverRootCaCertificate = software.amazon.jsii.Kernel.get(this, "serverRootCaCertificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startingPosition = software.amazon.jsii.Kernel.get(this, "startingPosition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpc = software.amazon.jsii.Kernel.get(this, "vpc", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpc.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.topicName = java.util.Objects.requireNonNull(builder.topicName, "topicName is required");
            this.additionalBootstrapServers = builder.additionalBootstrapServers;
            this.batchSize = builder.batchSize;
            this.consumerGroupId = builder.consumerGroupId;
            this.credentials = builder.credentials;
            this.maximumBatchingWindowInSeconds = builder.maximumBatchingWindowInSeconds;
            this.serverRootCaCertificate = builder.serverRootCaCertificate;
            this.startingPosition = builder.startingPosition;
            this.vpc = builder.vpc;
        }

        @Override
        public final java.lang.String getTopicName() {
            return this.topicName;
        }

        @Override
        public final java.util.List<java.lang.String> getAdditionalBootstrapServers() {
            return this.additionalBootstrapServers;
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
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials getCredentials() {
            return this.credentials;
        }

        @Override
        public final java.lang.Number getMaximumBatchingWindowInSeconds() {
            return this.maximumBatchingWindowInSeconds;
        }

        @Override
        public final java.lang.String getServerRootCaCertificate() {
            return this.serverRootCaCertificate;
        }

        @Override
        public final java.lang.String getStartingPosition() {
            return this.startingPosition;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpc getVpc() {
            return this.vpc;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("topicName", om.valueToTree(this.getTopicName()));
            if (this.getAdditionalBootstrapServers() != null) {
                data.set("additionalBootstrapServers", om.valueToTree(this.getAdditionalBootstrapServers()));
            }
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
            if (this.getServerRootCaCertificate() != null) {
                data.set("serverRootCaCertificate", om.valueToTree(this.getServerRootCaCertificate()));
            }
            if (this.getStartingPosition() != null) {
                data.set("startingPosition", om.valueToTree(this.getStartingPosition()));
            }
            if (this.getVpc() != null) {
                data.set("vpc", om.valueToTree(this.getVpc()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeSourceParametersSelfManagedKafkaParameters.Jsii$Proxy that = (PipesPipeSourceParametersSelfManagedKafkaParameters.Jsii$Proxy) o;

            if (!topicName.equals(that.topicName)) return false;
            if (this.additionalBootstrapServers != null ? !this.additionalBootstrapServers.equals(that.additionalBootstrapServers) : that.additionalBootstrapServers != null) return false;
            if (this.batchSize != null ? !this.batchSize.equals(that.batchSize) : that.batchSize != null) return false;
            if (this.consumerGroupId != null ? !this.consumerGroupId.equals(that.consumerGroupId) : that.consumerGroupId != null) return false;
            if (this.credentials != null ? !this.credentials.equals(that.credentials) : that.credentials != null) return false;
            if (this.maximumBatchingWindowInSeconds != null ? !this.maximumBatchingWindowInSeconds.equals(that.maximumBatchingWindowInSeconds) : that.maximumBatchingWindowInSeconds != null) return false;
            if (this.serverRootCaCertificate != null ? !this.serverRootCaCertificate.equals(that.serverRootCaCertificate) : that.serverRootCaCertificate != null) return false;
            if (this.startingPosition != null ? !this.startingPosition.equals(that.startingPosition) : that.startingPosition != null) return false;
            return this.vpc != null ? this.vpc.equals(that.vpc) : that.vpc == null;
        }

        @Override
        public final int hashCode() {
            int result = this.topicName.hashCode();
            result = 31 * result + (this.additionalBootstrapServers != null ? this.additionalBootstrapServers.hashCode() : 0);
            result = 31 * result + (this.batchSize != null ? this.batchSize.hashCode() : 0);
            result = 31 * result + (this.consumerGroupId != null ? this.consumerGroupId.hashCode() : 0);
            result = 31 * result + (this.credentials != null ? this.credentials.hashCode() : 0);
            result = 31 * result + (this.maximumBatchingWindowInSeconds != null ? this.maximumBatchingWindowInSeconds.hashCode() : 0);
            result = 31 * result + (this.serverRootCaCertificate != null ? this.serverRootCaCertificate.hashCode() : 0);
            result = 31 * result + (this.startingPosition != null ? this.startingPosition.hashCode() : 0);
            result = 31 * result + (this.vpc != null ? this.vpc.hashCode() : 0);
            return result;
        }
    }
}
