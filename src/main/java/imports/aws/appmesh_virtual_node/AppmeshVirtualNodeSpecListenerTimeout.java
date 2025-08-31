package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.044Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerTimeout")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecListenerTimeout.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecListenerTimeout extends software.amazon.jsii.JsiiSerializable {

    /**
     * grpc block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#grpc AppmeshVirtualNode#grpc}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpc getGrpc() {
        return null;
    }

    /**
     * http block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#http AppmeshVirtualNode#http}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp getHttp() {
        return null;
    }

    /**
     * http2 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#http2 AppmeshVirtualNode#http2}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2 getHttp2() {
        return null;
    }

    /**
     * tcp block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#tcp AppmeshVirtualNode#tcp}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutTcp getTcp() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecListenerTimeout}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecListenerTimeout}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecListenerTimeout> {
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpc grpc;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp http;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2 http2;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutTcp tcp;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerTimeout#getGrpc}
         * @param grpc grpc block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#grpc AppmeshVirtualNode#grpc}
         * @return {@code this}
         */
        public Builder grpc(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpc grpc) {
            this.grpc = grpc;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerTimeout#getHttp}
         * @param http http block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#http AppmeshVirtualNode#http}
         * @return {@code this}
         */
        public Builder http(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp http) {
            this.http = http;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerTimeout#getHttp2}
         * @param http2 http2 block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#http2 AppmeshVirtualNode#http2}
         * @return {@code this}
         */
        public Builder http2(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2 http2) {
            this.http2 = http2;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerTimeout#getTcp}
         * @param tcp tcp block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#tcp AppmeshVirtualNode#tcp}
         * @return {@code this}
         */
        public Builder tcp(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutTcp tcp) {
            this.tcp = tcp;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecListenerTimeout}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecListenerTimeout build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecListenerTimeout}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecListenerTimeout {
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpc grpc;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp http;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2 http2;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutTcp tcp;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.grpc = software.amazon.jsii.Kernel.get(this, "grpc", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpc.class));
            this.http = software.amazon.jsii.Kernel.get(this, "http", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp.class));
            this.http2 = software.amazon.jsii.Kernel.get(this, "http2", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2.class));
            this.tcp = software.amazon.jsii.Kernel.get(this, "tcp", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutTcp.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.grpc = builder.grpc;
            this.http = builder.http;
            this.http2 = builder.http2;
            this.tcp = builder.tcp;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutGrpc getGrpc() {
            return this.grpc;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp getHttp() {
            return this.http;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutHttp2 getHttp2() {
            return this.http2;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeoutTcp getTcp() {
            return this.tcp;
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
            if (this.getTcp() != null) {
                data.set("tcp", om.valueToTree(this.getTcp()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerTimeout"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecListenerTimeout.Jsii$Proxy that = (AppmeshVirtualNodeSpecListenerTimeout.Jsii$Proxy) o;

            if (this.grpc != null ? !this.grpc.equals(that.grpc) : that.grpc != null) return false;
            if (this.http != null ? !this.http.equals(that.http) : that.http != null) return false;
            if (this.http2 != null ? !this.http2.equals(that.http2) : that.http2 != null) return false;
            return this.tcp != null ? this.tcp.equals(that.tcp) : that.tcp == null;
        }

        @Override
        public final int hashCode() {
            int result = this.grpc != null ? this.grpc.hashCode() : 0;
            result = 31 * result + (this.http != null ? this.http.hashCode() : 0);
            result = 31 * result + (this.http2 != null ? this.http2.hashCode() : 0);
            result = 31 * result + (this.tcp != null ? this.tcp.hashCode() : 0);
            return result;
        }
    }
}
