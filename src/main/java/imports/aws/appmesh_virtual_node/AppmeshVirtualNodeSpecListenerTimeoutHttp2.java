package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.046Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerTimeoutHttp2")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecListenerTimeoutHttp2.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecListenerTimeoutHttp2 extends software.amazon.jsii.JsiiSerializable {

    /**
     * idle block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#idle AppmeshVirtualNode#idle}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2Idle getIdle() {
        return null;
    }

    /**
     * per_request block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#per_request AppmeshVirtualNode#per_request}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2PerRequest getPerRequest() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecListenerTimeoutHttp2}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecListenerTimeoutHttp2}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecListenerTimeoutHttp2> {
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2Idle idle;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2PerRequest perRequest;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerTimeoutHttp2#getIdle}
         * @param idle idle block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#idle AppmeshVirtualNode#idle}
         * @return {@code this}
         */
        public Builder idle(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2Idle idle) {
            this.idle = idle;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerTimeoutHttp2#getPerRequest}
         * @param perRequest per_request block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#per_request AppmeshVirtualNode#per_request}
         * @return {@code this}
         */
        public Builder perRequest(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2PerRequest perRequest) {
            this.perRequest = perRequest;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecListenerTimeoutHttp2}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecListenerTimeoutHttp2 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecListenerTimeoutHttp2}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecListenerTimeoutHttp2 {
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2Idle idle;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2PerRequest perRequest;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.idle = software.amazon.jsii.Kernel.get(this, "idle", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2Idle.class));
            this.perRequest = software.amazon.jsii.Kernel.get(this, "perRequest", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2PerRequest.class));
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
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2Idle getIdle() {
            return this.idle;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2PerRequest getPerRequest() {
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
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerTimeoutHttp2"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecListenerTimeoutHttp2.Jsii$Proxy that = (AppmeshVirtualNodeSpecListenerTimeoutHttp2.Jsii$Proxy) o;

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
