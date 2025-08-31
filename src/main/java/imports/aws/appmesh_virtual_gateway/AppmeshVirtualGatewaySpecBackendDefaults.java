package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.034Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecBackendDefaults")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualGatewaySpecBackendDefaults.Jsii$Proxy.class)
public interface AppmeshVirtualGatewaySpecBackendDefaults extends software.amazon.jsii.JsiiSerializable {

    /**
     * client_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#client_policy AppmeshVirtualGateway#client_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy getClientPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualGatewaySpecBackendDefaults}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualGatewaySpecBackendDefaults}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualGatewaySpecBackendDefaults> {
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy clientPolicy;

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecBackendDefaults#getClientPolicy}
         * @param clientPolicy client_policy block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#client_policy AppmeshVirtualGateway#client_policy}
         * @return {@code this}
         */
        public Builder clientPolicy(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy clientPolicy) {
            this.clientPolicy = clientPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualGatewaySpecBackendDefaults}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualGatewaySpecBackendDefaults build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualGatewaySpecBackendDefaults}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualGatewaySpecBackendDefaults {
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy clientPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clientPolicy = software.amazon.jsii.Kernel.get(this, "clientPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clientPolicy = builder.clientPolicy;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicy getClientPolicy() {
            return this.clientPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getClientPolicy() != null) {
                data.set("clientPolicy", om.valueToTree(this.getClientPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecBackendDefaults"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualGatewaySpecBackendDefaults.Jsii$Proxy that = (AppmeshVirtualGatewaySpecBackendDefaults.Jsii$Proxy) o;

            return this.clientPolicy != null ? this.clientPolicy.equals(that.clientPolicy) : that.clientPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clientPolicy != null ? this.clientPolicy.hashCode() : 0;
            return result;
        }
    }
}
