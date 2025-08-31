package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.034Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy.Jsii$Proxy.class)
public interface AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * tls block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#tls AppmeshVirtualGateway#tls}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTls getTls() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy> {
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTls tls;

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy#getTls}
         * @param tls tls block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#tls AppmeshVirtualGateway#tls}
         * @return {@code this}
         */
        public Builder tls(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTls tls) {
            this.tls = tls;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy {
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTls tls;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.tls = software.amazon.jsii.Kernel.get(this, "tls", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTls.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.tls = builder.tls;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTls getTls() {
            return this.tls;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTls() != null) {
                data.set("tls", om.valueToTree(this.getTls()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy.Jsii$Proxy that = (AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy.Jsii$Proxy) o;

            return this.tls != null ? this.tls.equals(that.tls) : that.tls == null;
        }

        @Override
        public final int hashCode() {
            int result = this.tls != null ? this.tls.hashCode() : 0;
            return result;
        }
    }
}
