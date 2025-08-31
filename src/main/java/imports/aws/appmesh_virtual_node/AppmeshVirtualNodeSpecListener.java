package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.043Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListener")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecListener.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecListener extends software.amazon.jsii.JsiiSerializable {

    /**
     * port_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#port_mapping AppmeshVirtualNode#port_mapping}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerPortMapping getPortMapping();

    /**
     * connection_pool block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#connection_pool AppmeshVirtualNode#connection_pool}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerConnectionPool getConnectionPool() {
        return null;
    }

    /**
     * health_check block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#health_check AppmeshVirtualNode#health_check}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerHealthCheck getHealthCheck() {
        return null;
    }

    /**
     * outlier_detection block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#outlier_detection AppmeshVirtualNode#outlier_detection}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetection getOutlierDetection() {
        return null;
    }

    /**
     * timeout block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#timeout AppmeshVirtualNode#timeout}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeout getTimeout() {
        return null;
    }

    /**
     * tls block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#tls AppmeshVirtualNode#tls}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTls getTls() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecListener}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecListener}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecListener> {
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerPortMapping portMapping;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerConnectionPool connectionPool;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerHealthCheck healthCheck;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetection outlierDetection;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeout timeout;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTls tls;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListener#getPortMapping}
         * @param portMapping port_mapping block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#port_mapping AppmeshVirtualNode#port_mapping}
         * @return {@code this}
         */
        public Builder portMapping(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerPortMapping portMapping) {
            this.portMapping = portMapping;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListener#getConnectionPool}
         * @param connectionPool connection_pool block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#connection_pool AppmeshVirtualNode#connection_pool}
         * @return {@code this}
         */
        public Builder connectionPool(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerConnectionPool connectionPool) {
            this.connectionPool = connectionPool;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListener#getHealthCheck}
         * @param healthCheck health_check block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#health_check AppmeshVirtualNode#health_check}
         * @return {@code this}
         */
        public Builder healthCheck(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerHealthCheck healthCheck) {
            this.healthCheck = healthCheck;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListener#getOutlierDetection}
         * @param outlierDetection outlier_detection block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#outlier_detection AppmeshVirtualNode#outlier_detection}
         * @return {@code this}
         */
        public Builder outlierDetection(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetection outlierDetection) {
            this.outlierDetection = outlierDetection;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListener#getTimeout}
         * @param timeout timeout block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#timeout AppmeshVirtualNode#timeout}
         * @return {@code this}
         */
        public Builder timeout(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeout timeout) {
            this.timeout = timeout;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListener#getTls}
         * @param tls tls block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#tls AppmeshVirtualNode#tls}
         * @return {@code this}
         */
        public Builder tls(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTls tls) {
            this.tls = tls;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecListener}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecListener build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecListener}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecListener {
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerPortMapping portMapping;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerConnectionPool connectionPool;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerHealthCheck healthCheck;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetection outlierDetection;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeout timeout;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTls tls;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.portMapping = software.amazon.jsii.Kernel.get(this, "portMapping", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerPortMapping.class));
            this.connectionPool = software.amazon.jsii.Kernel.get(this, "connectionPool", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerConnectionPool.class));
            this.healthCheck = software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerHealthCheck.class));
            this.outlierDetection = software.amazon.jsii.Kernel.get(this, "outlierDetection", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetection.class));
            this.timeout = software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeout.class));
            this.tls = software.amazon.jsii.Kernel.get(this, "tls", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTls.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.portMapping = java.util.Objects.requireNonNull(builder.portMapping, "portMapping is required");
            this.connectionPool = builder.connectionPool;
            this.healthCheck = builder.healthCheck;
            this.outlierDetection = builder.outlierDetection;
            this.timeout = builder.timeout;
            this.tls = builder.tls;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerPortMapping getPortMapping() {
            return this.portMapping;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerConnectionPool getConnectionPool() {
            return this.connectionPool;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerHealthCheck getHealthCheck() {
            return this.healthCheck;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetection getOutlierDetection() {
            return this.outlierDetection;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTimeout getTimeout() {
            return this.timeout;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTls getTls() {
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
            if (this.getOutlierDetection() != null) {
                data.set("outlierDetection", om.valueToTree(this.getOutlierDetection()));
            }
            if (this.getTimeout() != null) {
                data.set("timeout", om.valueToTree(this.getTimeout()));
            }
            if (this.getTls() != null) {
                data.set("tls", om.valueToTree(this.getTls()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListener"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecListener.Jsii$Proxy that = (AppmeshVirtualNodeSpecListener.Jsii$Proxy) o;

            if (!portMapping.equals(that.portMapping)) return false;
            if (this.connectionPool != null ? !this.connectionPool.equals(that.connectionPool) : that.connectionPool != null) return false;
            if (this.healthCheck != null ? !this.healthCheck.equals(that.healthCheck) : that.healthCheck != null) return false;
            if (this.outlierDetection != null ? !this.outlierDetection.equals(that.outlierDetection) : that.outlierDetection != null) return false;
            if (this.timeout != null ? !this.timeout.equals(that.timeout) : that.timeout != null) return false;
            return this.tls != null ? this.tls.equals(that.tls) : that.tls == null;
        }

        @Override
        public final int hashCode() {
            int result = this.portMapping.hashCode();
            result = 31 * result + (this.connectionPool != null ? this.connectionPool.hashCode() : 0);
            result = 31 * result + (this.healthCheck != null ? this.healthCheck.hashCode() : 0);
            result = 31 * result + (this.outlierDetection != null ? this.outlierDetection.hashCode() : 0);
            result = 31 * result + (this.timeout != null ? this.timeout.hashCode() : 0);
            result = 31 * result + (this.tls != null ? this.tls.hashCode() : 0);
            return result;
        }
    }
}
