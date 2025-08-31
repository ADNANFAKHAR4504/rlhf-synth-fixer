package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.036Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListenerConnectionPool")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualGatewaySpecListenerConnectionPool.Jsii$Proxy.class)
public interface AppmeshVirtualGatewaySpecListenerConnectionPool extends software.amazon.jsii.JsiiSerializable {

    /**
     * grpc block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#grpc AppmeshVirtualGateway#grpc}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolGrpc getGrpc() {
        return null;
    }

    /**
     * http block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#http AppmeshVirtualGateway#http}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp getHttp() {
        return null;
    }

    /**
     * http2 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#http2 AppmeshVirtualGateway#http2}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp2 getHttp2() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualGatewaySpecListenerConnectionPool}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualGatewaySpecListenerConnectionPool}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualGatewaySpecListenerConnectionPool> {
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolGrpc grpc;
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp http;
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp2 http2;

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListenerConnectionPool#getGrpc}
         * @param grpc grpc block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#grpc AppmeshVirtualGateway#grpc}
         * @return {@code this}
         */
        public Builder grpc(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolGrpc grpc) {
            this.grpc = grpc;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListenerConnectionPool#getHttp}
         * @param http http block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#http AppmeshVirtualGateway#http}
         * @return {@code this}
         */
        public Builder http(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp http) {
            this.http = http;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListenerConnectionPool#getHttp2}
         * @param http2 http2 block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#http2 AppmeshVirtualGateway#http2}
         * @return {@code this}
         */
        public Builder http2(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp2 http2) {
            this.http2 = http2;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualGatewaySpecListenerConnectionPool}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualGatewaySpecListenerConnectionPool build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualGatewaySpecListenerConnectionPool}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualGatewaySpecListenerConnectionPool {
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolGrpc grpc;
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp http;
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp2 http2;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.grpc = software.amazon.jsii.Kernel.get(this, "grpc", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolGrpc.class));
            this.http = software.amazon.jsii.Kernel.get(this, "http", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp.class));
            this.http2 = software.amazon.jsii.Kernel.get(this, "http2", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp2.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.grpc = builder.grpc;
            this.http = builder.http;
            this.http2 = builder.http2;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolGrpc getGrpc() {
            return this.grpc;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp getHttp() {
            return this.http;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPoolHttp2 getHttp2() {
            return this.http2;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGrpc() != null) {
                data.set("grpc", om.valueToTree(this.getGrpc()));
            }
            if (this.getHttp() != null) {
                data.set("http", om.valueToTree(this.getHttp()));
            }
            if (this.getHttp2() != null) {
                data.set("http2", om.valueToTree(this.getHttp2()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListenerConnectionPool"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualGatewaySpecListenerConnectionPool.Jsii$Proxy that = (AppmeshVirtualGatewaySpecListenerConnectionPool.Jsii$Proxy) o;

            if (this.grpc != null ? !this.grpc.equals(that.grpc) : that.grpc != null) return false;
            if (this.http != null ? !this.http.equals(that.http) : that.http != null) return false;
            return this.http2 != null ? this.http2.equals(that.http2) : that.http2 == null;
        }

        @Override
        public final int hashCode() {
            int result = this.grpc != null ? this.grpc.hashCode() : 0;
            result = 31 * result + (this.http != null ? this.http.hashCode() : 0);
            result = 31 * result + (this.http2 != null ? this.http2.hashCode() : 0);
            return result;
        }
    }
}
