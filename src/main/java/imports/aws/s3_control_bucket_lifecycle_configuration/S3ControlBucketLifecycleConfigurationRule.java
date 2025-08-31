package imports.aws.s3_control_bucket_lifecycle_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.276Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlBucketLifecycleConfiguration.S3ControlBucketLifecycleConfigurationRule")
@software.amazon.jsii.Jsii.Proxy(S3ControlBucketLifecycleConfigurationRule.Jsii$Proxy.class)
public interface S3ControlBucketLifecycleConfigurationRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#id S3ControlBucketLifecycleConfiguration#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * abort_incomplete_multipart_upload block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#abort_incomplete_multipart_upload S3ControlBucketLifecycleConfiguration#abort_incomplete_multipart_upload}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload getAbortIncompleteMultipartUpload() {
        return null;
    }

    /**
     * expiration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#expiration S3ControlBucketLifecycleConfiguration#expiration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleExpiration getExpiration() {
        return null;
    }

    /**
     * filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#filter S3ControlBucketLifecycleConfiguration#filter}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleFilter getFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#status S3ControlBucketLifecycleConfiguration#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlBucketLifecycleConfigurationRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlBucketLifecycleConfigurationRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlBucketLifecycleConfigurationRule> {
        java.lang.String id;
        imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload abortIncompleteMultipartUpload;
        imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleExpiration expiration;
        imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleFilter filter;
        java.lang.String status;

        /**
         * Sets the value of {@link S3ControlBucketLifecycleConfigurationRule#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#id S3ControlBucketLifecycleConfiguration#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlBucketLifecycleConfigurationRule#getAbortIncompleteMultipartUpload}
         * @param abortIncompleteMultipartUpload abort_incomplete_multipart_upload block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#abort_incomplete_multipart_upload S3ControlBucketLifecycleConfiguration#abort_incomplete_multipart_upload}
         * @return {@code this}
         */
        public Builder abortIncompleteMultipartUpload(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload abortIncompleteMultipartUpload) {
            this.abortIncompleteMultipartUpload = abortIncompleteMultipartUpload;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlBucketLifecycleConfigurationRule#getExpiration}
         * @param expiration expiration block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#expiration S3ControlBucketLifecycleConfiguration#expiration}
         * @return {@code this}
         */
        public Builder expiration(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleExpiration expiration) {
            this.expiration = expiration;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlBucketLifecycleConfigurationRule#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#filter S3ControlBucketLifecycleConfiguration#filter}
         * @return {@code this}
         */
        public Builder filter(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleFilter filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlBucketLifecycleConfigurationRule#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#status S3ControlBucketLifecycleConfiguration#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlBucketLifecycleConfigurationRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlBucketLifecycleConfigurationRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlBucketLifecycleConfigurationRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlBucketLifecycleConfigurationRule {
        private final java.lang.String id;
        private final imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload abortIncompleteMultipartUpload;
        private final imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleExpiration expiration;
        private final imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleFilter filter;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.abortIncompleteMultipartUpload = software.amazon.jsii.Kernel.get(this, "abortIncompleteMultipartUpload", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload.class));
            this.expiration = software.amazon.jsii.Kernel.get(this, "expiration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleExpiration.class));
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleFilter.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.abortIncompleteMultipartUpload = builder.abortIncompleteMultipartUpload;
            this.expiration = builder.expiration;
            this.filter = builder.filter;
            this.status = builder.status;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload getAbortIncompleteMultipartUpload() {
            return this.abortIncompleteMultipartUpload;
        }

        @Override
        public final imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleExpiration getExpiration() {
            return this.expiration;
        }

        @Override
        public final imports.aws.s3_control_bucket_lifecycle_configuration.S3ControlBucketLifecycleConfigurationRuleFilter getFilter() {
            return this.filter;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("id", om.valueToTree(this.getId()));
            if (this.getAbortIncompleteMultipartUpload() != null) {
                data.set("abortIncompleteMultipartUpload", om.valueToTree(this.getAbortIncompleteMultipartUpload()));
            }
            if (this.getExpiration() != null) {
                data.set("expiration", om.valueToTree(this.getExpiration()));
            }
            if (this.getFilter() != null) {
                data.set("filter", om.valueToTree(this.getFilter()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlBucketLifecycleConfiguration.S3ControlBucketLifecycleConfigurationRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlBucketLifecycleConfigurationRule.Jsii$Proxy that = (S3ControlBucketLifecycleConfigurationRule.Jsii$Proxy) o;

            if (!id.equals(that.id)) return false;
            if (this.abortIncompleteMultipartUpload != null ? !this.abortIncompleteMultipartUpload.equals(that.abortIncompleteMultipartUpload) : that.abortIncompleteMultipartUpload != null) return false;
            if (this.expiration != null ? !this.expiration.equals(that.expiration) : that.expiration != null) return false;
            if (this.filter != null ? !this.filter.equals(that.filter) : that.filter != null) return false;
            return this.status != null ? this.status.equals(that.status) : that.status == null;
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            result = 31 * result + (this.abortIncompleteMultipartUpload != null ? this.abortIncompleteMultipartUpload.hashCode() : 0);
            result = 31 * result + (this.expiration != null ? this.expiration.hashCode() : 0);
            result = 31 * result + (this.filter != null ? this.filter.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            return result;
        }
    }
}
