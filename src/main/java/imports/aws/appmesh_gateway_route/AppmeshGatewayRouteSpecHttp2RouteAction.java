package imports.aws.appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.022Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteAction")
@software.amazon.jsii.Jsii.Proxy(AppmeshGatewayRouteSpecHttp2RouteAction.Jsii$Proxy.class)
public interface AppmeshGatewayRouteSpecHttp2RouteAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#target AppmeshGatewayRoute#target}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionTarget getTarget();

    /**
     * rewrite block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#rewrite AppmeshGatewayRoute#rewrite}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewrite getRewrite() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshGatewayRouteSpecHttp2RouteAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshGatewayRouteSpecHttp2RouteAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshGatewayRouteSpecHttp2RouteAction> {
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionTarget target;
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewrite rewrite;

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteAction#getTarget}
         * @param target target block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#target AppmeshGatewayRoute#target}
         * @return {@code this}
         */
        public Builder target(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionTarget target) {
            this.target = target;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteAction#getRewrite}
         * @param rewrite rewrite block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#rewrite AppmeshGatewayRoute#rewrite}
         * @return {@code this}
         */
        public Builder rewrite(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewrite rewrite) {
            this.rewrite = rewrite;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshGatewayRouteSpecHttp2RouteAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshGatewayRouteSpecHttp2RouteAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshGatewayRouteSpecHttp2RouteAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshGatewayRouteSpecHttp2RouteAction {
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionTarget target;
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewrite rewrite;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionTarget.class));
            this.rewrite = software.amazon.jsii.Kernel.get(this, "rewrite", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewrite.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.target = java.util.Objects.requireNonNull(builder.target, "target is required");
            this.rewrite = builder.rewrite;
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionTarget getTarget() {
            return this.target;
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewrite getRewrite() {
            return this.rewrite;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("target", om.valueToTree(this.getTarget()));
            if (this.getRewrite() != null) {
                data.set("rewrite", om.valueToTree(this.getRewrite()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshGatewayRouteSpecHttp2RouteAction.Jsii$Proxy that = (AppmeshGatewayRouteSpecHttp2RouteAction.Jsii$Proxy) o;

            if (!target.equals(that.target)) return false;
            return this.rewrite != null ? this.rewrite.equals(that.rewrite) : that.rewrite == null;
        }

        @Override
        public final int hashCode() {
            int result = this.target.hashCode();
            result = 31 * result + (this.rewrite != null ? this.rewrite.hashCode() : 0);
            return result;
        }
    }
}
