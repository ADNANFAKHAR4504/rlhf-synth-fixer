package imports.aws.appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.022Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2Route")
@software.amazon.jsii.Jsii.Proxy(AppmeshGatewayRouteSpecHttp2Route.Jsii$Proxy.class)
public interface AppmeshGatewayRouteSpecHttp2Route extends software.amazon.jsii.JsiiSerializable {

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#action AppmeshGatewayRoute#action}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteAction getAction();

    /**
     * match block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatch getMatch();

    /**
     * @return a {@link Builder} of {@link AppmeshGatewayRouteSpecHttp2Route}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshGatewayRouteSpecHttp2Route}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshGatewayRouteSpecHttp2Route> {
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteAction action;
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatch match;

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2Route#getAction}
         * @param action action block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#action AppmeshGatewayRoute#action}
         * @return {@code this}
         */
        public Builder action(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteAction action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2Route#getMatch}
         * @param match match block. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
         * @return {@code this}
         */
        public Builder match(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatch match) {
            this.match = match;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshGatewayRouteSpecHttp2Route}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshGatewayRouteSpecHttp2Route build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshGatewayRouteSpecHttp2Route}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshGatewayRouteSpecHttp2Route {
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteAction action;
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatch match;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteAction.class));
            this.match = software.amazon.jsii.Kernel.get(this, "match", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatch.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.match = java.util.Objects.requireNonNull(builder.match, "match is required");
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteAction getAction() {
            return this.action;
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatch getMatch() {
            return this.match;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("action", om.valueToTree(this.getAction()));
            data.set("match", om.valueToTree(this.getMatch()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2Route"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshGatewayRouteSpecHttp2Route.Jsii$Proxy that = (AppmeshGatewayRouteSpecHttp2Route.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            return this.match.equals(that.match);
        }

        @Override
        public final int hashCode() {
            int result = this.action.hashCode();
            result = 31 * result + (this.match.hashCode());
            return result;
        }
    }
}
