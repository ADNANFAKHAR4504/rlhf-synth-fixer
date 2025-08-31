package imports.aws.appmesh_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.027Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshRoute.AppmeshRouteSpecGrpcRouteMatch")
@software.amazon.jsii.Jsii.Proxy(AppmeshRouteSpecGrpcRouteMatch.Jsii$Proxy.class)
public interface AppmeshRouteSpecGrpcRouteMatch extends software.amazon.jsii.JsiiSerializable {

    /**
     * metadata block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#metadata AppmeshRoute#metadata}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMetadata() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#method_name AppmeshRoute#method_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMethodName() {
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
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#service_name AppmeshRoute#service_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshRouteSpecGrpcRouteMatch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshRouteSpecGrpcRouteMatch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshRouteSpecGrpcRouteMatch> {
        java.lang.Object metadata;
        java.lang.String methodName;
        java.lang.Number port;
        java.lang.String prefix;
        java.lang.String serviceName;

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteMatch#getMetadata}
         * @param metadata metadata block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#metadata AppmeshRoute#metadata}
         * @return {@code this}
         */
        public Builder metadata(com.hashicorp.cdktf.IResolvable metadata) {
            this.metadata = metadata;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteMatch#getMetadata}
         * @param metadata metadata block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#metadata AppmeshRoute#metadata}
         * @return {@code this}
         */
        public Builder metadata(java.util.List<? extends imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteMatchMetadata> metadata) {
            this.metadata = metadata;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteMatch#getMethodName}
         * @param methodName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#method_name AppmeshRoute#method_name}.
         * @return {@code this}
         */
        public Builder methodName(java.lang.String methodName) {
            this.methodName = methodName;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteMatch#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#port AppmeshRoute#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteMatch#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#prefix AppmeshRoute#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteMatch#getServiceName}
         * @param serviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#service_name AppmeshRoute#service_name}.
         * @return {@code this}
         */
        public Builder serviceName(java.lang.String serviceName) {
            this.serviceName = serviceName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshRouteSpecGrpcRouteMatch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshRouteSpecGrpcRouteMatch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshRouteSpecGrpcRouteMatch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshRouteSpecGrpcRouteMatch {
        private final java.lang.Object metadata;
        private final java.lang.String methodName;
        private final java.lang.Number port;
        private final java.lang.String prefix;
        private final java.lang.String serviceName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metadata = software.amazon.jsii.Kernel.get(this, "metadata", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.methodName = software.amazon.jsii.Kernel.get(this, "methodName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceName = software.amazon.jsii.Kernel.get(this, "serviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metadata = builder.metadata;
            this.methodName = builder.methodName;
            this.port = builder.port;
            this.prefix = builder.prefix;
            this.serviceName = builder.serviceName;
        }

        @Override
        public final java.lang.Object getMetadata() {
            return this.metadata;
        }

        @Override
        public final java.lang.String getMethodName() {
            return this.methodName;
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
        public final java.lang.String getServiceName() {
            return this.serviceName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMetadata() != null) {
                data.set("metadata", om.valueToTree(this.getMetadata()));
            }
            if (this.getMethodName() != null) {
                data.set("methodName", om.valueToTree(this.getMethodName()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }
            if (this.getServiceName() != null) {
                data.set("serviceName", om.valueToTree(this.getServiceName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshRoute.AppmeshRouteSpecGrpcRouteMatch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshRouteSpecGrpcRouteMatch.Jsii$Proxy that = (AppmeshRouteSpecGrpcRouteMatch.Jsii$Proxy) o;

            if (this.metadata != null ? !this.metadata.equals(that.metadata) : that.metadata != null) return false;
            if (this.methodName != null ? !this.methodName.equals(that.methodName) : that.methodName != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.prefix != null ? !this.prefix.equals(that.prefix) : that.prefix != null) return false;
            return this.serviceName != null ? this.serviceName.equals(that.serviceName) : that.serviceName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.metadata != null ? this.metadata.hashCode() : 0;
            result = 31 * result + (this.methodName != null ? this.methodName.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            result = 31 * result + (this.serviceName != null ? this.serviceName.hashCode() : 0);
            return result;
        }
    }
}
