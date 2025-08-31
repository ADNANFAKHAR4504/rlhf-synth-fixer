package imports.aws.appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.022Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatch")
@software.amazon.jsii.Jsii.Proxy(AppmeshGatewayRouteSpecHttp2RouteMatch.Jsii$Proxy.class)
public interface AppmeshGatewayRouteSpecHttp2RouteMatch extends software.amazon.jsii.JsiiSerializable {

    /**
     * header block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#header AppmeshGatewayRoute#header}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHeader() {
        return null;
    }

    /**
     * hostname block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHostname getHostname() {
        return null;
    }

    /**
     * path block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchPath getPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * query_parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#query_parameter AppmeshGatewayRoute#query_parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getQueryParameter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshGatewayRouteSpecHttp2RouteMatch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshGatewayRouteSpecHttp2RouteMatch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshGatewayRouteSpecHttp2RouteMatch> {
        java.lang.Object header;
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHostname hostname;
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchPath path;
        java.lang.Number port;
        java.lang.String prefix;
        java.lang.Object queryParameter;

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatch#getHeader}
         * @param header header block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#header AppmeshGatewayRoute#header}
         * @return {@code this}
         */
        public Builder header(com.hashicorp.cdktf.IResolvable header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatch#getHeader}
         * @param header header block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#header AppmeshGatewayRoute#header}
         * @return {@code this}
         */
        public Builder header(java.util.List<? extends imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHeader> header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatch#getHostname}
         * @param hostname hostname block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#hostname AppmeshGatewayRoute#hostname}
         * @return {@code this}
         */
        public Builder hostname(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHostname hostname) {
            this.hostname = hostname;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatch#getPath}
         * @param path path block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#path AppmeshGatewayRoute#path}
         * @return {@code this}
         */
        public Builder path(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchPath path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatch#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#port AppmeshGatewayRoute#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatch#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#prefix AppmeshGatewayRoute#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatch#getQueryParameter}
         * @param queryParameter query_parameter block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#query_parameter AppmeshGatewayRoute#query_parameter}
         * @return {@code this}
         */
        public Builder queryParameter(com.hashicorp.cdktf.IResolvable queryParameter) {
            this.queryParameter = queryParameter;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatch#getQueryParameter}
         * @param queryParameter query_parameter block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#query_parameter AppmeshGatewayRoute#query_parameter}
         * @return {@code this}
         */
        public Builder queryParameter(java.util.List<? extends imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchQueryParameter> queryParameter) {
            this.queryParameter = queryParameter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshGatewayRouteSpecHttp2RouteMatch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshGatewayRouteSpecHttp2RouteMatch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshGatewayRouteSpecHttp2RouteMatch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshGatewayRouteSpecHttp2RouteMatch {
        private final java.lang.Object header;
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHostname hostname;
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchPath path;
        private final java.lang.Number port;
        private final java.lang.String prefix;
        private final java.lang.Object queryParameter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.header = software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hostname = software.amazon.jsii.Kernel.get(this, "hostname", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHostname.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchPath.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.queryParameter = software.amazon.jsii.Kernel.get(this, "queryParameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.header = builder.header;
            this.hostname = builder.hostname;
            this.path = builder.path;
            this.port = builder.port;
            this.prefix = builder.prefix;
            this.queryParameter = builder.queryParameter;
        }

        @Override
        public final java.lang.Object getHeader() {
            return this.header;
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchHostname getHostname() {
            return this.hostname;
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2RouteMatchPath getPath() {
            return this.path;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        public final java.lang.Object getQueryParameter() {
            return this.queryParameter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHeader() != null) {
                data.set("header", om.valueToTree(this.getHeader()));
            }
            if (this.getHostname() != null) {
                data.set("hostname", om.valueToTree(this.getHostname()));
            }
            if (this.getPath() != null) {
                data.set("path", om.valueToTree(this.getPath()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }
            if (this.getQueryParameter() != null) {
                data.set("queryParameter", om.valueToTree(this.getQueryParameter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshGatewayRouteSpecHttp2RouteMatch.Jsii$Proxy that = (AppmeshGatewayRouteSpecHttp2RouteMatch.Jsii$Proxy) o;

            if (this.header != null ? !this.header.equals(that.header) : that.header != null) return false;
            if (this.hostname != null ? !this.hostname.equals(that.hostname) : that.hostname != null) return false;
            if (this.path != null ? !this.path.equals(that.path) : that.path != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.prefix != null ? !this.prefix.equals(that.prefix) : that.prefix != null) return false;
            return this.queryParameter != null ? this.queryParameter.equals(that.queryParameter) : that.queryParameter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.header != null ? this.header.hashCode() : 0;
            result = 31 * result + (this.hostname != null ? this.hostname.hashCode() : 0);
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            result = 31 * result + (this.queryParameter != null ? this.queryParameter.hashCode() : 0);
            return result;
        }
    }
}
