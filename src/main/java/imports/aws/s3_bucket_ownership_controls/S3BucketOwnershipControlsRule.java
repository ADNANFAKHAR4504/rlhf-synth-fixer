package imports.aws.s3_bucket_ownership_controls;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.264Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketOwnershipControls.S3BucketOwnershipControlsRule")
@software.amazon.jsii.Jsii.Proxy(S3BucketOwnershipControlsRule.Jsii$Proxy.class)
public interface S3BucketOwnershipControlsRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_ownership_controls#object_ownership S3BucketOwnershipControls#object_ownership}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getObjectOwnership();

    /**
     * @return a {@link Builder} of {@link S3BucketOwnershipControlsRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketOwnershipControlsRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketOwnershipControlsRule> {
        java.lang.String objectOwnership;

        /**
         * Sets the value of {@link S3BucketOwnershipControlsRule#getObjectOwnership}
         * @param objectOwnership Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_ownership_controls#object_ownership S3BucketOwnershipControls#object_ownership}. This parameter is required.
         * @return {@code this}
         */
        public Builder objectOwnership(java.lang.String objectOwnership) {
            this.objectOwnership = objectOwnership;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketOwnershipControlsRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketOwnershipControlsRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketOwnershipControlsRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketOwnershipControlsRule {
        private final java.lang.String objectOwnership;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.objectOwnership = software.amazon.jsii.Kernel.get(this, "objectOwnership", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.objectOwnership = java.util.Objects.requireNonNull(builder.objectOwnership, "objectOwnership is required");
        }

        @Override
        public final java.lang.String getObjectOwnership() {
            return this.objectOwnership;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("objectOwnership", om.valueToTree(this.getObjectOwnership()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketOwnershipControls.S3BucketOwnershipControlsRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketOwnershipControlsRule.Jsii$Proxy that = (S3BucketOwnershipControlsRule.Jsii$Proxy) o;

            return this.objectOwnership.equals(that.objectOwnership);
        }

        @Override
        public final int hashCode() {
            int result = this.objectOwnership.hashCode();
            return result;
        }
    }
}
