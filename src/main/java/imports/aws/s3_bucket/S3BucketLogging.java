package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.246Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketLogging")
@software.amazon.jsii.Jsii.Proxy(S3BucketLogging.Jsii$Proxy.class)
public interface S3BucketLogging extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#target_bucket S3Bucket#target_bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#target_prefix S3Bucket#target_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketLogging}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketLogging}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketLogging> {
        java.lang.String targetBucket;
        java.lang.String targetPrefix;

        /**
         * Sets the value of {@link S3BucketLogging#getTargetBucket}
         * @param targetBucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#target_bucket S3Bucket#target_bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetBucket(java.lang.String targetBucket) {
            this.targetBucket = targetBucket;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLogging#getTargetPrefix}
         * @param targetPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#target_prefix S3Bucket#target_prefix}.
         * @return {@code this}
         */
        public Builder targetPrefix(java.lang.String targetPrefix) {
            this.targetPrefix = targetPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketLogging}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketLogging build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketLogging}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketLogging {
        private final java.lang.String targetBucket;
        private final java.lang.String targetPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetBucket = software.amazon.jsii.Kernel.get(this, "targetBucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetPrefix = software.amazon.jsii.Kernel.get(this, "targetPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetBucket = java.util.Objects.requireNonNull(builder.targetBucket, "targetBucket is required");
            this.targetPrefix = builder.targetPrefix;
        }

        @Override
        public final java.lang.String getTargetBucket() {
            return this.targetBucket;
        }

        @Override
        public final java.lang.String getTargetPrefix() {
            return this.targetPrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("targetBucket", om.valueToTree(this.getTargetBucket()));
            if (this.getTargetPrefix() != null) {
                data.set("targetPrefix", om.valueToTree(this.getTargetPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3Bucket.S3BucketLogging"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketLogging.Jsii$Proxy that = (S3BucketLogging.Jsii$Proxy) o;

            if (!targetBucket.equals(that.targetBucket)) return false;
            return this.targetPrefix != null ? this.targetPrefix.equals(that.targetPrefix) : that.targetPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetBucket.hashCode();
            result = 31 * result + (this.targetPrefix != null ? this.targetPrefix.hashCode() : 0);
            return result;
        }
    }
}
