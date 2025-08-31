package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.035Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListener")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualGatewaySpecListener.Jsii$Proxy.class)
public interface AppmeshVirtualGatewaySpecListener extends software.amazon.jsii.JsiiSerializable {

    /**
     * port_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#port_mapping AppmeshVirtualGateway#port_mapping}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerPortMapping getPortMapping();

    /**
     * connection_pool block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#connection_pool AppmeshVirtualGateway#connection_pool}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPool getConnectionPool() {
        return null;
    }

    /**
     * health_check block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#health_check AppmeshVirtualGateway#health_check}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerHealthCheck getHealthCheck() {
        return null;
    }

    /**
     * tls block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#tls AppmeshVirtualGateway#tls}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTls getTls() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualGatewaySpecListener}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualGatewaySpecListener}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualGatewaySpecListener> {
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerPortMapping portMapping;
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPool connectionPool;
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerHealthCheck healthCheck;
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTls tls;

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListener#getPortMapping}
         * @param portMapping port_mapping block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#port_mapping AppmeshVirtualGateway#port_mapping}
         * @return {@code this}
         */
        public Builder portMapping(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerPortMapping portMapping) {
            this.portMapping = portMapping;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListener#getConnectionPool}
         * @param connectionPool connection_pool block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#connection_pool AppmeshVirtualGateway#connection_pool}
         * @return {@code this}
         */
        public Builder connectionPool(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPool connectionPool) {
            this.connectionPool = connectionPool;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListener#getHealthCheck}
         * @param healthCheck health_check block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#health_check AppmeshVirtualGateway#health_check}
         * @return {@code this}
         */
        public Builder healthCheck(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerHealthCheck healthCheck) {
            this.healthCheck = healthCheck;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListener#getTls}
         * @param tls tls block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#tls AppmeshVirtualGateway#tls}
         * @return {@code this}
         */
        public Builder tls(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTls tls) {
            this.tls = tls;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualGatewaySpecListener}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualGatewaySpecListener build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualGatewaySpecListener}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualGatewaySpecListener {
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerPortMapping portMapping;
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPool connectionPool;
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerHealthCheck healthCheck;
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTls tls;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.portMapping = software.amazon.jsii.Kernel.get(this, "portMapping", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerPortMapping.class));
            this.connectionPool = software.amazon.jsii.Kernel.get(this, "connectionPool", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPool.class));
            this.healthCheck = software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerHealthCheck.class));
            this.tls = software.amazon.jsii.Kernel.get(this, "tls", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTls.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.portMapping = java.util.Objects.requireNonNull(builder.portMapping, "portMapping is required");
            this.connectionPool = builder.connectionPool;
            this.healthCheck = builder.healthCheck;
            this.tls = builder.tls;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerPortMapping getPortMapping() {
            return this.portMapping;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerConnectionPool getConnectionPool() {
            return this.connectionPool;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerHealthCheck getHealthCheck() {
            return this.healthCheck;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTls getTls() {
            return this.tls;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("portMapping", om.valueToTree(this.getPortMapping()));
            if (this.getConnectionPool() != null) {
                data.set("connectionPool", om.valueToTree(this.getConnectionPool()));
            }
            if (this.getHealthCheck() != null) {
                data.set("healthCheck", om.valueToTree(this.getHealthCheck()));
            }
            if (this.getTls() != null) {
                data.set("tls", om.valueToTree(this.getTls()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListener"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualGatewaySpecListener.Jsii$Proxy that = (AppmeshVirtualGatewaySpecListener.Jsii$Proxy) o;

            if (!portMapping.equals(that.portMapping)) return false;
            if (this.connectionPool != null ? !this.connectionPool.equals(that.connectionPool) : that.connectionPool != null) return false;
            if (this.healthCheck != null ? !this.healthCheck.equals(that.healthCheck) : that.healthCheck != null) return false;
            return this.tls != null ? this.tls.equals(that.tls) : that.tls == null;
        }

        @Override
        public final int hashCode() {
            int result = this.portMapping.hashCode();
            result = 31 * result + (this.connectionPool != null ? this.connectionPool.hashCode() : 0);
            result = 31 * result + (this.healthCheck != null ? this.healthCheck.hashCode() : 0);
            result = 31 * result + (this.tls != null ? this.tls.hashCode() : 0);
            return result;
        }
    }
}
