package imports.aws.appmesh_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.032Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshRoute.AppmeshRouteSpecHttpRouteMatch")
@software.amazon.jsii.Jsii.Proxy(AppmeshRouteSpecHttpRouteMatch.Jsii$Proxy.class)
public interface AppmeshRouteSpecHttpRouteMatch extends software.amazon.jsii.JsiiSerializable {

    /**
     * header block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#header AppmeshRoute#header}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHeader() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#method AppmeshRoute#method}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMethod() {
        return null;
    }

    /**
     * path block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#path AppmeshRoute#path}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchPath getPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#port AppmeshRoute#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#prefix AppmeshRoute#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * query_parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#query_parameter AppmeshRoute#query_parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getQueryParameter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#scheme AppmeshRoute#scheme}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScheme() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshRouteSpecHttpRouteMatch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshRouteSpecHttpRouteMatch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshRouteSpecHttpRouteMatch> {
        java.lang.Object header;
        java.lang.String method;
        imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchPath path;
        java.lang.Number port;
        java.lang.String prefix;
        java.lang.Object queryParameter;
        java.lang.String scheme;

        /**
         * Sets the value of {@link AppmeshRouteSpecHttpRouteMatch#getHeader}
         * @param header header block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#header AppmeshRoute#header}
         * @return {@code this}
         */
        public Builder header(com.hashicorp.cdktf.IResolvable header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecHttpRouteMatch#getHeader}
         * @param header header block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#header AppmeshRoute#header}
         * @return {@code this}
         */
        public Builder header(java.util.List<? extends imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchHeader> header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecHttpRouteMatch#getMethod}
         * @param method Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#method AppmeshRoute#method}.
         * @return {@code this}
         */
        public Builder method(java.lang.String method) {
            this.method = method;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecHttpRouteMatch#getPath}
         * @param path path block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#path AppmeshRoute#path}
         * @return {@code this}
         */
        public Builder path(imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchPath path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecHttpRouteMatch#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#port AppmeshRoute#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecHttpRouteMatch#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#prefix AppmeshRoute#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecHttpRouteMatch#getQueryParameter}
         * @param queryParameter query_parameter block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#query_parameter AppmeshRoute#query_parameter}
         * @return {@code this}
         */
        public Builder queryParameter(com.hashicorp.cdktf.IResolvable queryParameter) {
            this.queryParameter = queryParameter;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecHttpRouteMatch#getQueryParameter}
         * @param queryParameter query_parameter block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#query_parameter AppmeshRoute#query_parameter}
         * @return {@code this}
         */
        public Builder queryParameter(java.util.List<? extends imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchQueryParameter> queryParameter) {
            this.queryParameter = queryParameter;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecHttpRouteMatch#getScheme}
         * @param scheme Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#scheme AppmeshRoute#scheme}.
         * @return {@code this}
         */
        public Builder scheme(java.lang.String scheme) {
            this.scheme = scheme;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshRouteSpecHttpRouteMatch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshRouteSpecHttpRouteMatch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshRouteSpecHttpRouteMatch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshRouteSpecHttpRouteMatch {
        private final java.lang.Object header;
        private final java.lang.String method;
        private final imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchPath path;
        private final java.lang.Number port;
        private final java.lang.String prefix;
        private final java.lang.Object queryParameter;
        private final java.lang.String scheme;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.header = software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.method = software.amazon.jsii.Kernel.get(this, "method", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchPath.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.queryParameter = software.amazon.jsii.Kernel.get(this, "queryParameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scheme = software.amazon.jsii.Kernel.get(this, "scheme", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.header = builder.header;
            this.method = builder.method;
            this.path = builder.path;
            this.port = builder.port;
            this.prefix = builder.prefix;
            this.queryParameter = builder.queryParameter;
            this.scheme = builder.scheme;
        }

        @Override
        public final java.lang.Object getHeader() {
            return this.header;
        }

        @Override
        public final java.lang.String getMethod() {
            return this.method;
        }

        @Override
        public final imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteMatchPath getPath() {
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
        public final java.lang.String getScheme() {
            return this.scheme;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHeader() != null) {
                data.set("header", om.valueToTree(this.getHeader()));
            }
            if (this.getMethod() != null) {
                data.set("method", om.valueToTree(this.getMethod()));
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
            if (this.getScheme() != null) {
                data.set("scheme", om.valueToTree(this.getScheme()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshRoute.AppmeshRouteSpecHttpRouteMatch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshRouteSpecHttpRouteMatch.Jsii$Proxy that = (AppmeshRouteSpecHttpRouteMatch.Jsii$Proxy) o;

            if (this.header != null ? !this.header.equals(that.header) : that.header != null) return false;
            if (this.method != null ? !this.method.equals(that.method) : that.method != null) return false;
            if (this.path != null ? !this.path.equals(that.path) : that.path != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.prefix != null ? !this.prefix.equals(that.prefix) : that.prefix != null) return false;
            if (this.queryParameter != null ? !this.queryParameter.equals(that.queryParameter) : that.queryParameter != null) return false;
            return this.scheme != null ? this.scheme.equals(that.scheme) : that.scheme == null;
        }

        @Override
        public final int hashCode() {
            int result = this.header != null ? this.header.hashCode() : 0;
            result = 31 * result + (this.method != null ? this.method.hashCode() : 0);
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            result = 31 * result + (this.queryParameter != null ? this.queryParameter.hashCode() : 0);
            result = 31 * result + (this.scheme != null ? this.scheme.hashCode() : 0);
            return result;
        }
    }
}
