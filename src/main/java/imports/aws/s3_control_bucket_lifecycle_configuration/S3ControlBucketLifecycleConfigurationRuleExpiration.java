package imports.aws.s3_control_bucket_lifecycle_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.276Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlBucketLifecycleConfiguration.S3ControlBucketLifecycleConfigurationRuleExpiration")
@software.amazon.jsii.Jsii.Proxy(S3ControlBucketLifecycleConfigurationRuleExpiration.Jsii$Proxy.class)
public interface S3ControlBucketLifecycleConfigurationRuleExpiration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#date S3ControlBucketLifecycleConfiguration#date}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#days S3ControlBucketLifecycleConfiguration#days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#expired_object_delete_marker S3ControlBucketLifecycleConfiguration#expired_object_delete_marker}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExpiredObjectDeleteMarker() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlBucketLifecycleConfigurationRuleExpiration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlBucketLifecycleConfigurationRuleExpiration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlBucketLifecycleConfigurationRuleExpiration> {
        java.lang.String date;
        java.lang.Number days;
        java.lang.Object expiredObjectDeleteMarker;

        /**
         * Sets the value of {@link S3ControlBucketLifecycleConfigurationRuleExpiration#getDate}
         * @param date Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#date S3ControlBucketLifecycleConfiguration#date}.
         * @return {@code this}
         */
        public Builder date(java.lang.String date) {
            this.date = date;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlBucketLifecycleConfigurationRuleExpiration#getDays}
         * @param days Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#days S3ControlBucketLifecycleConfiguration#days}.
         * @return {@code this}
         */
        public Builder days(java.lang.Number days) {
            this.days = days;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlBucketLifecycleConfigurationRuleExpiration#getExpiredObjectDeleteMarker}
         * @param expiredObjectDeleteMarker Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#expired_object_delete_marker S3ControlBucketLifecycleConfiguration#expired_object_delete_marker}.
         * @return {@code this}
         */
        public Builder expiredObjectDeleteMarker(java.lang.Boolean expiredObjectDeleteMarker) {
            this.expiredObjectDeleteMarker = expiredObjectDeleteMarker;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlBucketLifecycleConfigurationRuleExpiration#getExpiredObjectDeleteMarker}
         * @param expiredObjectDeleteMarker Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_bucket_lifecycle_configuration#expired_object_delete_marker S3ControlBucketLifecycleConfiguration#expired_object_delete_marker}.
         * @return {@code this}
         */
        public Builder expiredObjectDeleteMarker(com.hashicorp.cdktf.IResolvable expiredObjectDeleteMarker) {
            this.expiredObjectDeleteMarker = expiredObjectDeleteMarker;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlBucketLifecycleConfigurationRuleExpiration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlBucketLifecycleConfigurationRuleExpiration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlBucketLifecycleConfigurationRuleExpiration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlBucketLifecycleConfigurationRuleExpiration {
        private final java.lang.String date;
        private final java.lang.Number days;
        private final java.lang.Object expiredObjectDeleteMarker;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.date = software.amazon.jsii.Kernel.get(this, "date", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.days = software.amazon.jsii.Kernel.get(this, "days", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.expiredObjectDeleteMarker = software.amazon.jsii.Kernel.get(this, "expiredObjectDeleteMarker", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.date = builder.date;
            this.days = builder.days;
            this.expiredObjectDeleteMarker = builder.expiredObjectDeleteMarker;
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
        public final java.lang.Object getExpiredObjectDeleteMarker() {
            return this.expiredObjectDeleteMarker;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDate() != null) {
                data.set("date", om.valueToTree(this.getDate()));
            }
            if (this.getDays() != null) {
                data.set("days", om.valueToTree(this.getDays()));
            }
            if (this.getExpiredObjectDeleteMarker() != null) {
                data.set("expiredObjectDeleteMarker", om.valueToTree(this.getExpiredObjectDeleteMarker()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlBucketLifecycleConfiguration.S3ControlBucketLifecycleConfigurationRuleExpiration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlBucketLifecycleConfigurationRuleExpiration.Jsii$Proxy that = (S3ControlBucketLifecycleConfigurationRuleExpiration.Jsii$Proxy) o;

            if (this.date != null ? !this.date.equals(that.date) : that.date != null) return false;
            if (this.days != null ? !this.days.equals(that.days) : that.days != null) return false;
            return this.expiredObjectDeleteMarker != null ? this.expiredObjectDeleteMarker.equals(that.expiredObjectDeleteMarker) : that.expiredObjectDeleteMarker == null;
        }

        @Override
        public final int hashCode() {
            int result = this.date != null ? this.date.hashCode() : 0;
            result = 31 * result + (this.days != null ? this.days.hashCode() : 0);
            result = 31 * result + (this.expiredObjectDeleteMarker != null ? this.expiredObjectDeleteMarker.hashCode() : 0);
            return result;
        }
    }
}
