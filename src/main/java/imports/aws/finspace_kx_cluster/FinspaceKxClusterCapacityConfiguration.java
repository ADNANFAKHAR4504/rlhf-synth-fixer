package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.217Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterCapacityConfiguration")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxClusterCapacityConfiguration.Jsii$Proxy.class)
public interface FinspaceKxClusterCapacityConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_count FinspaceKxCluster#node_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getNodeCount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_type FinspaceKxCluster#node_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNodeType();

    /**
     * @return a {@link Builder} of {@link FinspaceKxClusterCapacityConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxClusterCapacityConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxClusterCapacityConfiguration> {
        java.lang.Number nodeCount;
        java.lang.String nodeType;

        /**
         * Sets the value of {@link FinspaceKxClusterCapacityConfiguration#getNodeCount}
         * @param nodeCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_count FinspaceKxCluster#node_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder nodeCount(java.lang.Number nodeCount) {
            this.nodeCount = nodeCount;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterCapacityConfiguration#getNodeType}
         * @param nodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_type FinspaceKxCluster#node_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder nodeType(java.lang.String nodeType) {
            this.nodeType = nodeType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxClusterCapacityConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxClusterCapacityConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxClusterCapacityConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxClusterCapacityConfiguration {
        private final java.lang.Number nodeCount;
        private final java.lang.String nodeType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.nodeCount = software.amazon.jsii.Kernel.get(this, "nodeCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.nodeType = software.amazon.jsii.Kernel.get(this, "nodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.nodeCount = java.util.Objects.requireNonNull(builder.nodeCount, "nodeCount is required");
            this.nodeType = java.util.Objects.requireNonNull(builder.nodeType, "nodeType is required");
        }

        @Override
        public final java.lang.Number getNodeCount() {
            return this.nodeCount;
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

            data.set("nodeCount", om.valueToTree(this.getNodeCount()));
            data.set("nodeType", om.valueToTree(this.getNodeType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxCluster.FinspaceKxClusterCapacityConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxClusterCapacityConfiguration.Jsii$Proxy that = (FinspaceKxClusterCapacityConfiguration.Jsii$Proxy) o;

            if (!nodeCount.equals(that.nodeCount)) return false;
            return this.nodeType.equals(that.nodeType);
        }

        @Override
        public final int hashCode() {
            int result = this.nodeCount.hashCode();
            result = 31 * result + (this.nodeType.hashCode());
            return result;
        }
    }
}
