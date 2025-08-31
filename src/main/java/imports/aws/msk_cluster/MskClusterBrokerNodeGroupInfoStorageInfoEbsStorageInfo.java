package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.909Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo")
@software.amazon.jsii.Jsii.Proxy(MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo.Jsii$Proxy.class)
public interface MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * provisioned_throughput block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#provisioned_throughput MskCluster#provisioned_throughput}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfoProvisionedThroughput getProvisionedThroughput() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#volume_size MskCluster#volume_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getVolumeSize() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo> {
        imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfoProvisionedThroughput provisionedThroughput;
        java.lang.Number volumeSize;

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo#getProvisionedThroughput}
         * @param provisionedThroughput provisioned_throughput block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#provisioned_throughput MskCluster#provisioned_throughput}
         * @return {@code this}
         */
        public Builder provisionedThroughput(imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfoProvisionedThroughput provisionedThroughput) {
            this.provisionedThroughput = provisionedThroughput;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo#getVolumeSize}
         * @param volumeSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#volume_size MskCluster#volume_size}.
         * @return {@code this}
         */
        public Builder volumeSize(java.lang.Number volumeSize) {
            this.volumeSize = volumeSize;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo {
        private final imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfoProvisionedThroughput provisionedThroughput;
        private final java.lang.Number volumeSize;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.provisionedThroughput = software.amazon.jsii.Kernel.get(this, "provisionedThroughput", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfoProvisionedThroughput.class));
            this.volumeSize = software.amazon.jsii.Kernel.get(this, "volumeSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.provisionedThroughput = builder.provisionedThroughput;
            this.volumeSize = builder.volumeSize;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfoProvisionedThroughput getProvisionedThroughput() {
            return this.provisionedThroughput;
        }

        @Override
        public final java.lang.Number getVolumeSize() {
            return this.volumeSize;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getProvisionedThroughput() != null) {
                data.set("provisionedThroughput", om.valueToTree(this.getProvisionedThroughput()));
            }
            if (this.getVolumeSize() != null) {
                data.set("volumeSize", om.valueToTree(this.getVolumeSize()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo.Jsii$Proxy that = (MskClusterBrokerNodeGroupInfoStorageInfoEbsStorageInfo.Jsii$Proxy) o;

            if (this.provisionedThroughput != null ? !this.provisionedThroughput.equals(that.provisionedThroughput) : that.provisionedThroughput != null) return false;
            return this.volumeSize != null ? this.volumeSize.equals(that.volumeSize) : that.volumeSize == null;
        }

        @Override
        public final int hashCode() {
            int result = this.provisionedThroughput != null ? this.provisionedThroughput.hashCode() : 0;
            result = 31 * result + (this.volumeSize != null ? this.volumeSize.hashCode() : 0);
            return result;
        }
    }
}
