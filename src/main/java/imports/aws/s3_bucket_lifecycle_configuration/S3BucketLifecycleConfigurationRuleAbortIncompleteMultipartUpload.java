package imports.aws.s3_bucket_lifecycle_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.256Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload")
@software.amazon.jsii.Jsii.Proxy(S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload.Jsii$Proxy.class)
public interface S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#days_after_initiation S3BucketLifecycleConfiguration#days_after_initiation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDaysAfterInitiation() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload> {
        java.lang.Number daysAfterInitiation;

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload#getDaysAfterInitiation}
         * @param daysAfterInitiation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#days_after_initiation S3BucketLifecycleConfiguration#days_after_initiation}.
         * @return {@code this}
         */
        public Builder daysAfterInitiation(java.lang.Number daysAfterInitiation) {
            this.daysAfterInitiation = daysAfterInitiation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload {
        private final java.lang.Number daysAfterInitiation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.daysAfterInitiation = software.amazon.jsii.Kernel.get(this, "daysAfterInitiation", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.daysAfterInitiation = builder.daysAfterInitiation;
        }

        @Override
        public final java.lang.Number getDaysAfterInitiation() {
            return this.daysAfterInitiation;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDaysAfterInitiation() != null) {
                data.set("daysAfterInitiation", om.valueToTree(this.getDaysAfterInitiation()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload.Jsii$Proxy that = (S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload.Jsii$Proxy) o;

            return this.daysAfterInitiation != null ? this.daysAfterInitiation.equals(that.daysAfterInitiation) : that.daysAfterInitiation == null;
        }

        @Override
        public final int hashCode() {
            int result = this.daysAfterInitiation != null ? this.daysAfterInitiation.hashCode() : 0;
            return result;
        }
    }
}
