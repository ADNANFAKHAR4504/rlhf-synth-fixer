package imports.aws.cloudfront_field_level_encryption_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.239Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontFieldLevelEncryptionConfig.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems")
@software.amazon.jsii.Jsii.Proxy(CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems.Jsii$Proxy.class)
public interface CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#profile_id CloudfrontFieldLevelEncryptionConfig#profile_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProfileId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#query_arg CloudfrontFieldLevelEncryptionConfig#query_arg}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getQueryArg();

    /**
     * @return a {@link Builder} of {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems> {
        java.lang.String profileId;
        java.lang.String queryArg;

        /**
         * Sets the value of {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems#getProfileId}
         * @param profileId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#profile_id CloudfrontFieldLevelEncryptionConfig#profile_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder profileId(java.lang.String profileId) {
            this.profileId = profileId;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems#getQueryArg}
         * @param queryArg Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_field_level_encryption_config#query_arg CloudfrontFieldLevelEncryptionConfig#query_arg}. This parameter is required.
         * @return {@code this}
         */
        public Builder queryArg(java.lang.String queryArg) {
            this.queryArg = queryArg;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems {
        private final java.lang.String profileId;
        private final java.lang.String queryArg;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.profileId = software.amazon.jsii.Kernel.get(this, "profileId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.queryArg = software.amazon.jsii.Kernel.get(this, "queryArg", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.profileId = java.util.Objects.requireNonNull(builder.profileId, "profileId is required");
            this.queryArg = java.util.Objects.requireNonNull(builder.queryArg, "queryArg is required");
        }

        @Override
        public final java.lang.String getProfileId() {
            return this.profileId;
        }

        @Override
        public final java.lang.String getQueryArg() {
            return this.queryArg;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("profileId", om.valueToTree(this.getProfileId()));
            data.set("queryArg", om.valueToTree(this.getQueryArg()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontFieldLevelEncryptionConfig.CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems.Jsii$Proxy that = (CloudfrontFieldLevelEncryptionConfigQueryArgProfileConfigQueryArgProfilesItems.Jsii$Proxy) o;

            if (!profileId.equals(that.profileId)) return false;
            return this.queryArg.equals(that.queryArg);
        }

        @Override
        public final int hashCode() {
            int result = this.profileId.hashCode();
            result = 31 * result + (this.queryArg.hashCode());
            return result;
        }
    }
}
