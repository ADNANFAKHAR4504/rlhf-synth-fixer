package imports.aws.s3_bucket_logging;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.258Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketLogging.S3BucketLoggingTargetGrant")
@software.amazon.jsii.Jsii.Proxy(S3BucketLoggingTargetGrant.Jsii$Proxy.class)
public interface S3BucketLoggingTargetGrant extends software.amazon.jsii.JsiiSerializable {

    /**
     * grantee block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#grantee S3BucketLoggingA#grantee}
     */
    @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_logging.S3BucketLoggingTargetGrantGrantee getGrantee();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#permission S3BucketLoggingA#permission}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPermission();

    /**
     * @return a {@link Builder} of {@link S3BucketLoggingTargetGrant}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketLoggingTargetGrant}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketLoggingTargetGrant> {
        imports.aws.s3_bucket_logging.S3BucketLoggingTargetGrantGrantee grantee;
        java.lang.String permission;

        /**
         * Sets the value of {@link S3BucketLoggingTargetGrant#getGrantee}
         * @param grantee grantee block. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#grantee S3BucketLoggingA#grantee}
         * @return {@code this}
         */
        public Builder grantee(imports.aws.s3_bucket_logging.S3BucketLoggingTargetGrantGrantee grantee) {
            this.grantee = grantee;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLoggingTargetGrant#getPermission}
         * @param permission Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#permission S3BucketLoggingA#permission}. This parameter is required.
         * @return {@code this}
         */
        public Builder permission(java.lang.String permission) {
            this.permission = permission;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketLoggingTargetGrant}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketLoggingTargetGrant build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketLoggingTargetGrant}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketLoggingTargetGrant {
        private final imports.aws.s3_bucket_logging.S3BucketLoggingTargetGrantGrantee grantee;
        private final java.lang.String permission;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.grantee = software.amazon.jsii.Kernel.get(this, "grantee", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_logging.S3BucketLoggingTargetGrantGrantee.class));
            this.permission = software.amazon.jsii.Kernel.get(this, "permission", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.grantee = java.util.Objects.requireNonNull(builder.grantee, "grantee is required");
            this.permission = java.util.Objects.requireNonNull(builder.permission, "permission is required");
        }

        @Override
        public final imports.aws.s3_bucket_logging.S3BucketLoggingTargetGrantGrantee getGrantee() {
            return this.grantee;
        }

        @Override
        public final java.lang.String getPermission() {
            return this.permission;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("grantee", om.valueToTree(this.getGrantee()));
            data.set("permission", om.valueToTree(this.getPermission()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketLogging.S3BucketLoggingTargetGrant"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketLoggingTargetGrant.Jsii$Proxy that = (S3BucketLoggingTargetGrant.Jsii$Proxy) o;

            if (!grantee.equals(that.grantee)) return false;
            return this.permission.equals(that.permission);
        }

        @Override
        public final int hashCode() {
            int result = this.grantee.hashCode();
            result = 31 * result + (this.permission.hashCode());
            return result;
        }
    }
}
