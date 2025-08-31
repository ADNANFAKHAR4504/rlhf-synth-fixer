package imports.aws.s3_bucket_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.249Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketAcl.S3BucketAclAccessControlPolicy")
@software.amazon.jsii.Jsii.Proxy(S3BucketAclAccessControlPolicy.Jsii$Proxy.class)
public interface S3BucketAclAccessControlPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * owner block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_acl#owner S3BucketAcl#owner}
     */
    @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyOwner getOwner();

    /**
     * grant block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_acl#grant S3BucketAcl#grant}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGrant() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketAclAccessControlPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketAclAccessControlPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketAclAccessControlPolicy> {
        imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyOwner owner;
        java.lang.Object grant;

        /**
         * Sets the value of {@link S3BucketAclAccessControlPolicy#getOwner}
         * @param owner owner block. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_acl#owner S3BucketAcl#owner}
         * @return {@code this}
         */
        public Builder owner(imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyOwner owner) {
            this.owner = owner;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketAclAccessControlPolicy#getGrant}
         * @param grant grant block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_acl#grant S3BucketAcl#grant}
         * @return {@code this}
         */
        public Builder grant(com.hashicorp.cdktf.IResolvable grant) {
            this.grant = grant;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketAclAccessControlPolicy#getGrant}
         * @param grant grant block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_acl#grant S3BucketAcl#grant}
         * @return {@code this}
         */
        public Builder grant(java.util.List<? extends imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyGrant> grant) {
            this.grant = grant;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketAclAccessControlPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketAclAccessControlPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketAclAccessControlPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketAclAccessControlPolicy {
        private final imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyOwner owner;
        private final java.lang.Object grant;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.owner = software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyOwner.class));
            this.grant = software.amazon.jsii.Kernel.get(this, "grant", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.owner = java.util.Objects.requireNonNull(builder.owner, "owner is required");
            this.grant = builder.grant;
        }

        @Override
        public final imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyOwner getOwner() {
            return this.owner;
        }

        @Override
        public final java.lang.Object getGrant() {
            return this.grant;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("owner", om.valueToTree(this.getOwner()));
            if (this.getGrant() != null) {
                data.set("grant", om.valueToTree(this.getGrant()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketAcl.S3BucketAclAccessControlPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketAclAccessControlPolicy.Jsii$Proxy that = (S3BucketAclAccessControlPolicy.Jsii$Proxy) o;

            if (!owner.equals(that.owner)) return false;
            return this.grant != null ? this.grant.equals(that.grant) : that.grant == null;
        }

        @Override
        public final int hashCode() {
            int result = this.owner.hashCode();
            result = 31 * result + (this.grant != null ? this.grant.hashCode() : 0);
            return result;
        }
    }
}
