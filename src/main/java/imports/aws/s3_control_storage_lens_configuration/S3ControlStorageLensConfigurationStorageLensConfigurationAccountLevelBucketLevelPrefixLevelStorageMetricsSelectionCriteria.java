package imports.aws.s3_control_storage_lens_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.285Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria")
@software.amazon.jsii.Jsii.Proxy(S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria.Jsii$Proxy.class)
public interface S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#delimiter S3ControlStorageLensConfiguration#delimiter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDelimiter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#max_depth S3ControlStorageLensConfiguration#max_depth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxDepth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#min_storage_bytes_percentage S3ControlStorageLensConfiguration#min_storage_bytes_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinStorageBytesPercentage() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria> {
        java.lang.String delimiter;
        java.lang.Number maxDepth;
        java.lang.Number minStorageBytesPercentage;

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria#getDelimiter}
         * @param delimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#delimiter S3ControlStorageLensConfiguration#delimiter}.
         * @return {@code this}
         */
        public Builder delimiter(java.lang.String delimiter) {
            this.delimiter = delimiter;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria#getMaxDepth}
         * @param maxDepth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#max_depth S3ControlStorageLensConfiguration#max_depth}.
         * @return {@code this}
         */
        public Builder maxDepth(java.lang.Number maxDepth) {
            this.maxDepth = maxDepth;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria#getMinStorageBytesPercentage}
         * @param minStorageBytesPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#min_storage_bytes_percentage S3ControlStorageLensConfiguration#min_storage_bytes_percentage}.
         * @return {@code this}
         */
        public Builder minStorageBytesPercentage(java.lang.Number minStorageBytesPercentage) {
            this.minStorageBytesPercentage = minStorageBytesPercentage;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria {
        private final java.lang.String delimiter;
        private final java.lang.Number maxDepth;
        private final java.lang.Number minStorageBytesPercentage;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.delimiter = software.amazon.jsii.Kernel.get(this, "delimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxDepth = software.amazon.jsii.Kernel.get(this, "maxDepth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minStorageBytesPercentage = software.amazon.jsii.Kernel.get(this, "minStorageBytesPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.delimiter = builder.delimiter;
            this.maxDepth = builder.maxDepth;
            this.minStorageBytesPercentage = builder.minStorageBytesPercentage;
        }

        @Override
        public final java.lang.String getDelimiter() {
            return this.delimiter;
        }

        @Override
        public final java.lang.Number getMaxDepth() {
            return this.maxDepth;
        }

        @Override
        public final java.lang.Number getMinStorageBytesPercentage() {
            return this.minStorageBytesPercentage;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDelimiter() != null) {
                data.set("delimiter", om.valueToTree(this.getDelimiter()));
            }
            if (this.getMaxDepth() != null) {
                data.set("maxDepth", om.valueToTree(this.getMaxDepth()));
            }
            if (this.getMinStorageBytesPercentage() != null) {
                data.set("minStorageBytesPercentage", om.valueToTree(this.getMinStorageBytesPercentage()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria.Jsii$Proxy that = (S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevelStorageMetricsSelectionCriteria.Jsii$Proxy) o;

            if (this.delimiter != null ? !this.delimiter.equals(that.delimiter) : that.delimiter != null) return false;
            if (this.maxDepth != null ? !this.maxDepth.equals(that.maxDepth) : that.maxDepth != null) return false;
            return this.minStorageBytesPercentage != null ? this.minStorageBytesPercentage.equals(that.minStorageBytesPercentage) : that.minStorageBytesPercentage == null;
        }

        @Override
        public final int hashCode() {
            int result = this.delimiter != null ? this.delimiter.hashCode() : 0;
            result = 31 * result + (this.maxDepth != null ? this.maxDepth.hashCode() : 0);
            result = 31 * result + (this.minStorageBytesPercentage != null ? this.minStorageBytesPercentage.hashCode() : 0);
            return result;
        }
    }
}
