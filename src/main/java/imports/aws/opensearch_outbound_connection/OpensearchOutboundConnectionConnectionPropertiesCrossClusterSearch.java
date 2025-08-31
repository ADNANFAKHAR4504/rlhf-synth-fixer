package imports.aws.opensearch_outbound_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.992Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchOutboundConnection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch")
@software.amazon.jsii.Jsii.Proxy(OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch.Jsii$Proxy.class)
public interface OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#skip_unavailable OpensearchOutboundConnection#skip_unavailable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSkipUnavailable() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch> {
        java.lang.String skipUnavailable;

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch#getSkipUnavailable}
         * @param skipUnavailable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#skip_unavailable OpensearchOutboundConnection#skip_unavailable}.
         * @return {@code this}
         */
        public Builder skipUnavailable(java.lang.String skipUnavailable) {
            this.skipUnavailable = skipUnavailable;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch {
        private final java.lang.String skipUnavailable;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.skipUnavailable = software.amazon.jsii.Kernel.get(this, "skipUnavailable", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.skipUnavailable = builder.skipUnavailable;
        }

        @Override
        public final java.lang.String getSkipUnavailable() {
            return this.skipUnavailable;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSkipUnavailable() != null) {
                data.set("skipUnavailable", om.valueToTree(this.getSkipUnavailable()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opensearchOutboundConnection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch.Jsii$Proxy that = (OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch.Jsii$Proxy) o;

            return this.skipUnavailable != null ? this.skipUnavailable.equals(that.skipUnavailable) : that.skipUnavailable == null;
        }

        @Override
        public final int hashCode() {
            int result = this.skipUnavailable != null ? this.skipUnavailable.hashCode() : 0;
            return result;
        }
    }
}
