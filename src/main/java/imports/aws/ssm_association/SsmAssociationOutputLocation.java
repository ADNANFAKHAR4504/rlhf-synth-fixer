package imports.aws.ssm_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.495Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmAssociation.SsmAssociationOutputLocation")
@software.amazon.jsii.Jsii.Proxy(SsmAssociationOutputLocation.Jsii$Proxy.class)
public interface SsmAssociationOutputLocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#s3_bucket_name SsmAssociation#s3_bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#s3_key_prefix SsmAssociation#s3_key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3KeyPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#s3_region SsmAssociation#s3_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Region() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmAssociationOutputLocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmAssociationOutputLocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmAssociationOutputLocation> {
        java.lang.String s3BucketName;
        java.lang.String s3KeyPrefix;
        java.lang.String s3Region;

        /**
         * Sets the value of {@link SsmAssociationOutputLocation#getS3BucketName}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#s3_bucket_name SsmAssociation#s3_bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3BucketName(java.lang.String s3BucketName) {
            this.s3BucketName = s3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationOutputLocation#getS3KeyPrefix}
         * @param s3KeyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#s3_key_prefix SsmAssociation#s3_key_prefix}.
         * @return {@code this}
         */
        public Builder s3KeyPrefix(java.lang.String s3KeyPrefix) {
            this.s3KeyPrefix = s3KeyPrefix;
            return this;
        }

        /**
         * Sets the value of {@link SsmAssociationOutputLocation#getS3Region}
         * @param s3Region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#s3_region SsmAssociation#s3_region}.
         * @return {@code this}
         */
        public Builder s3Region(java.lang.String s3Region) {
            this.s3Region = s3Region;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmAssociationOutputLocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmAssociationOutputLocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmAssociationOutputLocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmAssociationOutputLocation {
        private final java.lang.String s3BucketName;
        private final java.lang.String s3KeyPrefix;
        private final java.lang.String s3Region;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3BucketName = software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3KeyPrefix = software.amazon.jsii.Kernel.get(this, "s3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Region = software.amazon.jsii.Kernel.get(this, "s3Region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3BucketName = java.util.Objects.requireNonNull(builder.s3BucketName, "s3BucketName is required");
            this.s3KeyPrefix = builder.s3KeyPrefix;
            this.s3Region = builder.s3Region;
        }

        @Override
        public final java.lang.String getS3BucketName() {
            return this.s3BucketName;
        }

        @Override
        public final java.lang.String getS3KeyPrefix() {
            return this.s3KeyPrefix;
        }

        @Override
        public final java.lang.String getS3Region() {
            return this.s3Region;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3BucketName", om.valueToTree(this.getS3BucketName()));
            if (this.getS3KeyPrefix() != null) {
                data.set("s3KeyPrefix", om.valueToTree(this.getS3KeyPrefix()));
            }
            if (this.getS3Region() != null) {
                data.set("s3Region", om.valueToTree(this.getS3Region()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmAssociation.SsmAssociationOutputLocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmAssociationOutputLocation.Jsii$Proxy that = (SsmAssociationOutputLocation.Jsii$Proxy) o;

            if (!s3BucketName.equals(that.s3BucketName)) return false;
            if (this.s3KeyPrefix != null ? !this.s3KeyPrefix.equals(that.s3KeyPrefix) : that.s3KeyPrefix != null) return false;
            return this.s3Region != null ? this.s3Region.equals(that.s3Region) : that.s3Region == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3BucketName.hashCode();
            result = 31 * result + (this.s3KeyPrefix != null ? this.s3KeyPrefix.hashCode() : 0);
            result = 31 * result + (this.s3Region != null ? this.s3Region.hashCode() : 0);
            return result;
        }
    }
}
