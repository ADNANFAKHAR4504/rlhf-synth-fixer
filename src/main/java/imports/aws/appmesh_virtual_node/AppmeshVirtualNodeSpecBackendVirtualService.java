package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.042Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecBackendVirtualService")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecBackendVirtualService.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecBackendVirtualService extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#virtual_service_name AppmeshVirtualNode#virtual_service_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVirtualServiceName();

    /**
     * client_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#client_policy AppmeshVirtualNode#client_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicy getClientPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecBackendVirtualService}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecBackendVirtualService}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecBackendVirtualService> {
        java.lang.String virtualServiceName;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicy clientPolicy;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecBackendVirtualService#getVirtualServiceName}
         * @param virtualServiceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#virtual_service_name AppmeshVirtualNode#virtual_service_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder virtualServiceName(java.lang.String virtualServiceName) {
            this.virtualServiceName = virtualServiceName;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecBackendVirtualService#getClientPolicy}
         * @param clientPolicy client_policy block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#client_policy AppmeshVirtualNode#client_policy}
         * @return {@code this}
         */
        public Builder clientPolicy(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicy clientPolicy) {
            this.clientPolicy = clientPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecBackendVirtualService}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecBackendVirtualService build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecBackendVirtualService}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecBackendVirtualService {
        private final java.lang.String virtualServiceName;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicy clientPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.virtualServiceName = software.amazon.jsii.Kernel.get(this, "virtualServiceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clientPolicy = software.amazon.jsii.Kernel.get(this, "clientPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicy.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.virtualServiceName = java.util.Objects.requireNonNull(builder.virtualServiceName, "virtualServiceName is required");
            this.clientPolicy = builder.clientPolicy;
        }

        @Override
        public final java.lang.String getVirtualServiceName() {
            return this.virtualServiceName;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicy getClientPolicy() {
            return this.clientPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("virtualServiceName", om.valueToTree(this.getVirtualServiceName()));
            if (this.getClientPolicy() != null) {
                data.set("clientPolicy", om.valueToTree(this.getClientPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecBackendVirtualService"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecBackendVirtualService.Jsii$Proxy that = (AppmeshVirtualNodeSpecBackendVirtualService.Jsii$Proxy) o;

            if (!virtualServiceName.equals(that.virtualServiceName)) return false;
            return this.clientPolicy != null ? this.clientPolicy.equals(that.clientPolicy) : that.clientPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.virtualServiceName.hashCode();
            result = 31 * result + (this.clientPolicy != null ? this.clientPolicy.hashCode() : 0);
            return result;
        }
    }
}
