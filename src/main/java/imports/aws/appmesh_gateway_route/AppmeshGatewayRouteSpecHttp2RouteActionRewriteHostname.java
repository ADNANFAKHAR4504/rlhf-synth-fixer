package imports.aws.appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.022Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname")
@software.amazon.jsii.Jsii.Proxy(AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname.Jsii$Proxy.class)
public interface AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_target_hostname AppmeshGatewayRoute#default_target_hostname}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDefaultTargetHostname();

    /**
     * @return a {@link Builder} of {@link AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname> {
        java.lang.String defaultTargetHostname;

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname#getDefaultTargetHostname}
         * @param defaultTargetHostname Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_target_hostname AppmeshGatewayRoute#default_target_hostname}. This parameter is required.
         * @return {@code this}
         */
        public Builder defaultTargetHostname(java.lang.String defaultTargetHostname) {
            this.defaultTargetHostname = defaultTargetHostname;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname {
        private final java.lang.String defaultTargetHostname;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultTargetHostname = software.amazon.jsii.Kernel.get(this, "defaultTargetHostname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultTargetHostname = java.util.Objects.requireNonNull(builder.defaultTargetHostname, "defaultTargetHostname is required");
        }

        @Override
        public final java.lang.String getDefaultTargetHostname() {
            return this.defaultTargetHostname;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("defaultTargetHostname", om.valueToTree(this.getDefaultTargetHostname()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname.Jsii$Proxy that = (AppmeshGatewayRouteSpecHttp2RouteActionRewriteHostname.Jsii$Proxy) o;

            return this.defaultTargetHostname.equals(that.defaultTargetHostname);
        }

        @Override
        public final int hashCode() {
            int result = this.defaultTargetHostname.hashCode();
            return result;
        }
    }
}
