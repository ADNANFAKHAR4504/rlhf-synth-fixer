package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.909Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl")
@software.amazon.jsii.Jsii.Proxy(MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl.Jsii$Proxy.class)
public interface MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#iam MskCluster#iam}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIam() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#scram MskCluster#scram}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getScram() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl> {
        java.lang.Object iam;
        java.lang.Object scram;

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl#getIam}
         * @param iam Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#iam MskCluster#iam}.
         * @return {@code this}
         */
        public Builder iam(java.lang.Boolean iam) {
            this.iam = iam;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl#getIam}
         * @param iam Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#iam MskCluster#iam}.
         * @return {@code this}
         */
        public Builder iam(com.hashicorp.cdktf.IResolvable iam) {
            this.iam = iam;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl#getScram}
         * @param scram Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#scram MskCluster#scram}.
         * @return {@code this}
         */
        public Builder scram(java.lang.Boolean scram) {
            this.scram = scram;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl#getScram}
         * @param scram Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#scram MskCluster#scram}.
         * @return {@code this}
         */
        public Builder scram(com.hashicorp.cdktf.IResolvable scram) {
            this.scram = scram;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl {
        private final java.lang.Object iam;
        private final java.lang.Object scram;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.iam = software.amazon.jsii.Kernel.get(this, "iam", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scram = software.amazon.jsii.Kernel.get(this, "scram", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.iam = builder.iam;
            this.scram = builder.scram;
        }

        @Override
        public final java.lang.Object getIam() {
            return this.iam;
        }

        @Override
        public final java.lang.Object getScram() {
            return this.scram;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIam() != null) {
                data.set("iam", om.valueToTree(this.getIam()));
            }
            if (this.getScram() != null) {
                data.set("scram", om.valueToTree(this.getScram()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl.Jsii$Proxy that = (MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivityClientAuthenticationSasl.Jsii$Proxy) o;

            if (this.iam != null ? !this.iam.equals(that.iam) : that.iam != null) return false;
            return this.scram != null ? this.scram.equals(that.scram) : that.scram == null;
        }

        @Override
        public final int hashCode() {
            int result = this.iam != null ? this.iam.hashCode() : 0;
            result = 31 * result + (this.scram != null ? this.scram.hashCode() : 0);
            return result;
        }
    }
}
