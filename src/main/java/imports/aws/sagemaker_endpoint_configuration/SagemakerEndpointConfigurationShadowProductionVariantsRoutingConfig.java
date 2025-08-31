package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.322Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig.Jsii$Proxy.class)
public interface SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#routing_strategy SagemakerEndpointConfiguration#routing_strategy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoutingStrategy();

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig> {
        java.lang.String routingStrategy;

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig#getRoutingStrategy}
         * @param routingStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#routing_strategy SagemakerEndpointConfiguration#routing_strategy}. This parameter is required.
         * @return {@code this}
         */
        public Builder routingStrategy(java.lang.String routingStrategy) {
            this.routingStrategy = routingStrategy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig {
        private final java.lang.String routingStrategy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.routingStrategy = software.amazon.jsii.Kernel.get(this, "routingStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.routingStrategy = java.util.Objects.requireNonNull(builder.routingStrategy, "routingStrategy is required");
        }

        @Override
        public final java.lang.String getRoutingStrategy() {
            return this.routingStrategy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("routingStrategy", om.valueToTree(this.getRoutingStrategy()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig.Jsii$Proxy that = (SagemakerEndpointConfigurationShadowProductionVariantsRoutingConfig.Jsii$Proxy) o;

            return this.routingStrategy.equals(that.routingStrategy);
        }

        @Override
        public final int hashCode() {
            int result = this.routingStrategy.hashCode();
            return result;
        }
    }
}
