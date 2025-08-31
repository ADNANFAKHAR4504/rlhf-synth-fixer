package imports.aws.timestreamwrite_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.556Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamwriteTable.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration")
@software.amazon.jsii.Jsii.Proxy(TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration.Jsii$Proxy.class)
public interface TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#bucket_name TimestreamwriteTable#bucket_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#encryption_option TimestreamwriteTable#encryption_option}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncryptionOption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#kms_key_id TimestreamwriteTable#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#object_key_prefix TimestreamwriteTable#object_key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObjectKeyPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration> {
        java.lang.String bucketName;
        java.lang.String encryptionOption;
        java.lang.String kmsKeyId;
        java.lang.String objectKeyPrefix;

        /**
         * Sets the value of {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#bucket_name TimestreamwriteTable#bucket_name}.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration#getEncryptionOption}
         * @param encryptionOption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#encryption_option TimestreamwriteTable#encryption_option}.
         * @return {@code this}
         */
        public Builder encryptionOption(java.lang.String encryptionOption) {
            this.encryptionOption = encryptionOption;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#kms_key_id TimestreamwriteTable#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration#getObjectKeyPrefix}
         * @param objectKeyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#object_key_prefix TimestreamwriteTable#object_key_prefix}.
         * @return {@code this}
         */
        public Builder objectKeyPrefix(java.lang.String objectKeyPrefix) {
            this.objectKeyPrefix = objectKeyPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration {
        private final java.lang.String bucketName;
        private final java.lang.String encryptionOption;
        private final java.lang.String kmsKeyId;
        private final java.lang.String objectKeyPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionOption = software.amazon.jsii.Kernel.get(this, "encryptionOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.objectKeyPrefix = software.amazon.jsii.Kernel.get(this, "objectKeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = builder.bucketName;
            this.encryptionOption = builder.encryptionOption;
            this.kmsKeyId = builder.kmsKeyId;
            this.objectKeyPrefix = builder.objectKeyPrefix;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getEncryptionOption() {
            return this.encryptionOption;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getObjectKeyPrefix() {
            return this.objectKeyPrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBucketName() != null) {
                data.set("bucketName", om.valueToTree(this.getBucketName()));
            }
            if (this.getEncryptionOption() != null) {
                data.set("encryptionOption", om.valueToTree(this.getEncryptionOption()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getObjectKeyPrefix() != null) {
                data.set("objectKeyPrefix", om.valueToTree(this.getObjectKeyPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamwriteTable.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration.Jsii$Proxy that = (TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration.Jsii$Proxy) o;

            if (this.bucketName != null ? !this.bucketName.equals(that.bucketName) : that.bucketName != null) return false;
            if (this.encryptionOption != null ? !this.encryptionOption.equals(that.encryptionOption) : that.encryptionOption != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            return this.objectKeyPrefix != null ? this.objectKeyPrefix.equals(that.objectKeyPrefix) : that.objectKeyPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName != null ? this.bucketName.hashCode() : 0;
            result = 31 * result + (this.encryptionOption != null ? this.encryptionOption.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.objectKeyPrefix != null ? this.objectKeyPrefix.hashCode() : 0);
            return result;
        }
    }
}
