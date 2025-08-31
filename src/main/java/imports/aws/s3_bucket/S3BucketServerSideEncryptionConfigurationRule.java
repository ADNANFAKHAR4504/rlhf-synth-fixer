package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.248Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketServerSideEncryptionConfigurationRule")
@software.amazon.jsii.Jsii.Proxy(S3BucketServerSideEncryptionConfigurationRule.Jsii$Proxy.class)
public interface S3BucketServerSideEncryptionConfigurationRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * apply_server_side_encryption_by_default block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#apply_server_side_encryption_by_default S3Bucket#apply_server_side_encryption_by_default}
     */
    @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault getApplyServerSideEncryptionByDefault();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket_key_enabled S3Bucket#bucket_key_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBucketKeyEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketServerSideEncryptionConfigurationRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketServerSideEncryptionConfigurationRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketServerSideEncryptionConfigurationRule> {
        imports.aws.s3_bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault applyServerSideEncryptionByDefault;
        java.lang.Object bucketKeyEnabled;

        /**
         * Sets the value of {@link S3BucketServerSideEncryptionConfigurationRule#getApplyServerSideEncryptionByDefault}
         * @param applyServerSideEncryptionByDefault apply_server_side_encryption_by_default block. This parameter is required.
         *                                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#apply_server_side_encryption_by_default S3Bucket#apply_server_side_encryption_by_default}
         * @return {@code this}
         */
        public Builder applyServerSideEncryptionByDefault(imports.aws.s3_bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault applyServerSideEncryptionByDefault) {
            this.applyServerSideEncryptionByDefault = applyServerSideEncryptionByDefault;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketServerSideEncryptionConfigurationRule#getBucketKeyEnabled}
         * @param bucketKeyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket_key_enabled S3Bucket#bucket_key_enabled}.
         * @return {@code this}
         */
        public Builder bucketKeyEnabled(java.lang.Boolean bucketKeyEnabled) {
            this.bucketKeyEnabled = bucketKeyEnabled;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketServerSideEncryptionConfigurationRule#getBucketKeyEnabled}
         * @param bucketKeyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket_key_enabled S3Bucket#bucket_key_enabled}.
         * @return {@code this}
         */
        public Builder bucketKeyEnabled(com.hashicorp.cdktf.IResolvable bucketKeyEnabled) {
            this.bucketKeyEnabled = bucketKeyEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketServerSideEncryptionConfigurationRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketServerSideEncryptionConfigurationRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketServerSideEncryptionConfigurationRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketServerSideEncryptionConfigurationRule {
        private final imports.aws.s3_bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault applyServerSideEncryptionByDefault;
        private final java.lang.Object bucketKeyEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.applyServerSideEncryptionByDefault = software.amazon.jsii.Kernel.get(this, "applyServerSideEncryptionByDefault", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault.class));
            this.bucketKeyEnabled = software.amazon.jsii.Kernel.get(this, "bucketKeyEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.applyServerSideEncryptionByDefault = java.util.Objects.requireNonNull(builder.applyServerSideEncryptionByDefault, "applyServerSideEncryptionByDefault is required");
            this.bucketKeyEnabled = builder.bucketKeyEnabled;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault getApplyServerSideEncryptionByDefault() {
            return this.applyServerSideEncryptionByDefault;
        }

        @Override
        public final java.lang.Object getBucketKeyEnabled() {
            return this.bucketKeyEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("applyServerSideEncryptionByDefault", om.valueToTree(this.getApplyServerSideEncryptionByDefault()));
            if (this.getBucketKeyEnabled() != null) {
                data.set("bucketKeyEnabled", om.valueToTree(this.getBucketKeyEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3Bucket.S3BucketServerSideEncryptionConfigurationRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketServerSideEncryptionConfigurationRule.Jsii$Proxy that = (S3BucketServerSideEncryptionConfigurationRule.Jsii$Proxy) o;

            if (!applyServerSideEncryptionByDefault.equals(that.applyServerSideEncryptionByDefault)) return false;
            return this.bucketKeyEnabled != null ? this.bucketKeyEnabled.equals(that.bucketKeyEnabled) : that.bucketKeyEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.applyServerSideEncryptionByDefault.hashCode();
            result = 31 * result + (this.bucketKeyEnabled != null ? this.bucketKeyEnabled.hashCode() : 0);
            return result;
        }
    }
}
