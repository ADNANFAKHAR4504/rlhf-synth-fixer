package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.180Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainClusterConfigZoneAwarenessConfig")
@software.amazon.jsii.Jsii.Proxy(ElasticsearchDomainClusterConfigZoneAwarenessConfig.Jsii$Proxy.class)
public interface ElasticsearchDomainClusterConfigZoneAwarenessConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#availability_zone_count ElasticsearchDomain#availability_zone_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAvailabilityZoneCount() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticsearchDomainClusterConfigZoneAwarenessConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticsearchDomainClusterConfigZoneAwarenessConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticsearchDomainClusterConfigZoneAwarenessConfig> {
        java.lang.Number availabilityZoneCount;

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfigZoneAwarenessConfig#getAvailabilityZoneCount}
         * @param availabilityZoneCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#availability_zone_count ElasticsearchDomain#availability_zone_count}.
         * @return {@code this}
         */
        public Builder availabilityZoneCount(java.lang.Number availabilityZoneCount) {
            this.availabilityZoneCount = availabilityZoneCount;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticsearchDomainClusterConfigZoneAwarenessConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticsearchDomainClusterConfigZoneAwarenessConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticsearchDomainClusterConfigZoneAwarenessConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticsearchDomainClusterConfigZoneAwarenessConfig {
        private final java.lang.Number availabilityZoneCount;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.availabilityZoneCount = software.amazon.jsii.Kernel.get(this, "availabilityZoneCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.availabilityZoneCount = builder.availabilityZoneCount;
        }

        @Override
        public final java.lang.Number getAvailabilityZoneCount() {
            return this.availabilityZoneCount;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAvailabilityZoneCount() != null) {
                data.set("availabilityZoneCount", om.valueToTree(this.getAvailabilityZoneCount()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticsearchDomain.ElasticsearchDomainClusterConfigZoneAwarenessConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticsearchDomainClusterConfigZoneAwarenessConfig.Jsii$Proxy that = (ElasticsearchDomainClusterConfigZoneAwarenessConfig.Jsii$Proxy) o;

            return this.availabilityZoneCount != null ? this.availabilityZoneCount.equals(that.availabilityZoneCount) : that.availabilityZoneCount == null;
        }

        @Override
        public final int hashCode() {
            int result = this.availabilityZoneCount != null ? this.availabilityZoneCount.hashCode() : 0;
            return result;
        }
    }
}
