package imports.aws.cloudwatch_event_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.277Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary.Jsii$Proxy.class)
public interface CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#health_check CloudwatchEventEndpoint#health_check}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHealthCheck() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary> {
        java.lang.String healthCheck;

        /**
         * Sets the value of {@link CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary#getHealthCheck}
         * @param healthCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#health_check CloudwatchEventEndpoint#health_check}.
         * @return {@code this}
         */
        public Builder healthCheck(java.lang.String healthCheck) {
            this.healthCheck = healthCheck;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary {
        private final java.lang.String healthCheck;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.healthCheck = software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.healthCheck = builder.healthCheck;
        }

        @Override
        public final java.lang.String getHealthCheck() {
            return this.healthCheck;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHealthCheck() != null) {
                data.set("healthCheck", om.valueToTree(this.getHealthCheck()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary.Jsii$Proxy that = (CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary.Jsii$Proxy) o;

            return this.healthCheck != null ? this.healthCheck.equals(that.healthCheck) : that.healthCheck == null;
        }

        @Override
        public final int hashCode() {
            int result = this.healthCheck != null ? this.healthCheck.hashCode() : 0;
            return result;
        }
    }
}
