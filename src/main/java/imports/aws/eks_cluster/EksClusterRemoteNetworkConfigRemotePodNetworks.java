package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.158Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterRemoteNetworkConfigRemotePodNetworks")
@software.amazon.jsii.Jsii.Proxy(EksClusterRemoteNetworkConfigRemotePodNetworks.Jsii$Proxy.class)
public interface EksClusterRemoteNetworkConfigRemotePodNetworks extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#cidrs EksCluster#cidrs}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCidrs() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksClusterRemoteNetworkConfigRemotePodNetworks}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksClusterRemoteNetworkConfigRemotePodNetworks}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksClusterRemoteNetworkConfigRemotePodNetworks> {
        java.util.List<java.lang.String> cidrs;

        /**
         * Sets the value of {@link EksClusterRemoteNetworkConfigRemotePodNetworks#getCidrs}
         * @param cidrs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#cidrs EksCluster#cidrs}.
         * @return {@code this}
         */
        public Builder cidrs(java.util.List<java.lang.String> cidrs) {
            this.cidrs = cidrs;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksClusterRemoteNetworkConfigRemotePodNetworks}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksClusterRemoteNetworkConfigRemotePodNetworks build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksClusterRemoteNetworkConfigRemotePodNetworks}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksClusterRemoteNetworkConfigRemotePodNetworks {
        private final java.util.List<java.lang.String> cidrs;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cidrs = software.amazon.jsii.Kernel.get(this, "cidrs", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cidrs = builder.cidrs;
        }

        @Override
        public final java.util.List<java.lang.String> getCidrs() {
            return this.cidrs;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCidrs() != null) {
                data.set("cidrs", om.valueToTree(this.getCidrs()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksCluster.EksClusterRemoteNetworkConfigRemotePodNetworks"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksClusterRemoteNetworkConfigRemotePodNetworks.Jsii$Proxy that = (EksClusterRemoteNetworkConfigRemotePodNetworks.Jsii$Proxy) o;

            return this.cidrs != null ? this.cidrs.equals(that.cidrs) : that.cidrs == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cidrs != null ? this.cidrs.hashCode() : 0;
            return result;
        }
    }
}
