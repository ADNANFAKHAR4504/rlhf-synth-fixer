package imports.aws.appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.022Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewrite")
@software.amazon.jsii.Jsii.Proxy(AppmeshGatewayRouteSpecHttp2RouteActionRewrite.Jsii$Proxy.class)
public interface AppmeshGatewayRouteSpecHttp2RouteActionRewrite extends software.amazon.jsii.JsiiSerializable {

    /**
     * hostname block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname getHostname() {
        return null;
    }

    /**
     * path block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath getPath() {
        return null;
    }

    /**
     * prefix block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix getPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshGatewayRouteSpecHttp2RouteActionRewrite}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshGatewayRouteSpecHttp2RouteActionRewrite}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshGatewayRouteSpecHttp2RouteActionRewrite> {
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname hostname;
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath path;
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix prefix;

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteActionRewrite#getHostname}
         * @param hostname hostname block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
         * @return {@code this}
         */
        public Builder hostname(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname hostname) {
            this.hostname = hostname;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteActionRewrite#getPath}
         * @param path path block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
         * @return {@code this}
         */
        public Builder path(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteActionRewrite#getPrefix}
         * @param prefix prefix block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}
         * @return {@code this}
         */
        public Builder prefix(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshGatewayRouteSpecHttp2RouteActionRewrite}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshGatewayRouteSpecHttp2RouteActionRewrite build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshGatewayRouteSpecHttp2RouteActionRewrite}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshGatewayRouteSpecHttp2RouteActionRewrite {
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname hostname;
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath path;
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix prefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hostname = software.amazon.jsii.Kernel.get(this, "hostname", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hostname = builder.hostname;
            this.path = builder.path;
            this.prefix = builder.prefix;
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname getHostname() {
            return this.hostname;
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePath getPath() {
            return this.path;
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix getPrefix() {
            return this.prefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHostname() != null) {
                data.set("hostname", om.valueToTree(this.getHostname()));
            }
            if (this.getPath() != null) {
                data.set("path", om.valueToTree(this.getPath()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewrite"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshGatewayRouteSpecHttp2RouteActionRewrite.Jsii$Proxy that = (AppmeshGatewayRouteSpecHttp2RouteActionRewrite.Jsii$Proxy) o;

            if (this.hostname != null ? !this.hostname.equals(that.hostname) : that.hostname != null) return false;
            if (this.path != null ? !this.path.equals(that.path) : that.path != null) return false;
            return this.prefix != null ? this.prefix.equals(that.prefix) : that.prefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hostname != null ? this.hostname.hashCode() : 0;
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            return result;
        }
    }
}
