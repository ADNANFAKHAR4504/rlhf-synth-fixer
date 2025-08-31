package imports.aws.cloudfront_field_level_encryption_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.238Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontFieldLevelEncryptionConfig.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems")
@software.amazon.jsii.Jsii.Proxy(CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems.Jsii$Proxy.class)
public interface CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#content_type CloudfrontFieldLevelEncryptionConfig#content_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContentType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#format CloudfrontFieldLevelEncryptionConfig#format}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFormat();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#profile_id CloudfrontFieldLevelEncryptionConfig#profile_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProfileId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems> {
        java.lang.String contentType;
        java.lang.String format;
        java.lang.String profileId;

        /**
         * Sets the value of {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems#getContentType}
         * @param contentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#content_type CloudfrontFieldLevelEncryptionConfig#content_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder contentType(java.lang.String contentType) {
            this.contentType = contentType;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems#getFormat}
         * @param format Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#format CloudfrontFieldLevelEncryptionConfig#format}. This parameter is required.
         * @return {@code this}
         */
        public Builder format(java.lang.String format) {
            this.format = format;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems#getProfileId}
         * @param profileId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#profile_id CloudfrontFieldLevelEncryptionConfig#profile_id}.
         * @return {@code this}
         */
        public Builder profileId(java.lang.String profileId) {
            this.profileId = profileId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems {
        private final java.lang.String contentType;
        private final java.lang.String format;
        private final java.lang.String profileId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.contentType = software.amazon.jsii.Kernel.get(this, "contentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.format = software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.profileId = software.amazon.jsii.Kernel.get(this, "profileId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.contentType = java.util.Objects.requireNonNull(builder.contentType, "contentType is required");
            this.format = java.util.Objects.requireNonNull(builder.format, "format is required");
            this.profileId = builder.profileId;
        }

        @Override
        public final java.lang.String getContentType() {
            return this.contentType;
        }

        @Override
        public final java.lang.String getFormat() {
            return this.format;
        }

        @Override
        public final java.lang.String getProfileId() {
            return this.profileId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("contentType", om.valueToTree(this.getContentType()));
            data.set("format", om.valueToTree(this.getFormat()));
            if (this.getProfileId() != null) {
                data.set("profileId", om.valueToTree(this.getProfileId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontFieldLevelEncryptionConfig.CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems.Jsii$Proxy that = (CloudfrontFieldLevelEncryptionConfigContentTypeProfileConfigContentTypeProfilesItems.Jsii$Proxy) o;

            if (!contentType.equals(that.contentType)) return false;
            if (!format.equals(that.format)) return false;
            return this.profileId != null ? this.profileId.equals(that.profileId) : that.profileId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.contentType.hashCode();
            result = 31 * result + (this.format.hashCode());
            result = 31 * result + (this.profileId != null ? this.profileId.hashCode() : 0);
            return result;
        }
    }
}
