package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.047Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerTimeoutTcp")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecListenerTimeoutTcp.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecListenerTimeoutTcp extends software.amazon.jsii.JsiiSerializable {

    /**
     * idle block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#idle AppmeshVirtualNode#idle}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutTcpIdle getIdle() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecListenerTimeoutTcp}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecListenerTimeoutTcp}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecListenerTimeoutTcp> {
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutTcpIdle idle;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerTimeoutTcp#getIdle}
         * @param idle idle block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#idle AppmeshVirtualNode#idle}
         * @return {@code this}
         */
        public Builder idle(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutTcpIdle idle) {
            this.idle = idle;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecListenerTimeoutTcp}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecListenerTimeoutTcp build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecListenerTimeoutTcp}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecListenerTimeoutTcp {
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutTcpIdle idle;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.idle = software.amazon.jsii.Kernel.get(this, "idle", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutTcpIdle.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.idle = builder.idle;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutTcpIdle getIdle() {
            return this.idle;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIdle() != null) {
                data.set("idle", om.valueToTree(this.getIdle()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerTimeoutTcp"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecListenerTimeoutTcp.Jsii$Proxy that = (AppmeshVirtualNodeSpecListenerTimeoutTcp.Jsii$Proxy) o;

            return this.idle != null ? this.idle.equals(that.idle) : that.idle == null;
        }

        @Override
        public final int hashCode() {
            int result = this.idle != null ? this.idle.hashCode() : 0;
            return result;
        }
    }
}
