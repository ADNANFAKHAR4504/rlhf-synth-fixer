package imports.aws.s3_bucket_lifecycle_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.256Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfigurationRule")
@software.amazon.jsii.Jsii.Proxy(S3BucketLifecycleConfigurationRule.Jsii$Proxy.class)
public interface S3BucketLifecycleConfigurationRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#id S3BucketLifecycleConfiguration#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#status S3BucketLifecycleConfiguration#status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatus();

    /**
     * abort_incomplete_multipart_upload block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#abort_incomplete_multipart_upload S3BucketLifecycleConfiguration#abort_incomplete_multipart_upload}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAbortIncompleteMultipartUpload() {
        return null;
    }

    /**
     * expiration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#expiration S3BucketLifecycleConfiguration#expiration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExpiration() {
        return null;
    }

    /**
     * filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#filter S3BucketLifecycleConfiguration#filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFilter() {
        return null;
    }

    /**
     * noncurrent_version_expiration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#noncurrent_version_expiration S3BucketLifecycleConfiguration#noncurrent_version_expiration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNoncurrentVersionExpiration() {
        return null;
    }

    /**
     * noncurrent_version_transition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#noncurrent_version_transition S3BucketLifecycleConfiguration#noncurrent_version_transition}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNoncurrentVersionTransition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#prefix S3BucketLifecycleConfiguration#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * transition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#transition S3BucketLifecycleConfiguration#transition}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTransition() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketLifecycleConfigurationRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketLifecycleConfigurationRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketLifecycleConfigurationRule> {
        java.lang.String id;
        java.lang.String status;
        java.lang.Object abortIncompleteMultipartUpload;
        java.lang.Object expiration;
        java.lang.Object filter;
        java.lang.Object noncurrentVersionExpiration;
        java.lang.Object noncurrentVersionTransition;
        java.lang.String prefix;
        java.lang.Object transition;

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#id S3BucketLifecycleConfiguration#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#status S3BucketLifecycleConfiguration#status}. This parameter is required.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getAbortIncompleteMultipartUpload}
         * @param abortIncompleteMultipartUpload abort_incomplete_multipart_upload block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#abort_incomplete_multipart_upload S3BucketLifecycleConfiguration#abort_incomplete_multipart_upload}
         * @return {@code this}
         */
        public Builder abortIncompleteMultipartUpload(com.hashicorp.cdktf.IResolvable abortIncompleteMultipartUpload) {
            this.abortIncompleteMultipartUpload = abortIncompleteMultipartUpload;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getAbortIncompleteMultipartUpload}
         * @param abortIncompleteMultipartUpload abort_incomplete_multipart_upload block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#abort_incomplete_multipart_upload S3BucketLifecycleConfiguration#abort_incomplete_multipart_upload}
         * @return {@code this}
         */
        public Builder abortIncompleteMultipartUpload(java.util.List<? extends imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload> abortIncompleteMultipartUpload) {
            this.abortIncompleteMultipartUpload = abortIncompleteMultipartUpload;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getExpiration}
         * @param expiration expiration block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#expiration S3BucketLifecycleConfiguration#expiration}
         * @return {@code this}
         */
        public Builder expiration(com.hashicorp.cdktf.IResolvable expiration) {
            this.expiration = expiration;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getExpiration}
         * @param expiration expiration block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#expiration S3BucketLifecycleConfiguration#expiration}
         * @return {@code this}
         */
        public Builder expiration(java.util.List<? extends imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleExpiration> expiration) {
            this.expiration = expiration;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#filter S3BucketLifecycleConfiguration#filter}
         * @return {@code this}
         */
        public Builder filter(com.hashicorp.cdktf.IResolvable filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#filter S3BucketLifecycleConfiguration#filter}
         * @return {@code this}
         */
        public Builder filter(java.util.List<? extends imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleFilter> filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getNoncurrentVersionExpiration}
         * @param noncurrentVersionExpiration noncurrent_version_expiration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#noncurrent_version_expiration S3BucketLifecycleConfiguration#noncurrent_version_expiration}
         * @return {@code this}
         */
        public Builder noncurrentVersionExpiration(com.hashicorp.cdktf.IResolvable noncurrentVersionExpiration) {
            this.noncurrentVersionExpiration = noncurrentVersionExpiration;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getNoncurrentVersionExpiration}
         * @param noncurrentVersionExpiration noncurrent_version_expiration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#noncurrent_version_expiration S3BucketLifecycleConfiguration#noncurrent_version_expiration}
         * @return {@code this}
         */
        public Builder noncurrentVersionExpiration(java.util.List<? extends imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionExpiration> noncurrentVersionExpiration) {
            this.noncurrentVersionExpiration = noncurrentVersionExpiration;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getNoncurrentVersionTransition}
         * @param noncurrentVersionTransition noncurrent_version_transition block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#noncurrent_version_transition S3BucketLifecycleConfiguration#noncurrent_version_transition}
         * @return {@code this}
         */
        public Builder noncurrentVersionTransition(com.hashicorp.cdktf.IResolvable noncurrentVersionTransition) {
            this.noncurrentVersionTransition = noncurrentVersionTransition;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getNoncurrentVersionTransition}
         * @param noncurrentVersionTransition noncurrent_version_transition block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#noncurrent_version_transition S3BucketLifecycleConfiguration#noncurrent_version_transition}
         * @return {@code this}
         */
        public Builder noncurrentVersionTransition(java.util.List<? extends imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionTransition> noncurrentVersionTransition) {
            this.noncurrentVersionTransition = noncurrentVersionTransition;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#prefix S3BucketLifecycleConfiguration#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getTransition}
         * @param transition transition block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#transition S3BucketLifecycleConfiguration#transition}
         * @return {@code this}
         */
        public Builder transition(com.hashicorp.cdktf.IResolvable transition) {
            this.transition = transition;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRule#getTransition}
         * @param transition transition block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#transition S3BucketLifecycleConfiguration#transition}
         * @return {@code this}
         */
        public Builder transition(java.util.List<? extends imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleTransition> transition) {
            this.transition = transition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketLifecycleConfigurationRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketLifecycleConfigurationRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketLifecycleConfigurationRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketLifecycleConfigurationRule {
        private final java.lang.String id;
        private final java.lang.String status;
        private final java.lang.Object abortIncompleteMultipartUpload;
        private final java.lang.Object expiration;
        private final java.lang.Object filter;
        private final java.lang.Object noncurrentVersionExpiration;
        private final java.lang.Object noncurrentVersionTransition;
        private final java.lang.String prefix;
        private final java.lang.Object transition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.abortIncompleteMultipartUpload = software.amazon.jsii.Kernel.get(this, "abortIncompleteMultipartUpload", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.expiration = software.amazon.jsii.Kernel.get(this, "expiration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.noncurrentVersionExpiration = software.amazon.jsii.Kernel.get(this, "noncurrentVersionExpiration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.noncurrentVersionTransition = software.amazon.jsii.Kernel.get(this, "noncurrentVersionTransition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transition = software.amazon.jsii.Kernel.get(this, "transition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.status = java.util.Objects.requireNonNull(builder.status, "status is required");
            this.abortIncompleteMultipartUpload = builder.abortIncompleteMultipartUpload;
            this.expiration = builder.expiration;
            this.filter = builder.filter;
            this.noncurrentVersionExpiration = builder.noncurrentVersionExpiration;
            this.noncurrentVersionTransition = builder.noncurrentVersionTransition;
            this.prefix = builder.prefix;
            this.transition = builder.transition;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final java.lang.Object getAbortIncompleteMultipartUpload() {
            return this.abortIncompleteMultipartUpload;
        }

        @Override
        public final java.lang.Object getExpiration() {
            return this.expiration;
        }

        @Override
        public final java.lang.Object getFilter() {
            return this.filter;
        }

        @Override
        public final java.lang.Object getNoncurrentVersionExpiration() {
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
        public final java.lang.Object getTransition() {
            return this.transition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("id", om.valueToTree(this.getId()));
            data.set("status", om.valueToTree(this.getStatus()));
            if (this.getAbortIncompleteMultipartUpload() != null) {
                data.set("abortIncompleteMultipartUpload", om.valueToTree(this.getAbortIncompleteMultipartUpload()));
            }
            if (this.getExpiration() != null) {
                data.set("expiration", om.valueToTree(this.getExpiration()));
            }
            if (this.getFilter() != null) {
                data.set("filter", om.valueToTree(this.getFilter()));
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
            if (this.getTransition() != null) {
                data.set("transition", om.valueToTree(this.getTransition()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfigurationRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketLifecycleConfigurationRule.Jsii$Proxy that = (S3BucketLifecycleConfigurationRule.Jsii$Proxy) o;

            if (!id.equals(that.id)) return false;
            if (!status.equals(that.status)) return false;
            if (this.abortIncompleteMultipartUpload != null ? !this.abortIncompleteMultipartUpload.equals(that.abortIncompleteMultipartUpload) : that.abortIncompleteMultipartUpload != null) return false;
            if (this.expiration != null ? !this.expiration.equals(that.expiration) : that.expiration != null) return false;
            if (this.filter != null ? !this.filter.equals(that.filter) : that.filter != null) return false;
            if (this.noncurrentVersionExpiration != null ? !this.noncurrentVersionExpiration.equals(that.noncurrentVersionExpiration) : that.noncurrentVersionExpiration != null) return false;
            if (this.noncurrentVersionTransition != null ? !this.noncurrentVersionTransition.equals(that.noncurrentVersionTransition) : that.noncurrentVersionTransition != null) return false;
            if (this.prefix != null ? !this.prefix.equals(that.prefix) : that.prefix != null) return false;
            return this.transition != null ? this.transition.equals(that.transition) : that.transition == null;
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            result = 31 * result + (this.status.hashCode());
            result = 31 * result + (this.abortIncompleteMultipartUpload != null ? this.abortIncompleteMultipartUpload.hashCode() : 0);
            result = 31 * result + (this.expiration != null ? this.expiration.hashCode() : 0);
            result = 31 * result + (this.filter != null ? this.filter.hashCode() : 0);
            result = 31 * result + (this.noncurrentVersionExpiration != null ? this.noncurrentVersionExpiration.hashCode() : 0);
            result = 31 * result + (this.noncurrentVersionTransition != null ? this.noncurrentVersionTransition.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            result = 31 * result + (this.transition != null ? this.transition.hashCode() : 0);
            return result;
        }
    }
}
