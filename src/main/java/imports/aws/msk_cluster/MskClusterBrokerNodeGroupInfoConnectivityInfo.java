package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.909Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterBrokerNodeGroupInfoConnectivityInfo")
@software.amazon.jsii.Jsii.Proxy(MskClusterBrokerNodeGroupInfoConnectivityInfo.Jsii$Proxy.class)
public interface MskClusterBrokerNodeGroupInfoConnectivityInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * public_access block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#public_access MskCluster#public_access}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess getPublicAccess() {
        return null;
    }

    /**
     * vpc_connectivity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#vpc_connectivity MskCluster#vpc_connectivity}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity getVpcConnectivity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskClusterBrokerNodeGroupInfoConnectivityInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterBrokerNodeGroupInfoConnectivityInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterBrokerNodeGroupInfoConnectivityInfo> {
        imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess publicAccess;
        imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity vpcConnectivity;

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoConnectivityInfo#getPublicAccess}
         * @param publicAccess public_access block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#public_access MskCluster#public_access}
         * @return {@code this}
         */
        public Builder publicAccess(imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess publicAccess) {
            this.publicAccess = publicAccess;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoConnectivityInfo#getVpcConnectivity}
         * @param vpcConnectivity vpc_connectivity block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#vpc_connectivity MskCluster#vpc_connectivity}
         * @return {@code this}
         */
        public Builder vpcConnectivity(imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity vpcConnectivity) {
            this.vpcConnectivity = vpcConnectivity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskClusterBrokerNodeGroupInfoConnectivityInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterBrokerNodeGroupInfoConnectivityInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterBrokerNodeGroupInfoConnectivityInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterBrokerNodeGroupInfoConnectivityInfo {
        private final imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess publicAccess;
        private final imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity vpcConnectivity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.publicAccess = software.amazon.jsii.Kernel.get(this, "publicAccess", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess.class));
            this.vpcConnectivity = software.amazon.jsii.Kernel.get(this, "vpcConnectivity", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.publicAccess = builder.publicAccess;
            this.vpcConnectivity = builder.vpcConnectivity;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess getPublicAccess() {
            return this.publicAccess;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoConnectivityInfoVpcConnectivity getVpcConnectivity() {
            return this.vpcConnectivity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPublicAccess() != null) {
                data.set("publicAccess", om.valueToTree(this.getPublicAccess()));
            }
            if (this.getVpcConnectivity() != null) {
                data.set("vpcConnectivity", om.valueToTree(this.getVpcConnectivity()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterBrokerNodeGroupInfoConnectivityInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterBrokerNodeGroupInfoConnectivityInfo.Jsii$Proxy that = (MskClusterBrokerNodeGroupInfoConnectivityInfo.Jsii$Proxy) o;

            if (this.publicAccess != null ? !this.publicAccess.equals(that.publicAccess) : that.publicAccess != null) return false;
            return this.vpcConnectivity != null ? this.vpcConnectivity.equals(that.vpcConnectivity) : that.vpcConnectivity == null;
        }

        @Override
        public final int hashCode() {
            int result = this.publicAccess != null ? this.publicAccess.hashCode() : 0;
            result = 31 * result + (this.vpcConnectivity != null ? this.vpcConnectivity.hashCode() : 0);
            return result;
        }
    }
}
