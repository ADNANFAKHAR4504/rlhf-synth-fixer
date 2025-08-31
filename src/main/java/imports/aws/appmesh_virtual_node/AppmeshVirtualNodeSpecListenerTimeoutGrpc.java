package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.044Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerTimeoutGrpc")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecListenerTimeoutGrpc.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecListenerTimeoutGrpc extends software.amazon.jsii.JsiiSerializable {

    /**
     * idle block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#idle AppmeshVirtualNode#idle}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcIdle getIdle() {
        return null;
    }

    /**
     * per_request block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#per_request AppmeshVirtualNode#per_request}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcPerRequest getPerRequest() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecListenerTimeoutGrpc}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecListenerTimeoutGrpc}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecListenerTimeoutGrpc> {
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcIdle idle;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcPerRequest perRequest;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerTimeoutGrpc#getIdle}
         * @param idle idle block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#idle AppmeshVirtualNode#idle}
         * @return {@code this}
         */
        public Builder idle(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcIdle idle) {
            this.idle = idle;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerTimeoutGrpc#getPerRequest}
         * @param perRequest per_request block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#per_request AppmeshVirtualNode#per_request}
         * @return {@code this}
         */
        public Builder perRequest(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcPerRequest perRequest) {
            this.perRequest = perRequest;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecListenerTimeoutGrpc}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecListenerTimeoutGrpc build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecListenerTimeoutGrpc}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecListenerTimeoutGrpc {
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcIdle idle;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcPerRequest perRequest;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.idle = software.amazon.jsii.Kernel.get(this, "idle", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcIdle.class));
            this.perRequest = software.amazon.jsii.Kernel.get(this, "perRequest", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcPerRequest.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.idle = builder.idle;
            this.perRequest = builder.perRequest;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcIdle getIdle() {
            return this.idle;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpcPerRequest getPerRequest() {
            return this.perRequest;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIdle() != null) {
                data.set("idle", om.valueToTree(this.getIdle()));
            }
            if (this.getPerRequest() != null) {
                data.set("perRequest", om.valueToTree(this.getPerRequest()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerTimeoutGrpc"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecListenerTimeoutGrpc.Jsii$Proxy that = (AppmeshVirtualNodeSpecListenerTimeoutGrpc.Jsii$Proxy) o;

            if (this.idle != null ? !this.idle.equals(that.idle) : that.idle != null) return false;
            return this.perRequest != null ? this.perRequest.equals(that.perRequest) : that.perRequest == null;
        }

        @Override
        public final int hashCode() {
            int result = this.idle != null ? this.idle.hashCode() : 0;
            result = 31 * result + (this.perRequest != null ? this.perRequest.hashCode() : 0);
            return result;
        }
    }
}
