package imports.aws.appmesh_virtual_router;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.049Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualRouter.AppmeshVirtualRouterSpec")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualRouterSpec.Jsii$Proxy.class)
public interface AppmeshVirtualRouterSpec extends software.amazon.jsii.JsiiSerializable {

    /**
     * listener block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_router#listener AppmeshVirtualRouter#listener}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getListener() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualRouterSpec}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualRouterSpec}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualRouterSpec> {
        java.lang.Object listener;

        /**
         * Sets the value of {@link AppmeshVirtualRouterSpec#getListener}
         * @param listener listener block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_router#listener AppmeshVirtualRouter#listener}
         * @return {@code this}
         */
        public Builder listener(com.hashicorp.cdktf.IResolvable listener) {
            this.listener = listener;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualRouterSpec#getListener}
         * @param listener listener block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_router#listener AppmeshVirtualRouter#listener}
         * @return {@code this}
         */
        public Builder listener(java.util.List<? extends imports.aws.appmesh_virtual_router.AppmeshVirtualRouterSpecListener> listener) {
            this.listener = listener;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualRouterSpec}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualRouterSpec build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualRouterSpec}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualRouterSpec {
        private final java.lang.Object listener;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.listener = software.amazon.jsii.Kernel.get(this, "listener", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.listener = builder.listener;
        }

        @Override
        public final java.lang.Object getListener() {
            return this.listener;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getListener() != null) {
                data.set("listener", om.valueToTree(this.getListener()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualRouter.AppmeshVirtualRouterSpec"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualRouterSpec.Jsii$Proxy that = (AppmeshVirtualRouterSpec.Jsii$Proxy) o;

            return this.listener != null ? this.listener.equals(that.listener) : that.listener == null;
        }

        @Override
        public final int hashCode() {
            int result = this.listener != null ? this.listener.hashCode() : 0;
            return result;
        }
    }
}
