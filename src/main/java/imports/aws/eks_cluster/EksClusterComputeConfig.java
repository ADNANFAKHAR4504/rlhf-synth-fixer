package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.153Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterComputeConfig")
@software.amazon.jsii.Jsii.Proxy(EksClusterComputeConfig.Jsii$Proxy.class)
public interface EksClusterComputeConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#node_pools EksCluster#node_pools}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNodePools() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#node_role_arn EksCluster#node_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNodeRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksClusterComputeConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksClusterComputeConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksClusterComputeConfig> {
        java.lang.Object enabled;
        java.util.List<java.lang.String> nodePools;
        java.lang.String nodeRoleArn;

        /**
         * Sets the value of {@link EksClusterComputeConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterComputeConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterComputeConfig#getNodePools}
         * @param nodePools Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#node_pools EksCluster#node_pools}.
         * @return {@code this}
         */
        public Builder nodePools(java.util.List<java.lang.String> nodePools) {
            this.nodePools = nodePools;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterComputeConfig#getNodeRoleArn}
         * @param nodeRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#node_role_arn EksCluster#node_role_arn}.
         * @return {@code this}
         */
        public Builder nodeRoleArn(java.lang.String nodeRoleArn) {
            this.nodeRoleArn = nodeRoleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksClusterComputeConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksClusterComputeConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksClusterComputeConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksClusterComputeConfig {
        private final java.lang.Object enabled;
        private final java.util.List<java.lang.String> nodePools;
        private final java.lang.String nodeRoleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.nodePools = software.amazon.jsii.Kernel.get(this, "nodePools", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.nodeRoleArn = software.amazon.jsii.Kernel.get(this, "nodeRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = builder.enabled;
            this.nodePools = builder.nodePools;
            this.nodeRoleArn = builder.nodeRoleArn;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.util.List<java.lang.String> getNodePools() {
            return this.nodePools;
        }

        @Override
        public final java.lang.String getNodeRoleArn() {
            return this.nodeRoleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getNodePools() != null) {
                data.set("nodePools", om.valueToTree(this.getNodePools()));
            }
            if (this.getNodeRoleArn() != null) {
                data.set("nodeRoleArn", om.valueToTree(this.getNodeRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksCluster.EksClusterComputeConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksClusterComputeConfig.Jsii$Proxy that = (EksClusterComputeConfig.Jsii$Proxy) o;

            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.nodePools != null ? !this.nodePools.equals(that.nodePools) : that.nodePools != null) return false;
            return this.nodeRoleArn != null ? this.nodeRoleArn.equals(that.nodeRoleArn) : that.nodeRoleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled != null ? this.enabled.hashCode() : 0;
            result = 31 * result + (this.nodePools != null ? this.nodePools.hashCode() : 0);
            result = 31 * result + (this.nodeRoleArn != null ? this.nodeRoleArn.hashCode() : 0);
            return result;
        }
    }
}
