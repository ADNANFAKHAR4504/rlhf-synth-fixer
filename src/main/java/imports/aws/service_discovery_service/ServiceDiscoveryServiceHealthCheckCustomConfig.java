package imports.aws.service_discovery_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.428Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.serviceDiscoveryService.ServiceDiscoveryServiceHealthCheckCustomConfig")
@software.amazon.jsii.Jsii.Proxy(ServiceDiscoveryServiceHealthCheckCustomConfig.Jsii$Proxy.class)
public interface ServiceDiscoveryServiceHealthCheckCustomConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#failure_threshold ServiceDiscoveryService#failure_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFailureThreshold() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ServiceDiscoveryServiceHealthCheckCustomConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ServiceDiscoveryServiceHealthCheckCustomConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ServiceDiscoveryServiceHealthCheckCustomConfig> {
        java.lang.Number failureThreshold;

        /**
         * Sets the value of {@link ServiceDiscoveryServiceHealthCheckCustomConfig#getFailureThreshold}
         * @param failureThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#failure_threshold ServiceDiscoveryService#failure_threshold}.
         * @return {@code this}
         */
        public Builder failureThreshold(java.lang.Number failureThreshold) {
            this.failureThreshold = failureThreshold;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ServiceDiscoveryServiceHealthCheckCustomConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ServiceDiscoveryServiceHealthCheckCustomConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ServiceDiscoveryServiceHealthCheckCustomConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ServiceDiscoveryServiceHealthCheckCustomConfig {
        private final java.lang.Number failureThreshold;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.failureThreshold = software.amazon.jsii.Kernel.get(this, "failureThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.failureThreshold = builder.failureThreshold;
        }

        @Override
        public final java.lang.Number getFailureThreshold() {
            return this.failureThreshold;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFailureThreshold() != null) {
                data.set("failureThreshold", om.valueToTree(this.getFailureThreshold()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.serviceDiscoveryService.ServiceDiscoveryServiceHealthCheckCustomConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ServiceDiscoveryServiceHealthCheckCustomConfig.Jsii$Proxy that = (ServiceDiscoveryServiceHealthCheckCustomConfig.Jsii$Proxy) o;

            return this.failureThreshold != null ? this.failureThreshold.equals(that.failureThreshold) : that.failureThreshold == null;
        }

        @Override
        public final int hashCode() {
            int result = this.failureThreshold != null ? this.failureThreshold.hashCode() : 0;
            return result;
        }
    }
}
