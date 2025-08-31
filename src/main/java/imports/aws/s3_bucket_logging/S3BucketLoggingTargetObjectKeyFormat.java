package imports.aws.s3_bucket_logging;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.258Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketLogging.S3BucketLoggingTargetObjectKeyFormat")
@software.amazon.jsii.Jsii.Proxy(S3BucketLoggingTargetObjectKeyFormat.Jsii$Proxy.class)
public interface S3BucketLoggingTargetObjectKeyFormat extends software.amazon.jsii.JsiiSerializable {

    /**
     * partitioned_prefix block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#partitioned_prefix S3BucketLoggingA#partitioned_prefix}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefix getPartitionedPrefix() {
        return null;
    }

    /**
     * simple_prefix block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#simple_prefix S3BucketLoggingA#simple_prefix}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatSimplePrefix getSimplePrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketLoggingTargetObjectKeyFormat}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketLoggingTargetObjectKeyFormat}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketLoggingTargetObjectKeyFormat> {
        imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefix partitionedPrefix;
        imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatSimplePrefix simplePrefix;

        /**
         * Sets the value of {@link S3BucketLoggingTargetObjectKeyFormat#getPartitionedPrefix}
         * @param partitionedPrefix partitioned_prefix block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#partitioned_prefix S3BucketLoggingA#partitioned_prefix}
         * @return {@code this}
         */
        public Builder partitionedPrefix(imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefix partitionedPrefix) {
            this.partitionedPrefix = partitionedPrefix;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLoggingTargetObjectKeyFormat#getSimplePrefix}
         * @param simplePrefix simple_prefix block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#simple_prefix S3BucketLoggingA#simple_prefix}
         * @return {@code this}
         */
        public Builder simplePrefix(imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatSimplePrefix simplePrefix) {
            this.simplePrefix = simplePrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketLoggingTargetObjectKeyFormat}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketLoggingTargetObjectKeyFormat build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketLoggingTargetObjectKeyFormat}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketLoggingTargetObjectKeyFormat {
        private final imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefix partitionedPrefix;
        private final imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatSimplePrefix simplePrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.partitionedPrefix = software.amazon.jsii.Kernel.get(this, "partitionedPrefix", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefix.class));
            this.simplePrefix = software.amazon.jsii.Kernel.get(this, "simplePrefix", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatSimplePrefix.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.partitionedPrefix = builder.partitionedPrefix;
            this.simplePrefix = builder.simplePrefix;
        }

        @Override
        public final imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatPartitionedPrefix getPartitionedPrefix() {
            return this.partitionedPrefix;
        }

        @Override
        public final imports.aws.s3_bucket_logging.S3BucketLoggingTargetObjectKeyFormatSimplePrefix getSimplePrefix() {
            return this.simplePrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPartitionedPrefix() != null) {
                data.set("partitionedPrefix", om.valueToTree(this.getPartitionedPrefix()));
            }
            if (this.getSimplePrefix() != null) {
                data.set("simplePrefix", om.valueToTree(this.getSimplePrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketLogging.S3BucketLoggingTargetObjectKeyFormat"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketLoggingTargetObjectKeyFormat.Jsii$Proxy that = (S3BucketLoggingTargetObjectKeyFormat.Jsii$Proxy) o;

            if (this.partitionedPrefix != null ? !this.partitionedPrefix.equals(that.partitionedPrefix) : that.partitionedPrefix != null) return false;
            return this.simplePrefix != null ? this.simplePrefix.equals(that.simplePrefix) : that.simplePrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.partitionedPrefix != null ? this.partitionedPrefix.hashCode() : 0;
            result = 31 * result + (this.simplePrefix != null ? this.simplePrefix.hashCode() : 0);
            return result;
        }
    }
}
