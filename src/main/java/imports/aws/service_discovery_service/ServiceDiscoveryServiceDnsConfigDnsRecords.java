package imports.aws.service_discovery_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.427Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.serviceDiscoveryService.ServiceDiscoveryServiceDnsConfigDnsRecords")
@software.amazon.jsii.Jsii.Proxy(ServiceDiscoveryServiceDnsConfigDnsRecords.Jsii$Proxy.class)
public interface ServiceDiscoveryServiceDnsConfigDnsRecords extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#ttl ServiceDiscoveryService#ttl}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTtl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#type ServiceDiscoveryService#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * @return a {@link Builder} of {@link ServiceDiscoveryServiceDnsConfigDnsRecords}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ServiceDiscoveryServiceDnsConfigDnsRecords}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ServiceDiscoveryServiceDnsConfigDnsRecords> {
        java.lang.Number ttl;
        java.lang.String type;

        /**
         * Sets the value of {@link ServiceDiscoveryServiceDnsConfigDnsRecords#getTtl}
         * @param ttl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#ttl ServiceDiscoveryService#ttl}. This parameter is required.
         * @return {@code this}
         */
        public Builder ttl(java.lang.Number ttl) {
            this.ttl = ttl;
            return this;
        }

        /**
         * Sets the value of {@link ServiceDiscoveryServiceDnsConfigDnsRecords#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#type ServiceDiscoveryService#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ServiceDiscoveryServiceDnsConfigDnsRecords}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ServiceDiscoveryServiceDnsConfigDnsRecords build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ServiceDiscoveryServiceDnsConfigDnsRecords}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ServiceDiscoveryServiceDnsConfigDnsRecords {
        private final java.lang.Number ttl;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ttl = software.amazon.jsii.Kernel.get(this, "ttl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ttl = java.util.Objects.requireNonNull(builder.ttl, "ttl is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
        }

        @Override
        public final java.lang.Number getTtl() {
            return this.ttl;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ttl", om.valueToTree(this.getTtl()));
            data.set("type", om.valueToTree(this.getType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.serviceDiscoveryService.ServiceDiscoveryServiceDnsConfigDnsRecords"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ServiceDiscoveryServiceDnsConfigDnsRecords.Jsii$Proxy that = (ServiceDiscoveryServiceDnsConfigDnsRecords.Jsii$Proxy) o;

            if (!ttl.equals(that.ttl)) return false;
            return this.type.equals(that.type);
        }

        @Override
        public final int hashCode() {
            int result = this.ttl.hashCode();
            result = 31 * result + (this.type.hashCode());
            return result;
        }
    }
}
