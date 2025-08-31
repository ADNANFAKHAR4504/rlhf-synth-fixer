package imports.aws.cloudwatch_event_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.277Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfig")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventEndpointRoutingConfigFailoverConfig.Jsii$Proxy.class)
public interface CloudwatchEventEndpointRoutingConfigFailoverConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * primary block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#primary CloudwatchEventEndpoint#primary}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary getPrimary();

    /**
     * secondary block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#secondary CloudwatchEventEndpoint#secondary}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary getSecondary();

    /**
     * @return a {@link Builder} of {@link CloudwatchEventEndpointRoutingConfigFailoverConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventEndpointRoutingConfigFailoverConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventEndpointRoutingConfigFailoverConfig> {
        imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary primary;
        imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary secondary;

        /**
         * Sets the value of {@link CloudwatchEventEndpointRoutingConfigFailoverConfig#getPrimary}
         * @param primary primary block. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#primary CloudwatchEventEndpoint#primary}
         * @return {@code this}
         */
        public Builder primary(imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary primary) {
            this.primary = primary;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventEndpointRoutingConfigFailoverConfig#getSecondary}
         * @param secondary secondary block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#secondary CloudwatchEventEndpoint#secondary}
         * @return {@code this}
         */
        public Builder secondary(imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary secondary) {
            this.secondary = secondary;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventEndpointRoutingConfigFailoverConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventEndpointRoutingConfigFailoverConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventEndpointRoutingConfigFailoverConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventEndpointRoutingConfigFailoverConfig {
        private final imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary primary;
        private final imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary secondary;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.primary = software.amazon.jsii.Kernel.get(this, "primary", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary.class));
            this.secondary = software.amazon.jsii.Kernel.get(this, "secondary", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.primary = java.util.Objects.requireNonNull(builder.primary, "primary is required");
            this.secondary = java.util.Objects.requireNonNull(builder.secondary, "secondary is required");
        }

        @Override
        public final imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary getPrimary() {
            return this.primary;
        }

        @Override
        public final imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary getSecondary() {
            return this.secondary;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("primary", om.valueToTree(this.getPrimary()));
            data.set("secondary", om.valueToTree(this.getSecondary()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventEndpointRoutingConfigFailoverConfig.Jsii$Proxy that = (CloudwatchEventEndpointRoutingConfigFailoverConfig.Jsii$Proxy) o;

            if (!primary.equals(that.primary)) return false;
            return this.secondary.equals(that.secondary);
        }

        @Override
        public final int hashCode() {
            int result = this.primary.hashCode();
            result = 31 * result + (this.secondary.hashCode());
            return result;
        }
    }
}
