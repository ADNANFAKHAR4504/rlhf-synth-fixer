package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.041Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecBackend")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecBackend.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecBackend extends software.amazon.jsii.JsiiSerializable {

    /**
     * virtual_service block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#virtual_service AppmeshVirtualNode#virtual_service}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualService getVirtualService();

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecBackend}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecBackend}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecBackend> {
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualService virtualService;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecBackend#getVirtualService}
         * @param virtualService virtual_service block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#virtual_service AppmeshVirtualNode#virtual_service}
         * @return {@code this}
         */
        public Builder virtualService(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualService virtualService) {
            this.virtualService = virtualService;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecBackend}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecBackend build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecBackend}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecBackend {
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualService virtualService;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.virtualService = software.amazon.jsii.Kernel.get(this, "virtualService", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualService.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.virtualService = java.util.Objects.requireNonNull(builder.virtualService, "virtualService is required");
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualService getVirtualService() {
            return this.virtualService;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("virtualService", om.valueToTree(this.getVirtualService()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecBackend"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecBackend.Jsii$Proxy that = (AppmeshVirtualNodeSpecBackend.Jsii$Proxy) o;

            return this.virtualService.equals(that.virtualService);
        }

        @Override
        public final int hashCode() {
            int result = this.virtualService.hashCode();
            return result;
        }
    }
}
