package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.246Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketObjectLockConfiguration")
@software.amazon.jsii.Jsii.Proxy(S3BucketObjectLockConfiguration.Jsii$Proxy.class)
public interface S3BucketObjectLockConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#object_lock_enabled S3Bucket#object_lock_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObjectLockEnabled() {
        return null;
    }

    /**
     * rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#rule S3Bucket#rule}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketObjectLockConfigurationRule getRule() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketObjectLockConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketObjectLockConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketObjectLockConfiguration> {
        java.lang.String objectLockEnabled;
        imports.aws.s3_bucket.S3BucketObjectLockConfigurationRule rule;

        /**
         * Sets the value of {@link S3BucketObjectLockConfiguration#getObjectLockEnabled}
         * @param objectLockEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#object_lock_enabled S3Bucket#object_lock_enabled}.
         * @return {@code this}
         */
        public Builder objectLockEnabled(java.lang.String objectLockEnabled) {
            this.objectLockEnabled = objectLockEnabled;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectLockConfiguration#getRule}
         * @param rule rule block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#rule S3Bucket#rule}
         * @return {@code this}
         */
        public Builder rule(imports.aws.s3_bucket.S3BucketObjectLockConfigurationRule rule) {
            this.rule = rule;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketObjectLockConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketObjectLockConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketObjectLockConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketObjectLockConfiguration {
        private final java.lang.String objectLockEnabled;
        private final imports.aws.s3_bucket.S3BucketObjectLockConfigurationRule rule;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.objectLockEnabled = software.amazon.jsii.Kernel.get(this, "objectLockEnabled", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rule = software.amazon.jsii.Kernel.get(this, "rule", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketObjectLockConfigurationRule.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.objectLockEnabled = builder.objectLockEnabled;
            this.rule = builder.rule;
        }

        @Override
        public final java.lang.String getObjectLockEnabled() {
            return this.objectLockEnabled;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketObjectLockConfigurationRule getRule() {
            return this.rule;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getObjectLockEnabled() != null) {
                data.set("objectLockEnabled", om.valueToTree(this.getObjectLockEnabled()));
            }
            if (this.getRule() != null) {
                data.set("rule", om.valueToTree(this.getRule()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3Bucket.S3BucketObjectLockConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketObjectLockConfiguration.Jsii$Proxy that = (S3BucketObjectLockConfiguration.Jsii$Proxy) o;

            if (this.objectLockEnabled != null ? !this.objectLockEnabled.equals(that.objectLockEnabled) : that.objectLockEnabled != null) return false;
            return this.rule != null ? this.rule.equals(that.rule) : that.rule == null;
        }

        @Override
        public final int hashCode() {
            int result = this.objectLockEnabled != null ? this.objectLockEnabled.hashCode() : 0;
            result = 31 * result + (this.rule != null ? this.rule.hashCode() : 0);
            return result;
        }
    }
}
