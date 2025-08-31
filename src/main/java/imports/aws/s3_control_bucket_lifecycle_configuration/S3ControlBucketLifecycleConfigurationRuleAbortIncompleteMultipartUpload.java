package imports.aws.s3_control_bucket_lifecycle_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.276Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlBucketLifecycleConfiguration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload")
@software.amazon.jsii.Jsii.Proxy(S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload.Jsii$Proxy.class)
public interface S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#days_after_initiation S3ControlBucketLifecycleConfiguration#days_after_initiation}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDaysAfterInitiation();

    /**
     * @return a {@link Builder} of {@link S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload> {
        java.lang.Number daysAfterInitiation;

        /**
         * Sets the value of {@link S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload#getDaysAfterInitiation}
         * @param daysAfterInitiation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#days_after_initiation S3ControlBucketLifecycleConfiguration#days_after_initiation}. This parameter is required.
         * @return {@code this}
         */
        public Builder daysAfterInitiation(java.lang.Number daysAfterInitiation) {
            this.daysAfterInitiation = daysAfterInitiation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload {
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
            this.daysAfterInitiation = java.util.Objects.requireNonNull(builder.daysAfterInitiation, "daysAfterInitiation is required");
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

            data.set("daysAfterInitiation", om.valueToTree(this.getDaysAfterInitiation()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlBucketLifecycleConfiguration.S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload.Jsii$Proxy that = (S3ControlBucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload.Jsii$Proxy) o;

            return this.daysAfterInitiation.equals(that.daysAfterInitiation);
        }

        @Override
        public final int hashCode() {
            int result = this.daysAfterInitiation.hashCode();
            return result;
        }
    }
}
