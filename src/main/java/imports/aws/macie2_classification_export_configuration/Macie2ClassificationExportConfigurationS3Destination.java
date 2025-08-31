package imports.aws.macie2_classification_export_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.847Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationExportConfiguration.Macie2ClassificationExportConfigurationS3Destination")
@software.amazon.jsii.Jsii.Proxy(Macie2ClassificationExportConfigurationS3Destination.Jsii$Proxy.class)
public interface Macie2ClassificationExportConfigurationS3Destination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_export_configuration#bucket_name Macie2ClassificationExportConfiguration#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_export_configuration#kms_key_arn Macie2ClassificationExportConfiguration#kms_key_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_export_configuration#key_prefix Macie2ClassificationExportConfiguration#key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Macie2ClassificationExportConfigurationS3Destination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Macie2ClassificationExportConfigurationS3Destination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Macie2ClassificationExportConfigurationS3Destination> {
        java.lang.String bucketName;
        java.lang.String kmsKeyArn;
        java.lang.String keyPrefix;

        /**
         * Sets the value of {@link Macie2ClassificationExportConfigurationS3Destination#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_export_configuration#bucket_name Macie2ClassificationExportConfiguration#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationExportConfigurationS3Destination#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_export_configuration#kms_key_arn Macie2ClassificationExportConfiguration#kms_key_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationExportConfigurationS3Destination#getKeyPrefix}
         * @param keyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_export_configuration#key_prefix Macie2ClassificationExportConfiguration#key_prefix}.
         * @return {@code this}
         */
        public Builder keyPrefix(java.lang.String keyPrefix) {
            this.keyPrefix = keyPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Macie2ClassificationExportConfigurationS3Destination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Macie2ClassificationExportConfigurationS3Destination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Macie2ClassificationExportConfigurationS3Destination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Macie2ClassificationExportConfigurationS3Destination {
        private final java.lang.String bucketName;
        private final java.lang.String kmsKeyArn;
        private final java.lang.String keyPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyPrefix = software.amazon.jsii.Kernel.get(this, "keyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.kmsKeyArn = java.util.Objects.requireNonNull(builder.kmsKeyArn, "kmsKeyArn is required");
            this.keyPrefix = builder.keyPrefix;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final java.lang.String getKeyPrefix() {
            return this.keyPrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            if (this.getKeyPrefix() != null) {
                data.set("keyPrefix", om.valueToTree(this.getKeyPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.macie2ClassificationExportConfiguration.Macie2ClassificationExportConfigurationS3Destination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Macie2ClassificationExportConfigurationS3Destination.Jsii$Proxy that = (Macie2ClassificationExportConfigurationS3Destination.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            if (!kmsKeyArn.equals(that.kmsKeyArn)) return false;
            return this.keyPrefix != null ? this.keyPrefix.equals(that.keyPrefix) : that.keyPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.kmsKeyArn.hashCode());
            result = 31 * result + (this.keyPrefix != null ? this.keyPrefix.hashCode() : 0);
            return result;
        }
    }
}
