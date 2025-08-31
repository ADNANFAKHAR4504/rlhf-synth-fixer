package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.247Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects")
@software.amazon.jsii.Jsii.Proxy(S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects.Jsii$Proxy.class)
public interface S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#enabled S3Bucket#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * @return a {@link Builder} of {@link S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects> {
        java.lang.Object enabled;

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#enabled S3Bucket#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#enabled S3Bucket#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects {
        private final java.lang.Object enabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3Bucket.S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects.Jsii$Proxy that = (S3BucketReplicationConfigurationRulesSourceSelectionCriteriaSseKmsEncryptedObjects.Jsii$Proxy) o;

            return this.enabled.equals(that.enabled);
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            return result;
        }
    }
}
