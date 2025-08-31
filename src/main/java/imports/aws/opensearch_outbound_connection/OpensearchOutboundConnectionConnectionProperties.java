package imports.aws.opensearch_outbound_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.992Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchOutboundConnection.OpensearchOutboundConnectionConnectionProperties")
@software.amazon.jsii.Jsii.Proxy(OpensearchOutboundConnectionConnectionProperties.Jsii$Proxy.class)
public interface OpensearchOutboundConnectionConnectionProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * cross_cluster_search block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#cross_cluster_search OpensearchOutboundConnection#cross_cluster_search}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch getCrossClusterSearch() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpensearchOutboundConnectionConnectionProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpensearchOutboundConnectionConnectionProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpensearchOutboundConnectionConnectionProperties> {
        imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch crossClusterSearch;

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConnectionProperties#getCrossClusterSearch}
         * @param crossClusterSearch cross_cluster_search block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#cross_cluster_search OpensearchOutboundConnection#cross_cluster_search}
         * @return {@code this}
         */
        public Builder crossClusterSearch(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch crossClusterSearch) {
            this.crossClusterSearch = crossClusterSearch;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpensearchOutboundConnectionConnectionProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpensearchOutboundConnectionConnectionProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpensearchOutboundConnectionConnectionProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpensearchOutboundConnectionConnectionProperties {
        private final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch crossClusterSearch;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.crossClusterSearch = software.amazon.jsii.Kernel.get(this, "crossClusterSearch", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.crossClusterSearch = builder.crossClusterSearch;
        }

        @Override
        public final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch getCrossClusterSearch() {
            return this.crossClusterSearch;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCrossClusterSearch() != null) {
                data.set("crossClusterSearch", om.valueToTree(this.getCrossClusterSearch()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opensearchOutboundConnection.OpensearchOutboundConnectionConnectionProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpensearchOutboundConnectionConnectionProperties.Jsii$Proxy that = (OpensearchOutboundConnectionConnectionProperties.Jsii$Proxy) o;

            return this.crossClusterSearch != null ? this.crossClusterSearch.equals(that.crossClusterSearch) : that.crossClusterSearch == null;
        }

        @Override
        public final int hashCode() {
            int result = this.crossClusterSearch != null ? this.crossClusterSearch.hashCode() : 0;
            return result;
        }
    }
}
