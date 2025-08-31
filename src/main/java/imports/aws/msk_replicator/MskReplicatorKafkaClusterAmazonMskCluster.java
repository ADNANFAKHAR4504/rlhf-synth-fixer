package imports.aws.msk_replicator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.912Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskReplicator.MskReplicatorKafkaClusterAmazonMskCluster")
@software.amazon.jsii.Jsii.Proxy(MskReplicatorKafkaClusterAmazonMskCluster.Jsii$Proxy.class)
public interface MskReplicatorKafkaClusterAmazonMskCluster extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#msk_cluster_arn MskReplicator#msk_cluster_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMskClusterArn();

    /**
     * @return a {@link Builder} of {@link MskReplicatorKafkaClusterAmazonMskCluster}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskReplicatorKafkaClusterAmazonMskCluster}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskReplicatorKafkaClusterAmazonMskCluster> {
        java.lang.String mskClusterArn;

        /**
         * Sets the value of {@link MskReplicatorKafkaClusterAmazonMskCluster#getMskClusterArn}
         * @param mskClusterArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#msk_cluster_arn MskReplicator#msk_cluster_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder mskClusterArn(java.lang.String mskClusterArn) {
            this.mskClusterArn = mskClusterArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskReplicatorKafkaClusterAmazonMskCluster}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskReplicatorKafkaClusterAmazonMskCluster build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskReplicatorKafkaClusterAmazonMskCluster}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskReplicatorKafkaClusterAmazonMskCluster {
        private final java.lang.String mskClusterArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mskClusterArn = software.amazon.jsii.Kernel.get(this, "mskClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mskClusterArn = java.util.Objects.requireNonNull(builder.mskClusterArn, "mskClusterArn is required");
        }

        @Override
        public final java.lang.String getMskClusterArn() {
            return this.mskClusterArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mskClusterArn", om.valueToTree(this.getMskClusterArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskReplicator.MskReplicatorKafkaClusterAmazonMskCluster"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskReplicatorKafkaClusterAmazonMskCluster.Jsii$Proxy that = (MskReplicatorKafkaClusterAmazonMskCluster.Jsii$Proxy) o;

            return this.mskClusterArn.equals(that.mskClusterArn);
        }

        @Override
        public final int hashCode() {
            int result = this.mskClusterArn.hashCode();
            return result;
        }
    }
}
