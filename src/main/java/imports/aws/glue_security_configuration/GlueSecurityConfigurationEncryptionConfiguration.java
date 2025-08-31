package imports.aws.glue_security_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.305Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueSecurityConfiguration.GlueSecurityConfigurationEncryptionConfiguration")
@software.amazon.jsii.Jsii.Proxy(GlueSecurityConfigurationEncryptionConfiguration.Jsii$Proxy.class)
public interface GlueSecurityConfigurationEncryptionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloudwatch_encryption block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_security_configuration#cloudwatch_encryption GlueSecurityConfiguration#cloudwatch_encryption}
     */
    @org.jetbrains.annotations.NotNull imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationCloudwatchEncryption getCloudwatchEncryption();

    /**
     * job_bookmarks_encryption block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_security_configuration#job_bookmarks_encryption GlueSecurityConfiguration#job_bookmarks_encryption}
     */
    @org.jetbrains.annotations.NotNull imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationJobBookmarksEncryption getJobBookmarksEncryption();

    /**
     * s3_encryption block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_security_configuration#s3_encryption GlueSecurityConfiguration#s3_encryption}
     */
    @org.jetbrains.annotations.NotNull imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3Encryption getS3Encryption();

    /**
     * @return a {@link Builder} of {@link GlueSecurityConfigurationEncryptionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueSecurityConfigurationEncryptionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueSecurityConfigurationEncryptionConfiguration> {
        imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationCloudwatchEncryption cloudwatchEncryption;
        imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationJobBookmarksEncryption jobBookmarksEncryption;
        imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3Encryption s3Encryption;

        /**
         * Sets the value of {@link GlueSecurityConfigurationEncryptionConfiguration#getCloudwatchEncryption}
         * @param cloudwatchEncryption cloudwatch_encryption block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_security_configuration#cloudwatch_encryption GlueSecurityConfiguration#cloudwatch_encryption}
         * @return {@code this}
         */
        public Builder cloudwatchEncryption(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationCloudwatchEncryption cloudwatchEncryption) {
            this.cloudwatchEncryption = cloudwatchEncryption;
            return this;
        }

        /**
         * Sets the value of {@link GlueSecurityConfigurationEncryptionConfiguration#getJobBookmarksEncryption}
         * @param jobBookmarksEncryption job_bookmarks_encryption block. This parameter is required.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_security_configuration#job_bookmarks_encryption GlueSecurityConfiguration#job_bookmarks_encryption}
         * @return {@code this}
         */
        public Builder jobBookmarksEncryption(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationJobBookmarksEncryption jobBookmarksEncryption) {
            this.jobBookmarksEncryption = jobBookmarksEncryption;
            return this;
        }

        /**
         * Sets the value of {@link GlueSecurityConfigurationEncryptionConfiguration#getS3Encryption}
         * @param s3Encryption s3_encryption block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_security_configuration#s3_encryption GlueSecurityConfiguration#s3_encryption}
         * @return {@code this}
         */
        public Builder s3Encryption(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3Encryption s3Encryption) {
            this.s3Encryption = s3Encryption;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueSecurityConfigurationEncryptionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueSecurityConfigurationEncryptionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueSecurityConfigurationEncryptionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueSecurityConfigurationEncryptionConfiguration {
        private final imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationCloudwatchEncryption cloudwatchEncryption;
        private final imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationJobBookmarksEncryption jobBookmarksEncryption;
        private final imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3Encryption s3Encryption;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchEncryption = software.amazon.jsii.Kernel.get(this, "cloudwatchEncryption", software.amazon.jsii.NativeType.forClass(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationCloudwatchEncryption.class));
            this.jobBookmarksEncryption = software.amazon.jsii.Kernel.get(this, "jobBookmarksEncryption", software.amazon.jsii.NativeType.forClass(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationJobBookmarksEncryption.class));
            this.s3Encryption = software.amazon.jsii.Kernel.get(this, "s3Encryption", software.amazon.jsii.NativeType.forClass(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3Encryption.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchEncryption = java.util.Objects.requireNonNull(builder.cloudwatchEncryption, "cloudwatchEncryption is required");
            this.jobBookmarksEncryption = java.util.Objects.requireNonNull(builder.jobBookmarksEncryption, "jobBookmarksEncryption is required");
            this.s3Encryption = java.util.Objects.requireNonNull(builder.s3Encryption, "s3Encryption is required");
        }

        @Override
        public final imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationCloudwatchEncryption getCloudwatchEncryption() {
            return this.cloudwatchEncryption;
        }

        @Override
        public final imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationJobBookmarksEncryption getJobBookmarksEncryption() {
            return this.jobBookmarksEncryption;
        }

        @Override
        public final imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3Encryption getS3Encryption() {
            return this.s3Encryption;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cloudwatchEncryption", om.valueToTree(this.getCloudwatchEncryption()));
            data.set("jobBookmarksEncryption", om.valueToTree(this.getJobBookmarksEncryption()));
            data.set("s3Encryption", om.valueToTree(this.getS3Encryption()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueSecurityConfiguration.GlueSecurityConfigurationEncryptionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueSecurityConfigurationEncryptionConfiguration.Jsii$Proxy that = (GlueSecurityConfigurationEncryptionConfiguration.Jsii$Proxy) o;

            if (!cloudwatchEncryption.equals(that.cloudwatchEncryption)) return false;
            if (!jobBookmarksEncryption.equals(that.jobBookmarksEncryption)) return false;
            return this.s3Encryption.equals(that.s3Encryption);
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchEncryption.hashCode();
            result = 31 * result + (this.jobBookmarksEncryption.hashCode());
            result = 31 * result + (this.s3Encryption.hashCode());
            return result;
        }
    }
}
