package imports.aws.cloudfront_field_level_encryption_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.238Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontFieldLevelEncryptionConfig.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig.Jsii$Proxy.class)
public interface CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * content_type_profiles block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#content_type_profiles CloudfrontFieldLevelEncryptionConfig#content_type_profiles}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfiles getContentTypeProfiles();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#forward_when_content_type_is_unknown CloudfrontFieldLevelEncryptionConfig#forward_when_content_type_is_unknown}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getForwardWhenContentTypeIsUnknown();

    /**
     * @return a {@link Builder} of {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig> {
        imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfiles contentTypeProfiles;
        java.lang.Object forwardWhenContentTypeIsUnknown;

        /**
         * Sets the value of {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig#getContentTypeProfiles}
         * @param contentTypeProfiles content_type_profiles block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#content_type_profiles CloudfrontFieldLevelEncryptionConfig#content_type_profiles}
         * @return {@code this}
         */
        public Builder contentTypeProfiles(imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfiles contentTypeProfiles) {
            this.contentTypeProfiles = contentTypeProfiles;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig#getForwardWhenContentTypeIsUnknown}
         * @param forwardWhenContentTypeIsUnknown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#forward_when_content_type_is_unknown CloudfrontFieldLevelEncryptionConfig#forward_when_content_type_is_unknown}. This parameter is required.
         * @return {@code this}
         */
        public Builder forwardWhenContentTypeIsUnknown(java.lang.Boolean forwardWhenContentTypeIsUnknown) {
            this.forwardWhenContentTypeIsUnknown = forwardWhenContentTypeIsUnknown;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig#getForwardWhenContentTypeIsUnknown}
         * @param forwardWhenContentTypeIsUnknown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#forward_when_content_type_is_unknown CloudfrontFieldLevelEncryptionConfig#forward_when_content_type_is_unknown}. This parameter is required.
         * @return {@code this}
         */
        public Builder forwardWhenContentTypeIsUnknown(com.hashicorp.cdktf.IResolvable forwardWhenContentTypeIsUnknown) {
            this.forwardWhenContentTypeIsUnknown = forwardWhenContentTypeIsUnknown;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig {
        private final imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfiles contentTypeProfiles;
        private final java.lang.Object forwardWhenContentTypeIsUnknown;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.contentTypeProfiles = software.amazon.jsii.Kernel.get(this, "contentTypeProfiles", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfiles.class));
            this.forwardWhenContentTypeIsUnknown = software.amazon.jsii.Kernel.get(this, "forwardWhenContentTypeIsUnknown", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.contentTypeProfiles = java.util.Objects.requireNonNull(builder.contentTypeProfiles, "contentTypeProfiles is required");
            this.forwardWhenContentTypeIsUnknown = java.util.Objects.requireNonNull(builder.forwardWhenContentTypeIsUnknown, "forwardWhenContentTypeIsUnknown is required");
        }

        @Override
        public final imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfiles getContentTypeProfiles() {
            return this.contentTypeProfiles;
        }

        @Override
        public final java.lang.Object getForwardWhenContentTypeIsUnknown() {
            return this.forwardWhenContentTypeIsUnknown;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("contentTypeProfiles", om.valueToTree(this.getContentTypeProfiles()));
            data.set("forwardWhenContentTypeIsUnknown", om.valueToTree(this.getForwardWhenContentTypeIsUnknown()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontFieldLevelEncryptionConfig.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig.Jsii$Proxy that = (CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfig.Jsii$Proxy) o;

            if (!contentTypeProfiles.equals(that.contentTypeProfiles)) return false;
            return this.forwardWhenContentTypeIsUnknown.equals(that.forwardWhenContentTypeIsUnknown);
        }

        @Override
        public final int hashCode() {
            int result = this.contentTypeProfiles.hashCode();
            result = 31 * result + (this.forwardWhenContentTypeIsUnknown.hashCode());
            return result;
        }
    }
}
