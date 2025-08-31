package imports.aws.glue_data_catalog_encryption_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueDataCatalogEncryptionSettings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest")
@software.amazon.jsii.Jsii.Proxy(GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest.Jsii$Proxy.class)
public interface GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_catalog_encryption_settings#catalog_encryption_mode GlueDataCatalogEncryptionSettings#catalog_encryption_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCatalogEncryptionMode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_catalog_encryption_settings#catalog_encryption_service_role GlueDataCatalogEncryptionSettings#catalog_encryption_service_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalogEncryptionServiceRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_catalog_encryption_settings#sse_aws_kms_key_id GlueDataCatalogEncryptionSettings#sse_aws_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSseAwsKmsKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest> {
        java.lang.String catalogEncryptionMode;
        java.lang.String catalogEncryptionServiceRole;
        java.lang.String sseAwsKmsKeyId;

        /**
         * Sets the value of {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest#getCatalogEncryptionMode}
         * @param catalogEncryptionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_catalog_encryption_settings#catalog_encryption_mode GlueDataCatalogEncryptionSettings#catalog_encryption_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder catalogEncryptionMode(java.lang.String catalogEncryptionMode) {
            this.catalogEncryptionMode = catalogEncryptionMode;
            return this;
        }

        /**
         * Sets the value of {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest#getCatalogEncryptionServiceRole}
         * @param catalogEncryptionServiceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_catalog_encryption_settings#catalog_encryption_service_role GlueDataCatalogEncryptionSettings#catalog_encryption_service_role}.
         * @return {@code this}
         */
        public Builder catalogEncryptionServiceRole(java.lang.String catalogEncryptionServiceRole) {
            this.catalogEncryptionServiceRole = catalogEncryptionServiceRole;
            return this;
        }

        /**
         * Sets the value of {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest#getSseAwsKmsKeyId}
         * @param sseAwsKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_catalog_encryption_settings#sse_aws_kms_key_id GlueDataCatalogEncryptionSettings#sse_aws_kms_key_id}.
         * @return {@code this}
         */
        public Builder sseAwsKmsKeyId(java.lang.String sseAwsKmsKeyId) {
            this.sseAwsKmsKeyId = sseAwsKmsKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest {
        private final java.lang.String catalogEncryptionMode;
        private final java.lang.String catalogEncryptionServiceRole;
        private final java.lang.String sseAwsKmsKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.catalogEncryptionMode = software.amazon.jsii.Kernel.get(this, "catalogEncryptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogEncryptionServiceRole = software.amazon.jsii.Kernel.get(this, "catalogEncryptionServiceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sseAwsKmsKeyId = software.amazon.jsii.Kernel.get(this, "sseAwsKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.catalogEncryptionMode = java.util.Objects.requireNonNull(builder.catalogEncryptionMode, "catalogEncryptionMode is required");
            this.catalogEncryptionServiceRole = builder.catalogEncryptionServiceRole;
            this.sseAwsKmsKeyId = builder.sseAwsKmsKeyId;
        }

        @Override
        public final java.lang.String getCatalogEncryptionMode() {
            return this.catalogEncryptionMode;
        }

        @Override
        public final java.lang.String getCatalogEncryptionServiceRole() {
            return this.catalogEncryptionServiceRole;
        }

        @Override
        public final java.lang.String getSseAwsKmsKeyId() {
            return this.sseAwsKmsKeyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("catalogEncryptionMode", om.valueToTree(this.getCatalogEncryptionMode()));
            if (this.getCatalogEncryptionServiceRole() != null) {
                data.set("catalogEncryptionServiceRole", om.valueToTree(this.getCatalogEncryptionServiceRole()));
            }
            if (this.getSseAwsKmsKeyId() != null) {
                data.set("sseAwsKmsKeyId", om.valueToTree(this.getSseAwsKmsKeyId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueDataCatalogEncryptionSettings.GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest.Jsii$Proxy that = (GlueDataCatalogEncryptionSettingsDataCatalogEncryptionSettingsEncryptionAtRest.Jsii$Proxy) o;

            if (!catalogEncryptionMode.equals(that.catalogEncryptionMode)) return false;
            if (this.catalogEncryptionServiceRole != null ? !this.catalogEncryptionServiceRole.equals(that.catalogEncryptionServiceRole) : that.catalogEncryptionServiceRole != null) return false;
            return this.sseAwsKmsKeyId != null ? this.sseAwsKmsKeyId.equals(that.sseAwsKmsKeyId) : that.sseAwsKmsKeyId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.catalogEncryptionMode.hashCode();
            result = 31 * result + (this.catalogEncryptionServiceRole != null ? this.catalogEncryptionServiceRole.hashCode() : 0);
            result = 31 * result + (this.sseAwsKmsKeyId != null ? this.sseAwsKmsKeyId.hashCode() : 0);
            return result;
        }
    }
}
