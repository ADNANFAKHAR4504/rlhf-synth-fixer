package imports.aws.lambda_event_source_mapping;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.503Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaEventSourceMapping.LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig.Jsii$Proxy.class)
public interface LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#consumer_group_id LambdaEventSourceMapping#consumer_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConsumerGroupId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig> {
        java.lang.String consumerGroupId;

        /**
         * Sets the value of {@link LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig#getConsumerGroupId}
         * @param consumerGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#consumer_group_id LambdaEventSourceMapping#consumer_group_id}.
         * @return {@code this}
         */
        public Builder consumerGroupId(java.lang.String consumerGroupId) {
            this.consumerGroupId = consumerGroupId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig {
        private final java.lang.String consumerGroupId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.consumerGroupId = software.amazon.jsii.Kernel.get(this, "consumerGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.consumerGroupId = builder.consumerGroupId;
        }

        @Override
        public final java.lang.String getConsumerGroupId() {
            return this.consumerGroupId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConsumerGroupId() != null) {
                data.set("consumerGroupId", om.valueToTree(this.getConsumerGroupId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaEventSourceMapping.LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig.Jsii$Proxy that = (LambdaEventSourceMappingSelfManagedKafkaEventSourceConfig.Jsii$Proxy) o;

            return this.consumerGroupId != null ? this.consumerGroupId.equals(that.consumerGroupId) : that.consumerGroupId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.consumerGroupId != null ? this.consumerGroupId.hashCode() : 0;
            return result;
        }
    }
}
