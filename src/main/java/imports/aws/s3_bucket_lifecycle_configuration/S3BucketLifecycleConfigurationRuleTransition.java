package imports.aws.s3_bucket_lifecycle_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.257Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfigurationRuleTransition")
@software.amazon.jsii.Jsii.Proxy(S3BucketLifecycleConfigurationRuleTransition.Jsii$Proxy.class)
public interface S3BucketLifecycleConfigurationRuleTransition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#storage_class S3BucketLifecycleConfiguration#storage_class}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStorageClass();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#date S3BucketLifecycleConfiguration#date}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#days S3BucketLifecycleConfiguration#days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDays() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketLifecycleConfigurationRuleTransition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketLifecycleConfigurationRuleTransition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketLifecycleConfigurationRuleTransition> {
        java.lang.String storageClass;
        java.lang.String date;
        java.lang.Number days;

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRuleTransition#getStorageClass}
         * @param storageClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#storage_class S3BucketLifecycleConfiguration#storage_class}. This parameter is required.
         * @return {@code this}
         */
        public Builder storageClass(java.lang.String storageClass) {
            this.storageClass = storageClass;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRuleTransition#getDate}
         * @param date Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#date S3BucketLifecycleConfiguration#date}.
         * @return {@code this}
         */
        public Builder date(java.lang.String date) {
            this.date = date;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLifecycleConfigurationRuleTransition#getDays}
         * @param days Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_lifecycle_configuration#days S3BucketLifecycleConfiguration#days}.
         * @return {@code this}
         */
        public Builder days(java.lang.Number days) {
            this.days = days;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketLifecycleConfigurationRuleTransition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketLifecycleConfigurationRuleTransition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketLifecycleConfigurationRuleTransition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketLifecycleConfigurationRuleTransition {
        private final java.lang.String storageClass;
        private final java.lang.String date;
        private final java.lang.Number days;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.storageClass = software.amazon.jsii.Kernel.get(this, "storageClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.date = software.amazon.jsii.Kernel.get(this, "date", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.days = software.amazon.jsii.Kernel.get(this, "days", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.storageClass = java.util.Objects.requireNonNull(builder.storageClass, "storageClass is required");
            this.date = builder.date;
            this.days = builder.days;
        }

        @Override
        public final java.lang.String getStorageClass() {
            return this.storageClass;
        }

        @Override
        public final java.lang.String getDate() {
            return this.date;
        }

        @Override
        public final java.lang.Number getDays() {
            return this.days;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("storageClass", om.valueToTree(this.getStorageClass()));
            if (this.getDate() != null) {
                data.set("date", om.valueToTree(this.getDate()));
            }
            if (this.getDays() != null) {
                data.set("days", om.valueToTree(this.getDays()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfigurationRuleTransition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketLifecycleConfigurationRuleTransition.Jsii$Proxy that = (S3BucketLifecycleConfigurationRuleTransition.Jsii$Proxy) o;

            if (!storageClass.equals(that.storageClass)) return false;
            if (this.date != null ? !this.date.equals(that.date) : that.date != null) return false;
            return this.days != null ? this.days.equals(that.days) : that.days == null;
        }

        @Override
        public final int hashCode() {
            int result = this.storageClass.hashCode();
            result = 31 * result + (this.date != null ? this.date.hashCode() : 0);
            result = 31 * result + (this.days != null ? this.days.hashCode() : 0);
            return result;
        }
    }
}
