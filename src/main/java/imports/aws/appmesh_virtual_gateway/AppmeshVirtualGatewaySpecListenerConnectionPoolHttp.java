package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.038Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualGatewaySpecListenerConnectionPoolHttp.Jsii$Proxy.class)
public interface AppmeshVirtualGatewaySpecListenerConnectionPoolHttp extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#max_connections AppmeshVirtualGateway#max_connections}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxConnections();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#max_pending_requests AppmeshVirtualGateway#max_pending_requests}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxPendingRequests() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualGatewaySpecListenerConnectionPoolHttp}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualGatewaySpecListenerConnectionPoolHttp}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualGatewaySpecListenerConnectionPoolHttp> {
        java.lang.Number maxConnections;
        java.lang.Number maxPendingRequests;

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListenerConnectionPoolHttp#getMaxConnections}
         * @param maxConnections Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#max_connections AppmeshVirtualGateway#max_connections}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxConnections(java.lang.Number maxConnections) {
            this.maxConnections = maxConnections;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListenerConnectionPoolHttp#getMaxPendingRequests}
         * @param maxPendingRequests Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#max_pending_requests AppmeshVirtualGateway#max_pending_requests}.
         * @return {@code this}
         */
        public Builder maxPendingRequests(java.lang.Number maxPendingRequests) {
            this.maxPendingRequests = maxPendingRequests;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualGatewaySpecListenerConnectionPoolHttp}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualGatewaySpecListenerConnectionPoolHttp build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualGatewaySpecListenerConnectionPoolHttp}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualGatewaySpecListenerConnectionPoolHttp {
        private final java.lang.Number maxConnections;
        private final java.lang.Number maxPendingRequests;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxConnections = software.amazon.jsii.Kernel.get(this, "maxConnections", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxPendingRequests = software.amazon.jsii.Kernel.get(this, "maxPendingRequests", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxConnections = java.util.Objects.requireNonNull(builder.maxConnections, "maxConnections is required");
            this.maxPendingRequests = builder.maxPendingRequests;
        }

        @Override
        public final java.lang.Number getMaxConnections() {
            return this.maxConnections;
        }

        @Override
        public final java.lang.Number getMaxPendingRequests() {
            return this.maxPendingRequests;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxConnections", om.valueToTree(this.getMaxConnections()));
            if (this.getMaxPendingRequests() != null) {
                data.set("maxPendingRequests", om.valueToTree(this.getMaxPendingRequests()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualGatewaySpecListenerConnectionPoolHttp.Jsii$Proxy that = (AppmeshVirtualGatewaySpecListenerConnectionPoolHttp.Jsii$Proxy) o;

            if (!maxConnections.equals(that.maxConnections)) return false;
            return this.maxPendingRequests != null ? this.maxPendingRequests.equals(that.maxPendingRequests) : that.maxPendingRequests == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxConnections.hashCode();
            result = 31 * result + (this.maxPendingRequests != null ? this.maxPendingRequests.hashCode() : 0);
            return result;
        }
    }
}
