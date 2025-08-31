package imports.aws.opensearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.989Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchDomain.OpensearchDomainClusterConfigNodeOptions")
@software.amazon.jsii.Jsii.Proxy(OpensearchDomainClusterConfigNodeOptions.Jsii$Proxy.class)
public interface OpensearchDomainClusterConfigNodeOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * node_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#node_config OpensearchDomain#node_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainClusterConfigNodeOptionsNodeConfig getNodeConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#node_type OpensearchDomain#node_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNodeType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpensearchDomainClusterConfigNodeOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpensearchDomainClusterConfigNodeOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpensearchDomainClusterConfigNodeOptions> {
        imports.aws.opensearch_domain.OpensearchDomainClusterConfigNodeOptionsNodeConfig nodeConfig;
        java.lang.String nodeType;

        /**
         * Sets the value of {@link OpensearchDomainClusterConfigNodeOptions#getNodeConfig}
         * @param nodeConfig node_config block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#node_config OpensearchDomain#node_config}
         * @return {@code this}
         */
        public Builder nodeConfig(imports.aws.opensearch_domain.OpensearchDomainClusterConfigNodeOptionsNodeConfig nodeConfig) {
            this.nodeConfig = nodeConfig;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainClusterConfigNodeOptions#getNodeType}
         * @param nodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#node_type OpensearchDomain#node_type}.
         * @return {@code this}
         */
        public Builder nodeType(java.lang.String nodeType) {
            this.nodeType = nodeType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpensearchDomainClusterConfigNodeOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpensearchDomainClusterConfigNodeOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpensearchDomainClusterConfigNodeOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpensearchDomainClusterConfigNodeOptions {
        private final imports.aws.opensearch_domain.OpensearchDomainClusterConfigNodeOptionsNodeConfig nodeConfig;
        private final java.lang.String nodeType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.nodeConfig = software.amazon.jsii.Kernel.get(this, "nodeConfig", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainClusterConfigNodeOptionsNodeConfig.class));
            this.nodeType = software.amazon.jsii.Kernel.get(this, "nodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.nodeConfig = builder.nodeConfig;
            this.nodeType = builder.nodeType;
        }

        @Override
        public final imports.aws.opensearch_domain.OpensearchDomainClusterConfigNodeOptionsNodeConfig getNodeConfig() {
            return this.nodeConfig;
        }

        @Override
        public final java.lang.String getNodeType() {
            return this.nodeType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNodeConfig() != null) {
                data.set("nodeConfig", om.valueToTree(this.getNodeConfig()));
            }
            if (this.getNodeType() != null) {
                data.set("nodeType", om.valueToTree(this.getNodeType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opensearchDomain.OpensearchDomainClusterConfigNodeOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpensearchDomainClusterConfigNodeOptions.Jsii$Proxy that = (OpensearchDomainClusterConfigNodeOptions.Jsii$Proxy) o;

            if (this.nodeConfig != null ? !this.nodeConfig.equals(that.nodeConfig) : that.nodeConfig != null) return false;
            return this.nodeType != null ? this.nodeType.equals(that.nodeType) : that.nodeType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.nodeConfig != null ? this.nodeConfig.hashCode() : 0;
            result = 31 * result + (this.nodeType != null ? this.nodeType.hashCode() : 0);
            return result;
        }
    }
}
