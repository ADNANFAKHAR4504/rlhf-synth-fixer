package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.909Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity")
@software.amazon.jsii.Jsii.Proxy(MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity.Jsii$Proxy.class)
public interface MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity extends software.amazon.jsii.JsiiSerializable {

    /**
     * client_authentication block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#client_authentication MskCluster#client_authentication}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication getClientAuthentication() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity> {
        imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication clientAuthentication;

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity#getClientAuthentication}
         * @param clientAuthentication client_authentication block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#client_authentication MskCluster#client_authentication}
         * @return {@code this}
         */
        public Builder clientAuthentication(imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication clientAuthentication) {
            this.clientAuthentication = clientAuthentication;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity {
        private final imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication clientAuthentication;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clientAuthentication = software.amazon.jsii.Kernel.get(this, "clientAuthentication", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clientAuthentication = builder.clientAuthentication;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication getClientAuthentication() {
            return this.clientAuthentication;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getClientAuthentication() != null) {
                data.set("clientAuthentication", om.valueToTree(this.getClientAuthentication()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity.Jsii$Proxy that = (MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity.Jsii$Proxy) o;

            return this.clientAuthentication != null ? this.clientAuthentication.equals(that.clientAuthentication) : that.clientAuthentication == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clientAuthentication != null ? this.clientAuthentication.hashCode() : 0;
            return result;
        }
    }
}
