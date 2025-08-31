package imports.aws.cloudwatch_event_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.277Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfig")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventEndpointRoutingConfig.Jsii$Proxy.class)
public interface CloudwatchEventEndpointRoutingConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * failover_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#failover_config CloudwatchEventEndpoint#failover_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfig getFailoverConfig();

    /**
     * @return a {@link Builder} of {@link CloudwatchEventEndpointRoutingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventEndpointRoutingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventEndpointRoutingConfig> {
        imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfig failoverConfig;

        /**
         * Sets the value of {@link CloudwatchEventEndpointRoutingConfig#getFailoverConfig}
         * @param failoverConfig failover_config block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#failover_config CloudwatchEventEndpoint#failover_config}
         * @return {@code this}
         */
        public Builder failoverConfig(imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfig failoverConfig) {
            this.failoverConfig = failoverConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventEndpointRoutingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventEndpointRoutingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventEndpointRoutingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventEndpointRoutingConfig {
        private final imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfig failoverConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.failoverConfig = software.amazon.jsii.Kernel.get(this, "failoverConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.failoverConfig = java.util.Objects.requireNonNull(builder.failoverConfig, "failoverConfig is required");
        }

        @Override
        public final imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfig getFailoverConfig() {
            return this.failoverConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("failoverConfig", om.valueToTree(this.getFailoverConfig()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventEndpointRoutingConfig.Jsii$Proxy that = (CloudwatchEventEndpointRoutingConfig.Jsii$Proxy) o;

            return this.failoverConfig.equals(that.failoverConfig);
        }

        @Override
        public final int hashCode() {
            int result = this.failoverConfig.hashCode();
            return result;
        }
    }
}
