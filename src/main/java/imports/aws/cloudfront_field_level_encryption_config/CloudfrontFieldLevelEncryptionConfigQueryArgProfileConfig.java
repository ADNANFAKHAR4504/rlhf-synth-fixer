package imports.aws.cloudfront_field_level_encryption_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.239Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontFieldLevelEncryptionConfig.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig.Jsii$Proxy.class)
public interface CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#forward_when_query_arg_profile_is_unknown CloudfrontFieldLevelEncryptionConfig#forward_when_query_arg_profile_is_unknown}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getForwardWhenQueryArgProfileIsUnknown();

    /**
     * query_arg_profiles block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#query_arg_profiles CloudfrontFieldLevelEncryptionConfig#query_arg_profiles}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfiles getQueryArgProfiles() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig> {
        java.lang.Object forwardWhenQueryArgProfileIsUnknown;
        imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfiles queryArgProfiles;

        /**
         * Sets the value of {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig#getForwardWhenQueryArgProfileIsUnknown}
         * @param forwardWhenQueryArgProfileIsUnknown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#forward_when_query_arg_profile_is_unknown CloudfrontFieldLevelEncryptionConfig#forward_when_query_arg_profile_is_unknown}. This parameter is required.
         * @return {@code this}
         */
        public Builder forwardWhenQueryArgProfileIsUnknown(java.lang.Boolean forwardWhenQueryArgProfileIsUnknown) {
            this.forwardWhenQueryArgProfileIsUnknown = forwardWhenQueryArgProfileIsUnknown;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig#getForwardWhenQueryArgProfileIsUnknown}
         * @param forwardWhenQueryArgProfileIsUnknown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#forward_when_query_arg_profile_is_unknown CloudfrontFieldLevelEncryptionConfig#forward_when_query_arg_profile_is_unknown}. This parameter is required.
         * @return {@code this}
         */
        public Builder forwardWhenQueryArgProfileIsUnknown(com.hashicorp.cdktf.IResolvable forwardWhenQueryArgProfileIsUnknown) {
            this.forwardWhenQueryArgProfileIsUnknown = forwardWhenQueryArgProfileIsUnknown;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig#getQueryArgProfiles}
         * @param queryArgProfiles query_arg_profiles block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#query_arg_profiles CloudfrontFieldLevelEncryptionConfig#query_arg_profiles}
         * @return {@code this}
         */
        public Builder queryArgProfiles(imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfiles queryArgProfiles) {
            this.queryArgProfiles = queryArgProfiles;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig {
        private final java.lang.Object forwardWhenQueryArgProfileIsUnknown;
        private final imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfiles queryArgProfiles;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.forwardWhenQueryArgProfileIsUnknown = software.amazon.jsii.Kernel.get(this, "forwardWhenQueryArgProfileIsUnknown", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.queryArgProfiles = software.amazon.jsii.Kernel.get(this, "queryArgProfiles", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfiles.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.forwardWhenQueryArgProfileIsUnknown = java.util.Objects.requireNonNull(builder.forwardWhenQueryArgProfileIsUnknown, "forwardWhenQueryArgProfileIsUnknown is required");
            this.queryArgProfiles = builder.queryArgProfiles;
        }

        @Override
        public final java.lang.Object getForwardWhenQueryArgProfileIsUnknown() {
            return this.forwardWhenQueryArgProfileIsUnknown;
        }

        @Override
        public final imports.aws.cloudfront_field_level_encryption_config.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfiles getQueryArgProfiles() {
            return this.queryArgProfiles;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("forwardWhenQueryArgProfileIsUnknown", om.valueToTree(this.getForwardWhenQueryArgProfileIsUnknown()));
            if (this.getQueryArgProfiles() != null) {
                data.set("queryArgProfiles", om.valueToTree(this.getQueryArgProfiles()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontFieldLevelEncryptionConfig.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig.Jsii$Proxy that = (CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfig.Jsii$Proxy) o;

            if (!forwardWhenQueryArgProfileIsUnknown.equals(that.forwardWhenQueryArgProfileIsUnknown)) return false;
            return this.queryArgProfiles != null ? this.queryArgProfiles.equals(that.queryArgProfiles) : that.queryArgProfiles == null;
        }

        @Override
        public final int hashCode() {
            int result = this.forwardWhenQueryArgProfileIsUnknown.hashCode();
            result = 31 * result + (this.queryArgProfiles != null ? this.queryArgProfiles.hashCode() : 0);
            return result;
        }
    }
}
