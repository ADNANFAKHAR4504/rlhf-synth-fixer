package imports.aws.cloudwatch_event_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.277Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary.Jsii$Proxy.class)
public interface CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#route CloudwatchEventEndpoint#route}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoute() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary> {
        java.lang.String route;

        /**
         * Sets the value of {@link CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary#getRoute}
         * @param route Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#route CloudwatchEventEndpoint#route}.
         * @return {@code this}
         */
        public Builder route(java.lang.String route) {
            this.route = route;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary {
        private final java.lang.String route;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.route = software.amazon.jsii.Kernel.get(this, "route", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.route = builder.route;
        }

        @Override
        public final java.lang.String getRoute() {
            return this.route;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRoute() != null) {
                data.set("route", om.valueToTree(this.getRoute()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary.Jsii$Proxy that = (CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary.Jsii$Proxy) o;

            return this.route != null ? this.route.equals(that.route) : that.route == null;
        }

        @Override
        public final int hashCode() {
            int result = this.route != null ? this.route.hashCode() : 0;
            return result;
        }
    }
}
