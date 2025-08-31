package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.043Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerConnectionPoolTcp")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecListenerConnectionPoolTcp.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecListenerConnectionPoolTcp extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#max_connections AppmeshVirtualNode#max_connections}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxConnections();

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecListenerConnectionPoolTcp}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecListenerConnectionPoolTcp}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecListenerConnectionPoolTcp> {
        java.lang.Number maxConnections;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerConnectionPoolTcp#getMaxConnections}
         * @param maxConnections Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#max_connections AppmeshVirtualNode#max_connections}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxConnections(java.lang.Number maxConnections) {
            this.maxConnections = maxConnections;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecListenerConnectionPoolTcp}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecListenerConnectionPoolTcp build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecListenerConnectionPoolTcp}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecListenerConnectionPoolTcp {
        private final java.lang.Number maxConnections;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxConnections = software.amazon.jsii.Kernel.get(this, "maxConnections", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxConnections = java.util.Objects.requireNonNull(builder.maxConnections, "maxConnections is required");
        }

        @Override
        public final java.lang.Number getMaxConnections() {
            return this.maxConnections;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxConnections", om.valueToTree(this.getMaxConnections()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerConnectionPoolTcp"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecListenerConnectionPoolTcp.Jsii$Proxy that = (AppmeshVirtualNodeSpecListenerConnectionPoolTcp.Jsii$Proxy) o;

            return this.maxConnections.equals(that.maxConnections);
        }

        @Override
        public final int hashCode() {
            int result = this.maxConnections.hashCode();
            return result;
        }
    }
}
