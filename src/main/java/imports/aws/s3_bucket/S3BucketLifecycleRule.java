package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.246Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketLifecycleRule")
@software.amazon.jsii.Jsii.Proxy(S3BucketLifecycleRule.Jsii$Proxy.class)
public interface S3BucketLifecycleRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#enabled S3Bucket#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#abort_incomplete_multipart_upload_days S3Bucket#abort_incomplete_multipart_upload_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAbortIncompleteMultipartUploadDays() {
        return null;
    }

    /**
     * expiration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#expiration S3Bucket#expiration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketLifecycleRuleExpiration getExpiration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#id S3Bucket#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * noncurrent_version_expiration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#noncurrent_version_expiration S3Bucket#noncurrent_version_expiration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionExpiration getNoncurrentVersionExpiration() {
        return null;
    }

    /**
     * noncurrent_version_transition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#noncurrent_version_transition S3Bucket#noncurrent_version_transition}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNoncurrentVersionTransition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#prefix S3Bucket#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#tags S3Bucket#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * transition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#transition S3Bucket#transition}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTransition() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketLifecycleRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketLifecycleRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketLifecycleRule> {
        java.lang.Object enabled;
        java.lang.Number abortIncompleteMultipartUploadDays;
        imports.aws.s3_bucket.S3BucketLifecycleRuleExpiration expiration;
        java.lang.String id;
        imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionExpiration noncurrentVersionExpiration;
        java.lang.Object noncurrentVersionTransition;
        java.lang.String prefix;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Object transition;

        /**
         * Sets the value of {@link S3BucketLifecycleRule#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#enabled S3Bucket#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleRule#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#enabled S3Bucket#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleRule#getAbortIncompleteMultipartUploadDays}
         * @param abortIncompleteMultipartUploadDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#abort_incomplete_multipart_upload_days S3Bucket#abort_incomplete_multipart_upload_days}.
         * @return {@code this}
         */
        public Builder abortIncompleteMultipartUploadDays(java.lang.Number abortIncompleteMultipartUploadDays) {
            this.abortIncompleteMultipartUploadDays = abortIncompleteMultipartUploadDays;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleRule#getExpiration}
         * @param expiration expiration block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#expiration S3Bucket#expiration}
         * @return {@code this}
         */
        public Builder expiration(imports.aws.s3_bucket.S3BucketLifecycleRuleExpiration expiration) {
            this.expiration = expiration;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleRule#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#id S3Bucket#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleRule#getNoncurrentVersionExpiration}
         * @param noncurrentVersionExpiration noncurrent_version_expiration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#noncurrent_version_expiration S3Bucket#noncurrent_version_expiration}
         * @return {@code this}
         */
        public Builder noncurrentVersionExpiration(imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionExpiration noncurrentVersionExpiration) {
            this.noncurrentVersionExpiration = noncurrentVersionExpiration;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleRule#getNoncurrentVersionTransition}
         * @param noncurrentVersionTransition noncurrent_version_transition block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#noncurrent_version_transition S3Bucket#noncurrent_version_transition}
         * @return {@code this}
         */
        public Builder noncurrentVersionTransition(com.hashicorp.cdktf.IResolvable noncurrentVersionTransition) {
            this.noncurrentVersionTransition = noncurrentVersionTransition;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleRule#getNoncurrentVersionTransition}
         * @param noncurrentVersionTransition noncurrent_version_transition block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#noncurrent_version_transition S3Bucket#noncurrent_version_transition}
         * @return {@code this}
         */
        public Builder noncurrentVersionTransition(java.util.List<? extends imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionTransition> noncurrentVersionTransition) {
            this.noncurrentVersionTransition = noncurrentVersionTransition;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleRule#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#prefix S3Bucket#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleRule#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#tags S3Bucket#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleRule#getTransition}
         * @param transition transition block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#transition S3Bucket#transition}
         * @return {@code this}
         */
        public Builder transition(com.hashicorp.cdktf.IResolvable transition) {
            this.transition = transition;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleRule#getTransition}
         * @param transition transition block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#transition S3Bucket#transition}
         * @return {@code this}
         */
        public Builder transition(java.util.List<? extends imports.aws.s3_bucket.S3BucketLifecycleRuleTransition> transition) {
            this.transition = transition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketLifecycleRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketLifecycleRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketLifecycleRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketLifecycleRule {
        private final java.lang.Object enabled;
        private final java.lang.Number abortIncompleteMultipartUploadDays;
        private final imports.aws.s3_bucket.S3BucketLifecycleRuleExpiration expiration;
        private final java.lang.String id;
        private final imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionExpiration noncurrentVersionExpiration;
        private final java.lang.Object noncurrentVersionTransition;
        private final java.lang.String prefix;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.lang.Object transition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.abortIncompleteMultipartUploadDays = software.amazon.jsii.Kernel.get(this, "abortIncompleteMultipartUploadDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.expiration = software.amazon.jsii.Kernel.get(this, "expiration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketLifecycleRuleExpiration.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.noncurrentVersionExpiration = software.amazon.jsii.Kernel.get(this, "noncurrentVersionExpiration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionExpiration.class));
            this.noncurrentVersionTransition = software.amazon.jsii.Kernel.get(this, "noncurrentVersionTransition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.transition = software.amazon.jsii.Kernel.get(this, "transition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.abortIncompleteMultipartUploadDays = builder.abortIncompleteMultipartUploadDays;
            this.expiration = builder.expiration;
            this.id = builder.id;
            this.noncurrentVersionExpiration = builder.noncurrentVersionExpiration;
            this.noncurrentVersionTransition = builder.noncurrentVersionTransition;
            this.prefix = builder.prefix;
            this.tags = builder.tags;
            this.transition = builder.transition;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Number getAbortIncompleteMultipartUploadDays() {
            return this.abortIncompleteMultipartUploadDays;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketLifecycleRuleExpiration getExpiration() {
            return this.expiration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionExpiration getNoncurrentVersionExpiration() {
            return this.noncurrentVersionExpiration;
        }

        @Override
        public final java.lang.Object getNoncurrentVersionTransition() {
            return this.noncurrentVersionTransition;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.lang.Object getTransition() {
            return this.transition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getAbortIncompleteMultipartUploadDays() != null) {
                data.set("abortIncompleteMultipartUploadDays", om.valueToTree(this.getAbortIncompleteMultipartUploadDays()));
            }
            if (this.getExpiration() != null) {
                data.set("expiration", om.valueToTree(this.getExpiration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getNoncurrentVersionExpiration() != null) {
                data.set("noncurrentVersionExpiration", om.valueToTree(this.getNoncurrentVersionExpiration()));
            }
            if (this.getNoncurrentVersionTransition() != null) {
                data.set("noncurrentVersionTransition", om.valueToTree(this.getNoncurrentVersionTransition()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTransition() != null) {
                data.set("transition", om.valueToTree(this.getTransition()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3Bucket.S3BucketLifecycleRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketLifecycleRule.Jsii$Proxy that = (S3BucketLifecycleRule.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            if (this.abortIncompleteMultipartUploadDays != null ? !this.abortIncompleteMultipartUploadDays.equals(that.abortIncompleteMultipartUploadDays) : that.abortIncompleteMultipartUploadDays != null) return false;
            if (this.expiration != null ? !this.expiration.equals(that.expiration) : that.expiration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.noncurrentVersionExpiration != null ? !this.noncurrentVersionExpiration.equals(that.noncurrentVersionExpiration) : that.noncurrentVersionExpiration != null) return false;
            if (this.noncurrentVersionTransition != null ? !this.noncurrentVersionTransition.equals(that.noncurrentVersionTransition) : that.noncurrentVersionTransition != null) return false;
            if (this.prefix != null ? !this.prefix.equals(that.prefix) : that.prefix != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            return this.transition != null ? this.transition.equals(that.transition) : that.transition == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.abortIncompleteMultipartUploadDays != null ? this.abortIncompleteMultipartUploadDays.hashCode() : 0);
            result = 31 * result + (this.expiration != null ? this.expiration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.noncurrentVersionExpiration != null ? this.noncurrentVersionExpiration.hashCode() : 0);
            result = 31 * result + (this.noncurrentVersionTransition != null ? this.noncurrentVersionTransition.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.transition != null ? this.transition.hashCode() : 0);
            return result;
        }
    }
}
