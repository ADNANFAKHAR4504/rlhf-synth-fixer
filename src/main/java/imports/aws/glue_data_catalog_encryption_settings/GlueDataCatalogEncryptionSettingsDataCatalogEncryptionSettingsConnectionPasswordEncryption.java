package imports.aws.glue_data_catalog_encryption_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueDataCatalogEncryptionSettings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption")
@software.amazon.jsii.Jsii.Proxy(GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption.Jsii$Proxy.class)
public interface GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_catalog_encryption_settings#return_connection_password_encrypted GlueDataCatalogEncryptionSettings#return_connection_password_encrypted}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getReturnConnectionPasswordEncrypted();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_catalog_encryption_settings#aws_kms_key_id GlueDataCatalogEncryptionSettings#aws_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAwsKmsKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption> {
        java.lang.Object returnConnectionPasswordEncrypted;
        java.lang.String awsKmsKeyId;

        /**
         * Sets the value of {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption#getReturnConnectionPasswordEncrypted}
         * @param returnConnectionPasswordEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_catalog_encryption_settings#return_connection_password_encrypted GlueDataCatalogEncryptionSettings#return_connection_password_encrypted}. This parameter is required.
         * @return {@code this}
         */
        public Builder returnConnectionPasswordEncrypted(java.lang.Boolean returnConnectionPasswordEncrypted) {
            this.returnConnectionPasswordEncrypted = returnConnectionPasswordEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption#getReturnConnectionPasswordEncrypted}
         * @param returnConnectionPasswordEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_catalog_encryption_settings#return_connection_password_encrypted GlueDataCatalogEncryptionSettings#return_connection_password_encrypted}. This parameter is required.
         * @return {@code this}
         */
        public Builder returnConnectionPasswordEncrypted(com.hashicorp.cdktf.IResolvable returnConnectionPasswordEncrypted) {
            this.returnConnectionPasswordEncrypted = returnConnectionPasswordEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption#getAwsKmsKeyId}
         * @param awsKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_catalog_encryption_settings#aws_kms_key_id GlueDataCatalogEncryptionSettings#aws_kms_key_id}.
         * @return {@code this}
         */
        public Builder awsKmsKeyId(java.lang.String awsKmsKeyId) {
            this.awsKmsKeyId = awsKmsKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption {
        private final java.lang.Object returnConnectionPasswordEncrypted;
        private final java.lang.String awsKmsKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.returnConnectionPasswordEncrypted = software.amazon.jsii.Kernel.get(this, "returnConnectionPasswordEncrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.awsKmsKeyId = software.amazon.jsii.Kernel.get(this, "awsKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.returnConnectionPasswordEncrypted = java.util.Objects.requireNonNull(builder.returnConnectionPasswordEncrypted, "returnConnectionPasswordEncrypted is required");
            this.awsKmsKeyId = builder.awsKmsKeyId;
        }

        @Override
        public final java.lang.Object getReturnConnectionPasswordEncrypted() {
            return this.returnConnectionPasswordEncrypted;
        }

        @Override
        public final java.lang.String getAwsKmsKeyId() {
            return this.awsKmsKeyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("returnConnectionPasswordEncrypted", om.valueToTree(this.getReturnConnectionPasswordEncrypted()));
            if (this.getAwsKmsKeyId() != null) {
                data.set("awsKmsKeyId", om.valueToTree(this.getAwsKmsKeyId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueDataCatalogEncryptionSettings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption.Jsii$Proxy that = (GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsConnectionPasswordEncryption.Jsii$Proxy) o;

            if (!returnConnectionPasswordEncrypted.equals(that.returnConnectionPasswordEncrypted)) return false;
            return this.awsKmsKeyId != null ? this.awsKmsKeyId.equals(that.awsKmsKeyId) : that.awsKmsKeyId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.returnConnectionPasswordEncrypted.hashCode();
            result = 31 * result + (this.awsKmsKeyId != null ? this.awsKmsKeyId.hashCode() : 0);
            return result;
        }
    }
}
