package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.247Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation")
@software.amazon.jsii.Jsii.Proxy(S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation.Jsii$Proxy.class)
public interface S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#owner S3Bucket#owner}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOwner();

    /**
     * @return a {@link Builder} of {@link S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation> {
        java.lang.String owner;

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation#getOwner}
         * @param owner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#owner S3Bucket#owner}. This parameter is required.
         * @return {@code this}
         */
        public Builder owner(java.lang.String owner) {
            this.owner = owner;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation {
        private final java.lang.String owner;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.owner = software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.owner = java.util.Objects.requireNonNull(builder.owner, "owner is required");
        }

        @Override
        public final java.lang.String getOwner() {
            return this.owner;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("owner", om.valueToTree(this.getOwner()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3Bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation.Jsii$Proxy that = (S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation.Jsii$Proxy) o;

            return this.owner.equals(that.owner);
        }

        @Override
        public final int hashCode() {
            int result = this.owner.hashCode();
            return result;
        }
    }
}
