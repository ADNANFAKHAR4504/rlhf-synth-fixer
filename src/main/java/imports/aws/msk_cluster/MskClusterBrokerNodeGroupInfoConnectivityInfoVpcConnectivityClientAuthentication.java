package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.909Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication")
@software.amazon.jsii.Jsii.Proxy(MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication.Jsii$Proxy.class)
public interface MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication extends software.amazon.jsii.JsiiSerializable {

    /**
     * sasl block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#sasl MskCluster#sasl}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl getSasl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#tls MskCluster#tls}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTls() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication> {
        imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl sasl;
        java.lang.Object tls;

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication#getSasl}
         * @param sasl sasl block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#sasl MskCluster#sasl}
         * @return {@code this}
         */
        public Builder sasl(imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl sasl) {
            this.sasl = sasl;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication#getTls}
         * @param tls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#tls MskCluster#tls}.
         * @return {@code this}
         */
        public Builder tls(java.lang.Boolean tls) {
            this.tls = tls;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication#getTls}
         * @param tls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#tls MskCluster#tls}.
         * @return {@code this}
         */
        public Builder tls(com.hashicorp.cdktf.IResolvable tls) {
            this.tls = tls;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication {
        private final imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl sasl;
        private final java.lang.Object tls;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sasl = software.amazon.jsii.Kernel.get(this, "sasl", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl.class));
            this.tls = software.amazon.jsii.Kernel.get(this, "tls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sasl = builder.sasl;
            this.tls = builder.tls;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl getSasl() {
            return this.sasl;
        }

        @Override
        public final java.lang.Object getTls() {
            return this.tls;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSasl() != null) {
                data.set("sasl", om.valueToTree(this.getSasl()));
            }
            if (this.getTls() != null) {
                data.set("tls", om.valueToTree(this.getTls()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication.Jsii$Proxy that = (MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthentication.Jsii$Proxy) o;

            if (this.sasl != null ? !this.sasl.equals(that.sasl) : that.sasl != null) return false;
            return this.tls != null ? this.tls.equals(that.tls) : that.tls == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sasl != null ? this.sasl.hashCode() : 0;
            result = 31 * result + (this.tls != null ? this.tls.hashCode() : 0);
            return result;
        }
    }
}
