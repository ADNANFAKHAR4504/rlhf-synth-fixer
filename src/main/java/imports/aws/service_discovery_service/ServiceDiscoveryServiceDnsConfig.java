package imports.aws.service_discovery_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.427Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.serviceDiscoveryService.ServiceDiscoveryServiceDnsConfig")
@software.amazon.jsii.Jsii.Proxy(ServiceDiscoveryServiceDnsConfig.Jsii$Proxy.class)
public interface ServiceDiscoveryServiceDnsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * dns_records block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#dns_records ServiceDiscoveryService#dns_records}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getDnsRecords();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#namespace_id ServiceDiscoveryService#namespace_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNamespaceId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#routing_policy ServiceDiscoveryService#routing_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ServiceDiscoveryServiceDnsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ServiceDiscoveryServiceDnsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ServiceDiscoveryServiceDnsConfig> {
        java.lang.Object dnsRecords;
        java.lang.String namespaceId;
        java.lang.String routingPolicy;

        /**
         * Sets the value of {@link ServiceDiscoveryServiceDnsConfig#getDnsRecords}
         * @param dnsRecords dns_records block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#dns_records ServiceDiscoveryService#dns_records}
         * @return {@code this}
         */
        public Builder dnsRecords(com.hashicorp.cdktf.IResolvable dnsRecords) {
            this.dnsRecords = dnsRecords;
            return this;
        }

        /**
         * Sets the value of {@link ServiceDiscoveryServiceDnsConfig#getDnsRecords}
         * @param dnsRecords dns_records block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#dns_records ServiceDiscoveryService#dns_records}
         * @return {@code this}
         */
        public Builder dnsRecords(java.util.List<? extends imports.aws.service_discovery_service.ServiceDiscoveryServiceDnsConfigDnsRecords> dnsRecords) {
            this.dnsRecords = dnsRecords;
            return this;
        }

        /**
         * Sets the value of {@link ServiceDiscoveryServiceDnsConfig#getNamespaceId}
         * @param namespaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#namespace_id ServiceDiscoveryService#namespace_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder namespaceId(java.lang.String namespaceId) {
            this.namespaceId = namespaceId;
            return this;
        }

        /**
         * Sets the value of {@link ServiceDiscoveryServiceDnsConfig#getRoutingPolicy}
         * @param routingPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/service_discovery_service#routing_policy ServiceDiscoveryService#routing_policy}.
         * @return {@code this}
         */
        public Builder routingPolicy(java.lang.String routingPolicy) {
            this.routingPolicy = routingPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ServiceDiscoveryServiceDnsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ServiceDiscoveryServiceDnsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ServiceDiscoveryServiceDnsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ServiceDiscoveryServiceDnsConfig {
        private final java.lang.Object dnsRecords;
        private final java.lang.String namespaceId;
        private final java.lang.String routingPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dnsRecords = software.amazon.jsii.Kernel.get(this, "dnsRecords", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.namespaceId = software.amazon.jsii.Kernel.get(this, "namespaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingPolicy = software.amazon.jsii.Kernel.get(this, "routingPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dnsRecords = java.util.Objects.requireNonNull(builder.dnsRecords, "dnsRecords is required");
            this.namespaceId = java.util.Objects.requireNonNull(builder.namespaceId, "namespaceId is required");
            this.routingPolicy = builder.routingPolicy;
        }

        @Override
        public final java.lang.Object getDnsRecords() {
            return this.dnsRecords;
        }

        @Override
        public final java.lang.String getNamespaceId() {
            return this.namespaceId;
        }

        @Override
        public final java.lang.String getRoutingPolicy() {
            return this.routingPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dnsRecords", om.valueToTree(this.getDnsRecords()));
            data.set("namespaceId", om.valueToTree(this.getNamespaceId()));
            if (this.getRoutingPolicy() != null) {
                data.set("routingPolicy", om.valueToTree(this.getRoutingPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.serviceDiscoveryService.ServiceDiscoveryServiceDnsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ServiceDiscoveryServiceDnsConfig.Jsii$Proxy that = (ServiceDiscoveryServiceDnsConfig.Jsii$Proxy) o;

            if (!dnsRecords.equals(that.dnsRecords)) return false;
            if (!namespaceId.equals(that.namespaceId)) return false;
            return this.routingPolicy != null ? this.routingPolicy.equals(that.routingPolicy) : that.routingPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dnsRecords.hashCode();
            result = 31 * result + (this.namespaceId.hashCode());
            result = 31 * result + (this.routingPolicy != null ? this.routingPolicy.hashCode() : 0);
            return result;
        }
    }
}
