package imports.aws.acmpca_certificate_authority;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.897Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration")
@software.amazon.jsii.Jsii.Proxy(AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration.Jsii$Proxy.class)
public interface AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#custom_cname AcmpcaCertificateAuthority#custom_cname}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomCname() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#expiration_in_days AcmpcaCertificateAuthority#expiration_in_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getExpirationInDays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#s3_bucket_name AcmpcaCertificateAuthority#s3_bucket_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3BucketName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#s3_object_acl AcmpcaCertificateAuthority#s3_object_acl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3ObjectAcl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration> {
        java.lang.String customCname;
        java.lang.Object enabled;
        java.lang.Number expirationInDays;
        java.lang.String s3BucketName;
        java.lang.String s3ObjectAcl;

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration#getCustomCname}
         * @param customCname Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#custom_cname AcmpcaCertificateAuthority#custom_cname}.
         * @return {@code this}
         */
        public Builder customCname(java.lang.String customCname) {
            this.customCname = customCname;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration#getExpirationInDays}
         * @param expirationInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#expiration_in_days AcmpcaCertificateAuthority#expiration_in_days}.
         * @return {@code this}
         */
        public Builder expirationInDays(java.lang.Number expirationInDays) {
            this.expirationInDays = expirationInDays;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration#getS3BucketName}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#s3_bucket_name AcmpcaCertificateAuthority#s3_bucket_name}.
         * @return {@code this}
         */
        public Builder s3BucketName(java.lang.String s3BucketName) {
            this.s3BucketName = s3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration#getS3ObjectAcl}
         * @param s3ObjectAcl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#s3_object_acl AcmpcaCertificateAuthority#s3_object_acl}.
         * @return {@code this}
         */
        public Builder s3ObjectAcl(java.lang.String s3ObjectAcl) {
            this.s3ObjectAcl = s3ObjectAcl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration {
        private final java.lang.String customCname;
        private final java.lang.Object enabled;
        private final java.lang.Number expirationInDays;
        private final java.lang.String s3BucketName;
        private final java.lang.String s3ObjectAcl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customCname = software.amazon.jsii.Kernel.get(this, "customCname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.expirationInDays = software.amazon.jsii.Kernel.get(this, "expirationInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.s3BucketName = software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3ObjectAcl = software.amazon.jsii.Kernel.get(this, "s3ObjectAcl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customCname = builder.customCname;
            this.enabled = builder.enabled;
            this.expirationInDays = builder.expirationInDays;
            this.s3BucketName = builder.s3BucketName;
            this.s3ObjectAcl = builder.s3ObjectAcl;
        }

        @Override
        public final java.lang.String getCustomCname() {
            return this.customCname;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Number getExpirationInDays() {
            return this.expirationInDays;
        }

        @Override
        public final java.lang.String getS3BucketName() {
            return this.s3BucketName;
        }

        @Override
        public final java.lang.String getS3ObjectAcl() {
            return this.s3ObjectAcl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCustomCname() != null) {
                data.set("customCname", om.valueToTree(this.getCustomCname()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getExpirationInDays() != null) {
                data.set("expirationInDays", om.valueToTree(this.getExpirationInDays()));
            }
            if (this.getS3BucketName() != null) {
                data.set("s3BucketName", om.valueToTree(this.getS3BucketName()));
            }
            if (this.getS3ObjectAcl() != null) {
                data.set("s3ObjectAcl", om.valueToTree(this.getS3ObjectAcl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration.Jsii$Proxy that = (AcmpcaCertificateAuthorityRevocationConfigurationCrlConfiguration.Jsii$Proxy) o;

            if (this.customCname != null ? !this.customCname.equals(that.customCname) : that.customCname != null) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.expirationInDays != null ? !this.expirationInDays.equals(that.expirationInDays) : that.expirationInDays != null) return false;
            if (this.s3BucketName != null ? !this.s3BucketName.equals(that.s3BucketName) : that.s3BucketName != null) return false;
            return this.s3ObjectAcl != null ? this.s3ObjectAcl.equals(that.s3ObjectAcl) : that.s3ObjectAcl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customCname != null ? this.customCname.hashCode() : 0;
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.expirationInDays != null ? this.expirationInDays.hashCode() : 0);
            result = 31 * result + (this.s3BucketName != null ? this.s3BucketName.hashCode() : 0);
            result = 31 * result + (this.s3ObjectAcl != null ? this.s3ObjectAcl.hashCode() : 0);
            return result;
        }
    }
}
