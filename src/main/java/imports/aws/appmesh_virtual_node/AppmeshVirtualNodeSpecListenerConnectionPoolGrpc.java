package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.043Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerConnectionPoolGrpc")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecListenerConnectionPoolGrpc.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecListenerConnectionPoolGrpc extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#max_requests AppmeshVirtualNode#max_requests}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxRequests();

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecListenerConnectionPoolGrpc}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecListenerConnectionPoolGrpc}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecListenerConnectionPoolGrpc> {
        java.lang.Number maxRequests;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerConnectionPoolGrpc#getMaxRequests}
         * @param maxRequests Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#max_requests AppmeshVirtualNode#max_requests}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxRequests(java.lang.Number maxRequests) {
            this.maxRequests = maxRequests;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecListenerConnectionPoolGrpc}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecListenerConnectionPoolGrpc build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecListenerConnectionPoolGrpc}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecListenerConnectionPoolGrpc {
        private final java.lang.Number maxRequests;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxRequests = software.amazon.jsii.Kernel.get(this, "maxRequests", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxRequests = java.util.Objects.requireNonNull(builder.maxRequests, "maxRequests is required");
        }

        @Override
        public final java.lang.Number getMaxRequests() {
            return this.maxRequests;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxRequests", om.valueToTree(this.getMaxRequests()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerConnectionPoolGrpc"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecListenerConnectionPoolGrpc.Jsii$Proxy that = (AppmeshVirtualNodeSpecListenerConnectionPoolGrpc.Jsii$Proxy) o;

            return this.maxRequests.equals(that.maxRequests);
        }

        @Override
        public final int hashCode() {
            int result = this.maxRequests.hashCode();
            return result;
        }
    }
}
