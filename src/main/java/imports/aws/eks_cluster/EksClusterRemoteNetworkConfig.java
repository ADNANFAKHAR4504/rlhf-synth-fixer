package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.158Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterRemoteNetworkConfig")
@software.amazon.jsii.Jsii.Proxy(EksClusterRemoteNetworkConfig.Jsii$Proxy.class)
public interface EksClusterRemoteNetworkConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * remote_node_networks block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_node_networks EksCluster#remote_node_networks}
     */
    @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks getRemoteNodeNetworks();

    /**
     * remote_pod_networks block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_pod_networks EksCluster#remote_pod_networks}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemotePodNetworks getRemotePodNetworks() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksClusterRemoteNetworkConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksClusterRemoteNetworkConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksClusterRemoteNetworkConfig> {
        imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks remoteNodeNetworks;
        imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemotePodNetworks remotePodNetworks;

        /**
         * Sets the value of {@link EksClusterRemoteNetworkConfig#getRemoteNodeNetworks}
         * @param remoteNodeNetworks remote_node_networks block. This parameter is required.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_node_networks EksCluster#remote_node_networks}
         * @return {@code this}
         */
        public Builder remoteNodeNetworks(imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks remoteNodeNetworks) {
            this.remoteNodeNetworks = remoteNodeNetworks;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterRemoteNetworkConfig#getRemotePodNetworks}
         * @param remotePodNetworks remote_pod_networks block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_pod_networks EksCluster#remote_pod_networks}
         * @return {@code this}
         */
        public Builder remotePodNetworks(imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemotePodNetworks remotePodNetworks) {
            this.remotePodNetworks = remotePodNetworks;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksClusterRemoteNetworkConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksClusterRemoteNetworkConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksClusterRemoteNetworkConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksClusterRemoteNetworkConfig {
        private final imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks remoteNodeNetworks;
        private final imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemotePodNetworks remotePodNetworks;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.remoteNodeNetworks = software.amazon.jsii.Kernel.get(this, "remoteNodeNetworks", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks.class));
            this.remotePodNetworks = software.amazon.jsii.Kernel.get(this, "remotePodNetworks", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemotePodNetworks.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.remoteNodeNetworks = java.util.Objects.requireNonNull(builder.remoteNodeNetworks, "remoteNodeNetworks is required");
            this.remotePodNetworks = builder.remotePodNetworks;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks getRemoteNodeNetworks() {
            return this.remoteNodeNetworks;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterRemoteNetworkConfigRemotePodNetworks getRemotePodNetworks() {
            return this.remotePodNetworks;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("remoteNodeNetworks", om.valueToTree(this.getRemoteNodeNetworks()));
            if (this.getRemotePodNetworks() != null) {
                data.set("remotePodNetworks", om.valueToTree(this.getRemotePodNetworks()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksCluster.EksClusterRemoteNetworkConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksClusterRemoteNetworkConfig.Jsii$Proxy that = (EksClusterRemoteNetworkConfig.Jsii$Proxy) o;

            if (!remoteNodeNetworks.equals(that.remoteNodeNetworks)) return false;
            return this.remotePodNetworks != null ? this.remotePodNetworks.equals(that.remotePodNetworks) : that.remotePodNetworks == null;
        }

        @Override
        public final int hashCode() {
            int result = this.remoteNodeNetworks.hashCode();
            result = 31 * result + (this.remotePodNetworks != null ? this.remotePodNetworks.hashCode() : 0);
            return result;
        }
    }
}
