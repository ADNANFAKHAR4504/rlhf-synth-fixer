package imports.aws.appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.022Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHeader")
@software.amazon.jsii.Jsii.Proxy(AppmeshGatewayRouteSpecHttp2RouteMatchHeader.Jsii$Proxy.class)
public interface AppmeshGatewayRouteSpecHttp2RouteMatchHeader extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#invert AppmeshGatewayRoute#invert}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInvert() {
        return null;
    }

    /**
     * match block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch getMatch() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshGatewayRouteSpecHttp2RouteMatchHeader}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshGatewayRouteSpecHttp2RouteMatchHeader}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshGatewayRouteSpecHttp2RouteMatchHeader> {
        java.lang.String name;
        java.lang.Object invert;
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch match;

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatchHeader#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#name AppmeshGatewayRoute#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatchHeader#getInvert}
         * @param invert Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#invert AppmeshGatewayRoute#invert}.
         * @return {@code this}
         */
        public Builder invert(java.lang.Boolean invert) {
            this.invert = invert;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatchHeader#getInvert}
         * @param invert Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#invert AppmeshGatewayRoute#invert}.
         * @return {@code this}
         */
        public Builder invert(com.hashicorp.cdktf.IResolvable invert) {
            this.invert = invert;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatchHeader#getMatch}
         * @param match match block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#match AppmeshGatewayRoute#match}
         * @return {@code this}
         */
        public Builder match(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch match) {
            this.match = match;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshGatewayRouteSpecHttp2RouteMatchHeader}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshGatewayRouteSpecHttp2RouteMatchHeader build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshGatewayRouteSpecHttp2RouteMatchHeader}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshGatewayRouteSpecHttp2RouteMatchHeader {
        private final java.lang.String name;
        private final java.lang.Object invert;
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch match;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.invert = software.amazon.jsii.Kernel.get(this, "invert", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.match = software.amazon.jsii.Kernel.get(this, "match", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.invert = builder.invert;
            this.match = builder.match;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getInvert() {
            return this.invert;
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHeaderMatch getMatch() {
            return this.match;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getInvert() != null) {
                data.set("invert", om.valueToTree(this.getInvert()));
            }
            if (this.getMatch() != null) {
                data.set("match", om.valueToTree(this.getMatch()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHeader"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshGatewayRouteSpecHttp2RouteMatchHeader.Jsii$Proxy that = (AppmeshGatewayRouteSpecHttp2RouteMatchHeader.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.invert != null ? !this.invert.equals(that.invert) : that.invert != null) return false;
            return this.match != null ? this.match.equals(that.match) : that.match == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.invert != null ? this.invert.hashCode() : 0);
            result = 31 * result + (this.match != null ? this.match.hashCode() : 0);
            return result;
        }
    }
}
