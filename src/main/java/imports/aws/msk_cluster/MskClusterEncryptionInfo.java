package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.910Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterEncryptionInfo")
@software.amazon.jsii.Jsii.Proxy(MskClusterEncryptionInfo.Jsii$Proxy.class)
public interface MskClusterEncryptionInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#encryption_at_rest_kms_key_arn MskCluster#encryption_at_rest_kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncryptionAtRestKmsKeyArn() {
        return null;
    }

    /**
     * encryption_in_transit block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#encryption_in_transit MskCluster#encryption_in_transit}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterEncryptionInfoEncryptionInTransit getEncryptionInTransit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskClusterEncryptionInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterEncryptionInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterEncryptionInfo> {
        java.lang.String encryptionAtRestKmsKeyArn;
        imports.aws.msk_cluster.MskClusterEncryptionInfoEncryptionInTransit encryptionInTransit;

        /**
         * Sets the value of {@link MskClusterEncryptionInfo#getEncryptionAtRestKmsKeyArn}
         * @param encryptionAtRestKmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#encryption_at_rest_kms_key_arn MskCluster#encryption_at_rest_kms_key_arn}.
         * @return {@code this}
         */
        public Builder encryptionAtRestKmsKeyArn(java.lang.String encryptionAtRestKmsKeyArn) {
            this.encryptionAtRestKmsKeyArn = encryptionAtRestKmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterEncryptionInfo#getEncryptionInTransit}
         * @param encryptionInTransit encryption_in_transit block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#encryption_in_transit MskCluster#encryption_in_transit}
         * @return {@code this}
         */
        public Builder encryptionInTransit(imports.aws.msk_cluster.MskClusterEncryptionInfoEncryptionInTransit encryptionInTransit) {
            this.encryptionInTransit = encryptionInTransit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskClusterEncryptionInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterEncryptionInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterEncryptionInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterEncryptionInfo {
        private final java.lang.String encryptionAtRestKmsKeyArn;
        private final imports.aws.msk_cluster.MskClusterEncryptionInfoEncryptionInTransit encryptionInTransit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.encryptionAtRestKmsKeyArn = software.amazon.jsii.Kernel.get(this, "encryptionAtRestKmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionInTransit = software.amazon.jsii.Kernel.get(this, "encryptionInTransit", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterEncryptionInfoEncryptionInTransit.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.encryptionAtRestKmsKeyArn = builder.encryptionAtRestKmsKeyArn;
            this.encryptionInTransit = builder.encryptionInTransit;
        }

        @Override
        public final java.lang.String getEncryptionAtRestKmsKeyArn() {
            return this.encryptionAtRestKmsKeyArn;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterEncryptionInfoEncryptionInTransit getEncryptionInTransit() {
            return this.encryptionInTransit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEncryptionAtRestKmsKeyArn() != null) {
                data.set("encryptionAtRestKmsKeyArn", om.valueToTree(this.getEncryptionAtRestKmsKeyArn()));
            }
            if (this.getEncryptionInTransit() != null) {
                data.set("encryptionInTransit", om.valueToTree(this.getEncryptionInTransit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterEncryptionInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterEncryptionInfo.Jsii$Proxy that = (MskClusterEncryptionInfo.Jsii$Proxy) o;

            if (this.encryptionAtRestKmsKeyArn != null ? !this.encryptionAtRestKmsKeyArn.equals(that.encryptionAtRestKmsKeyArn) : that.encryptionAtRestKmsKeyArn != null) return false;
            return this.encryptionInTransit != null ? this.encryptionInTransit.equals(that.encryptionInTransit) : that.encryptionInTransit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.encryptionAtRestKmsKeyArn != null ? this.encryptionAtRestKmsKeyArn.hashCode() : 0;
            result = 31 * result + (this.encryptionInTransit != null ? this.encryptionInTransit.hashCode() : 0);
            return result;
        }
    }
}
