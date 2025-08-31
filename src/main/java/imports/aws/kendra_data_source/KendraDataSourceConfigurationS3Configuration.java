package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.427Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationS3Configuration")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceConfigurationS3Configuration.Jsii$Proxy.class)
public interface KendraDataSourceConfigurationS3Configuration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#bucket_name KendraDataSource#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * access_control_list_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#access_control_list_configuration KendraDataSource#access_control_list_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration getAccessControlListConfiguration() {
        return null;
    }

    /**
     * documents_metadata_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#documents_metadata_configuration KendraDataSource#documents_metadata_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration getDocumentsMetadataConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#exclusion_patterns KendraDataSource#exclusion_patterns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExclusionPatterns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#inclusion_patterns KendraDataSource#inclusion_patterns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInclusionPatterns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#inclusion_prefixes KendraDataSource#inclusion_prefixes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInclusionPrefixes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceConfigurationS3Configuration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceConfigurationS3Configuration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceConfigurationS3Configuration> {
        java.lang.String bucketName;
        imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration accessControlListConfiguration;
        imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration documentsMetadataConfiguration;
        java.util.List<java.lang.String> exclusionPatterns;
        java.util.List<java.lang.String> inclusionPatterns;
        java.util.List<java.lang.String> inclusionPrefixes;

        /**
         * Sets the value of {@link KendraDataSourceConfigurationS3Configuration#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#bucket_name KendraDataSource#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationS3Configuration#getAccessControlListConfiguration}
         * @param accessControlListConfiguration access_control_list_configuration block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#access_control_list_configuration KendraDataSource#access_control_list_configuration}
         * @return {@code this}
         */
        public Builder accessControlListConfiguration(imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration accessControlListConfiguration) {
            this.accessControlListConfiguration = accessControlListConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationS3Configuration#getDocumentsMetadataConfiguration}
         * @param documentsMetadataConfiguration documents_metadata_configuration block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#documents_metadata_configuration KendraDataSource#documents_metadata_configuration}
         * @return {@code this}
         */
        public Builder documentsMetadataConfiguration(imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration documentsMetadataConfiguration) {
            this.documentsMetadataConfiguration = documentsMetadataConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationS3Configuration#getExclusionPatterns}
         * @param exclusionPatterns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#exclusion_patterns KendraDataSource#exclusion_patterns}.
         * @return {@code this}
         */
        public Builder exclusionPatterns(java.util.List<java.lang.String> exclusionPatterns) {
            this.exclusionPatterns = exclusionPatterns;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationS3Configuration#getInclusionPatterns}
         * @param inclusionPatterns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#inclusion_patterns KendraDataSource#inclusion_patterns}.
         * @return {@code this}
         */
        public Builder inclusionPatterns(java.util.List<java.lang.String> inclusionPatterns) {
            this.inclusionPatterns = inclusionPatterns;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationS3Configuration#getInclusionPrefixes}
         * @param inclusionPrefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#inclusion_prefixes KendraDataSource#inclusion_prefixes}.
         * @return {@code this}
         */
        public Builder inclusionPrefixes(java.util.List<java.lang.String> inclusionPrefixes) {
            this.inclusionPrefixes = inclusionPrefixes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceConfigurationS3Configuration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceConfigurationS3Configuration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceConfigurationS3Configuration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceConfigurationS3Configuration {
        private final java.lang.String bucketName;
        private final imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration accessControlListConfiguration;
        private final imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration documentsMetadataConfiguration;
        private final java.util.List<java.lang.String> exclusionPatterns;
        private final java.util.List<java.lang.String> inclusionPatterns;
        private final java.util.List<java.lang.String> inclusionPrefixes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessControlListConfiguration = software.amazon.jsii.Kernel.get(this, "accessControlListConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration.class));
            this.documentsMetadataConfiguration = software.amazon.jsii.Kernel.get(this, "documentsMetadataConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration.class));
            this.exclusionPatterns = software.amazon.jsii.Kernel.get(this, "exclusionPatterns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.inclusionPatterns = software.amazon.jsii.Kernel.get(this, "inclusionPatterns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.inclusionPrefixes = software.amazon.jsii.Kernel.get(this, "inclusionPrefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.accessControlListConfiguration = builder.accessControlListConfiguration;
            this.documentsMetadataConfiguration = builder.documentsMetadataConfiguration;
            this.exclusionPatterns = builder.exclusionPatterns;
            this.inclusionPatterns = builder.inclusionPatterns;
            this.inclusionPrefixes = builder.inclusionPrefixes;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration getAccessControlListConfiguration() {
            return this.accessControlListConfiguration;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration getDocumentsMetadataConfiguration() {
            return this.documentsMetadataConfiguration;
        }

        @Override
        public final java.util.List<java.lang.String> getExclusionPatterns() {
            return this.exclusionPatterns;
        }

        @Override
        public final java.util.List<java.lang.String> getInclusionPatterns() {
            return this.inclusionPatterns;
        }

        @Override
        public final java.util.List<java.lang.String> getInclusionPrefixes() {
            return this.inclusionPrefixes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            if (this.getAccessControlListConfiguration() != null) {
                data.set("accessControlListConfiguration", om.valueToTree(this.getAccessControlListConfiguration()));
            }
            if (this.getDocumentsMetadataConfiguration() != null) {
                data.set("documentsMetadataConfiguration", om.valueToTree(this.getDocumentsMetadataConfiguration()));
            }
            if (this.getExclusionPatterns() != null) {
                data.set("exclusionPatterns", om.valueToTree(this.getExclusionPatterns()));
            }
            if (this.getInclusionPatterns() != null) {
                data.set("inclusionPatterns", om.valueToTree(this.getInclusionPatterns()));
            }
            if (this.getInclusionPrefixes() != null) {
                data.set("inclusionPrefixes", om.valueToTree(this.getInclusionPrefixes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceConfigurationS3Configuration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceConfigurationS3Configuration.Jsii$Proxy that = (KendraDataSourceConfigurationS3Configuration.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            if (this.accessControlListConfiguration != null ? !this.accessControlListConfiguration.equals(that.accessControlListConfiguration) : that.accessControlListConfiguration != null) return false;
            if (this.documentsMetadataConfiguration != null ? !this.documentsMetadataConfiguration.equals(that.documentsMetadataConfiguration) : that.documentsMetadataConfiguration != null) return false;
            if (this.exclusionPatterns != null ? !this.exclusionPatterns.equals(that.exclusionPatterns) : that.exclusionPatterns != null) return false;
            if (this.inclusionPatterns != null ? !this.inclusionPatterns.equals(that.inclusionPatterns) : that.inclusionPatterns != null) return false;
            return this.inclusionPrefixes != null ? this.inclusionPrefixes.equals(that.inclusionPrefixes) : that.inclusionPrefixes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.accessControlListConfiguration != null ? this.accessControlListConfiguration.hashCode() : 0);
            result = 31 * result + (this.documentsMetadataConfiguration != null ? this.documentsMetadataConfiguration.hashCode() : 0);
            result = 31 * result + (this.exclusionPatterns != null ? this.exclusionPatterns.hashCode() : 0);
            result = 31 * result + (this.inclusionPatterns != null ? this.inclusionPatterns.hashCode() : 0);
            result = 31 * result + (this.inclusionPrefixes != null ? this.inclusionPrefixes.hashCode() : 0);
            return result;
        }
    }
}
