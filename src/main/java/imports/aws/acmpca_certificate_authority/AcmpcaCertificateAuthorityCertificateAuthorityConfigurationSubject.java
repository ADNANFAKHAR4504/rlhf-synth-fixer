package imports.aws.acmpca_certificate_authority;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.896Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject")
@software.amazon.jsii.Jsii.Proxy(AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject.Jsii$Proxy.class)
public interface AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#common_name AcmpcaCertificateAuthority#common_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCommonName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#country AcmpcaCertificateAuthority#country}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCountry() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#distinguished_name_qualifier AcmpcaCertificateAuthority#distinguished_name_qualifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDistinguishedNameQualifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#generation_qualifier AcmpcaCertificateAuthority#generation_qualifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGenerationQualifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#given_name AcmpcaCertificateAuthority#given_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGivenName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#initials AcmpcaCertificateAuthority#initials}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInitials() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#locality AcmpcaCertificateAuthority#locality}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocality() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#organization AcmpcaCertificateAuthority#organization}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOrganization() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#organizational_unit AcmpcaCertificateAuthority#organizational_unit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOrganizationalUnit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#pseudonym AcmpcaCertificateAuthority#pseudonym}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPseudonym() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#state AcmpcaCertificateAuthority#state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getState() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#surname AcmpcaCertificateAuthority#surname}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSurname() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#title AcmpcaCertificateAuthority#title}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTitle() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject> {
        java.lang.String commonName;
        java.lang.String country;
        java.lang.String distinguishedNameQualifier;
        java.lang.String generationQualifier;
        java.lang.String givenName;
        java.lang.String initials;
        java.lang.String locality;
        java.lang.String organization;
        java.lang.String organizationalUnit;
        java.lang.String pseudonym;
        java.lang.String state;
        java.lang.String surname;
        java.lang.String title;

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getCommonName}
         * @param commonName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#common_name AcmpcaCertificateAuthority#common_name}.
         * @return {@code this}
         */
        public Builder commonName(java.lang.String commonName) {
            this.commonName = commonName;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getCountry}
         * @param country Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#country AcmpcaCertificateAuthority#country}.
         * @return {@code this}
         */
        public Builder country(java.lang.String country) {
            this.country = country;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getDistinguishedNameQualifier}
         * @param distinguishedNameQualifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#distinguished_name_qualifier AcmpcaCertificateAuthority#distinguished_name_qualifier}.
         * @return {@code this}
         */
        public Builder distinguishedNameQualifier(java.lang.String distinguishedNameQualifier) {
            this.distinguishedNameQualifier = distinguishedNameQualifier;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getGenerationQualifier}
         * @param generationQualifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#generation_qualifier AcmpcaCertificateAuthority#generation_qualifier}.
         * @return {@code this}
         */
        public Builder generationQualifier(java.lang.String generationQualifier) {
            this.generationQualifier = generationQualifier;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getGivenName}
         * @param givenName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#given_name AcmpcaCertificateAuthority#given_name}.
         * @return {@code this}
         */
        public Builder givenName(java.lang.String givenName) {
            this.givenName = givenName;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getInitials}
         * @param initials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#initials AcmpcaCertificateAuthority#initials}.
         * @return {@code this}
         */
        public Builder initials(java.lang.String initials) {
            this.initials = initials;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getLocality}
         * @param locality Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#locality AcmpcaCertificateAuthority#locality}.
         * @return {@code this}
         */
        public Builder locality(java.lang.String locality) {
            this.locality = locality;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getOrganization}
         * @param organization Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#organization AcmpcaCertificateAuthority#organization}.
         * @return {@code this}
         */
        public Builder organization(java.lang.String organization) {
            this.organization = organization;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getOrganizationalUnit}
         * @param organizationalUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#organizational_unit AcmpcaCertificateAuthority#organizational_unit}.
         * @return {@code this}
         */
        public Builder organizationalUnit(java.lang.String organizationalUnit) {
            this.organizationalUnit = organizationalUnit;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getPseudonym}
         * @param pseudonym Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#pseudonym AcmpcaCertificateAuthority#pseudonym}.
         * @return {@code this}
         */
        public Builder pseudonym(java.lang.String pseudonym) {
            this.pseudonym = pseudonym;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getState}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#state AcmpcaCertificateAuthority#state}.
         * @return {@code this}
         */
        public Builder state(java.lang.String state) {
            this.state = state;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getSurname}
         * @param surname Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#surname AcmpcaCertificateAuthority#surname}.
         * @return {@code this}
         */
        public Builder surname(java.lang.String surname) {
            this.surname = surname;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject#getTitle}
         * @param title Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#title AcmpcaCertificateAuthority#title}.
         * @return {@code this}
         */
        public Builder title(java.lang.String title) {
            this.title = title;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject {
        private final java.lang.String commonName;
        private final java.lang.String country;
        private final java.lang.String distinguishedNameQualifier;
        private final java.lang.String generationQualifier;
        private final java.lang.String givenName;
        private final java.lang.String initials;
        private final java.lang.String locality;
        private final java.lang.String organization;
        private final java.lang.String organizationalUnit;
        private final java.lang.String pseudonym;
        private final java.lang.String state;
        private final java.lang.String surname;
        private final java.lang.String title;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.commonName = software.amazon.jsii.Kernel.get(this, "commonName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.country = software.amazon.jsii.Kernel.get(this, "country", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.distinguishedNameQualifier = software.amazon.jsii.Kernel.get(this, "distinguishedNameQualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.generationQualifier = software.amazon.jsii.Kernel.get(this, "generationQualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.givenName = software.amazon.jsii.Kernel.get(this, "givenName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.initials = software.amazon.jsii.Kernel.get(this, "initials", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.locality = software.amazon.jsii.Kernel.get(this, "locality", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.organization = software.amazon.jsii.Kernel.get(this, "organization", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.organizationalUnit = software.amazon.jsii.Kernel.get(this, "organizationalUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pseudonym = software.amazon.jsii.Kernel.get(this, "pseudonym", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.state = software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.surname = software.amazon.jsii.Kernel.get(this, "surname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.title = software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.commonName = builder.commonName;
            this.country = builder.country;
            this.distinguishedNameQualifier = builder.distinguishedNameQualifier;
            this.generationQualifier = builder.generationQualifier;
            this.givenName = builder.givenName;
            this.initials = builder.initials;
            this.locality = builder.locality;
            this.organization = builder.organization;
            this.organizationalUnit = builder.organizationalUnit;
            this.pseudonym = builder.pseudonym;
            this.state = builder.state;
            this.surname = builder.surname;
            this.title = builder.title;
        }

        @Override
        public final java.lang.String getCommonName() {
            return this.commonName;
        }

        @Override
        public final java.lang.String getCountry() {
            return this.country;
        }

        @Override
        public final java.lang.String getDistinguishedNameQualifier() {
            return this.distinguishedNameQualifier;
        }

        @Override
        public final java.lang.String getGenerationQualifier() {
            return this.generationQualifier;
        }

        @Override
        public final java.lang.String getGivenName() {
            return this.givenName;
        }

        @Override
        public final java.lang.String getInitials() {
            return this.initials;
        }

        @Override
        public final java.lang.String getLocality() {
            return this.locality;
        }

        @Override
        public final java.lang.String getOrganization() {
            return this.organization;
        }

        @Override
        public final java.lang.String getOrganizationalUnit() {
            return this.organizationalUnit;
        }

        @Override
        public final java.lang.String getPseudonym() {
            return this.pseudonym;
        }

        @Override
        public final java.lang.String getState() {
            return this.state;
        }

        @Override
        public final java.lang.String getSurname() {
            return this.surname;
        }

        @Override
        public final java.lang.String getTitle() {
            return this.title;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCommonName() != null) {
                data.set("commonName", om.valueToTree(this.getCommonName()));
            }
            if (this.getCountry() != null) {
                data.set("country", om.valueToTree(this.getCountry()));
            }
            if (this.getDistinguishedNameQualifier() != null) {
                data.set("distinguishedNameQualifier", om.valueToTree(this.getDistinguishedNameQualifier()));
            }
            if (this.getGenerationQualifier() != null) {
                data.set("generationQualifier", om.valueToTree(this.getGenerationQualifier()));
            }
            if (this.getGivenName() != null) {
                data.set("givenName", om.valueToTree(this.getGivenName()));
            }
            if (this.getInitials() != null) {
                data.set("initials", om.valueToTree(this.getInitials()));
            }
            if (this.getLocality() != null) {
                data.set("locality", om.valueToTree(this.getLocality()));
            }
            if (this.getOrganization() != null) {
                data.set("organization", om.valueToTree(this.getOrganization()));
            }
            if (this.getOrganizationalUnit() != null) {
                data.set("organizationalUnit", om.valueToTree(this.getOrganizationalUnit()));
            }
            if (this.getPseudonym() != null) {
                data.set("pseudonym", om.valueToTree(this.getPseudonym()));
            }
            if (this.getState() != null) {
                data.set("state", om.valueToTree(this.getState()));
            }
            if (this.getSurname() != null) {
                data.set("surname", om.valueToTree(this.getSurname()));
            }
            if (this.getTitle() != null) {
                data.set("title", om.valueToTree(this.getTitle()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject.Jsii$Proxy that = (AcmpcaCertificateAuthorityCertificateAuthorityConfigurationSubject.Jsii$Proxy) o;

            if (this.commonName != null ? !this.commonName.equals(that.commonName) : that.commonName != null) return false;
            if (this.country != null ? !this.country.equals(that.country) : that.country != null) return false;
            if (this.distinguishedNameQualifier != null ? !this.distinguishedNameQualifier.equals(that.distinguishedNameQualifier) : that.distinguishedNameQualifier != null) return false;
            if (this.generationQualifier != null ? !this.generationQualifier.equals(that.generationQualifier) : that.generationQualifier != null) return false;
            if (this.givenName != null ? !this.givenName.equals(that.givenName) : that.givenName != null) return false;
            if (this.initials != null ? !this.initials.equals(that.initials) : that.initials != null) return false;
            if (this.locality != null ? !this.locality.equals(that.locality) : that.locality != null) return false;
            if (this.organization != null ? !this.organization.equals(that.organization) : that.organization != null) return false;
            if (this.organizationalUnit != null ? !this.organizationalUnit.equals(that.organizationalUnit) : that.organizationalUnit != null) return false;
            if (this.pseudonym != null ? !this.pseudonym.equals(that.pseudonym) : that.pseudonym != null) return false;
            if (this.state != null ? !this.state.equals(that.state) : that.state != null) return false;
            if (this.surname != null ? !this.surname.equals(that.surname) : that.surname != null) return false;
            return this.title != null ? this.title.equals(that.title) : that.title == null;
        }

        @Override
        public final int hashCode() {
            int result = this.commonName != null ? this.commonName.hashCode() : 0;
            result = 31 * result + (this.country != null ? this.country.hashCode() : 0);
            result = 31 * result + (this.distinguishedNameQualifier != null ? this.distinguishedNameQualifier.hashCode() : 0);
            result = 31 * result + (this.generationQualifier != null ? this.generationQualifier.hashCode() : 0);
            result = 31 * result + (this.givenName != null ? this.givenName.hashCode() : 0);
            result = 31 * result + (this.initials != null ? this.initials.hashCode() : 0);
            result = 31 * result + (this.locality != null ? this.locality.hashCode() : 0);
            result = 31 * result + (this.organization != null ? this.organization.hashCode() : 0);
            result = 31 * result + (this.organizationalUnit != null ? this.organizationalUnit.hashCode() : 0);
            result = 31 * result + (this.pseudonym != null ? this.pseudonym.hashCode() : 0);
            result = 31 * result + (this.state != null ? this.state.hashCode() : 0);
            result = 31 * result + (this.surname != null ? this.surname.hashCode() : 0);
            result = 31 * result + (this.title != null ? this.title.hashCode() : 0);
            return result;
        }
    }
}
