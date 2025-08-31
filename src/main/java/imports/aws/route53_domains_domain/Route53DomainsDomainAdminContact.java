package imports.aws.route53_domains_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.197Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53DomainsDomain.Route53DomainsDomainAdminContact")
@software.amazon.jsii.Jsii.Proxy(Route53DomainsDomainAdminContact.Jsii$Proxy.class)
public interface Route53DomainsDomainAdminContact extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_1 Route53DomainsDomain#address_line_1}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAddressLine1() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_2 Route53DomainsDomain#address_line_2}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAddressLine2() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#city Route53DomainsDomain#city}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#contact_type Route53DomainsDomain#contact_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContactType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#country_code Route53DomainsDomain#country_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCountryCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#email Route53DomainsDomain#email}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEmail() {
        return null;
    }

    /**
     * extra_param block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#extra_param Route53DomainsDomain#extra_param}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExtraParam() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#fax Route53DomainsDomain#fax}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFax() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#first_name Route53DomainsDomain#first_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFirstName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#last_name Route53DomainsDomain#last_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLastName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#organization_name Route53DomainsDomain#organization_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOrganizationName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#phone_number Route53DomainsDomain#phone_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPhoneNumber() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#state Route53DomainsDomain#state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getState() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#zip_code Route53DomainsDomain#zip_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getZipCode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53DomainsDomainAdminContact}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53DomainsDomainAdminContact}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53DomainsDomainAdminContact> {
        java.lang.String addressLine1;
        java.lang.String addressLine2;
        java.lang.String city;
        java.lang.String contactType;
        java.lang.String countryCode;
        java.lang.String email;
        java.lang.Object extraParam;
        java.lang.String fax;
        java.lang.String firstName;
        java.lang.String lastName;
        java.lang.String organizationName;
        java.lang.String phoneNumber;
        java.lang.String state;
        java.lang.String zipCode;

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getAddressLine1}
         * @param addressLine1 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_1 Route53DomainsDomain#address_line_1}.
         * @return {@code this}
         */
        public Builder addressLine1(java.lang.String addressLine1) {
            this.addressLine1 = addressLine1;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getAddressLine2}
         * @param addressLine2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#address_line_2 Route53DomainsDomain#address_line_2}.
         * @return {@code this}
         */
        public Builder addressLine2(java.lang.String addressLine2) {
            this.addressLine2 = addressLine2;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getCity}
         * @param city Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#city Route53DomainsDomain#city}.
         * @return {@code this}
         */
        public Builder city(java.lang.String city) {
            this.city = city;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getContactType}
         * @param contactType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#contact_type Route53DomainsDomain#contact_type}.
         * @return {@code this}
         */
        public Builder contactType(java.lang.String contactType) {
            this.contactType = contactType;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getCountryCode}
         * @param countryCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#country_code Route53DomainsDomain#country_code}.
         * @return {@code this}
         */
        public Builder countryCode(java.lang.String countryCode) {
            this.countryCode = countryCode;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getEmail}
         * @param email Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#email Route53DomainsDomain#email}.
         * @return {@code this}
         */
        public Builder email(java.lang.String email) {
            this.email = email;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getExtraParam}
         * @param extraParam extra_param block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#extra_param Route53DomainsDomain#extra_param}
         * @return {@code this}
         */
        public Builder extraParam(com.hashicorp.cdktf.IResolvable extraParam) {
            this.extraParam = extraParam;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getExtraParam}
         * @param extraParam extra_param block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#extra_param Route53DomainsDomain#extra_param}
         * @return {@code this}
         */
        public Builder extraParam(java.util.List<? extends imports.aws.route53_domains_domain.Route53DomainsDomainAdminContactExtraParam> extraParam) {
            this.extraParam = extraParam;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getFax}
         * @param fax Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#fax Route53DomainsDomain#fax}.
         * @return {@code this}
         */
        public Builder fax(java.lang.String fax) {
            this.fax = fax;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getFirstName}
         * @param firstName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#first_name Route53DomainsDomain#first_name}.
         * @return {@code this}
         */
        public Builder firstName(java.lang.String firstName) {
            this.firstName = firstName;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getLastName}
         * @param lastName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#last_name Route53DomainsDomain#last_name}.
         * @return {@code this}
         */
        public Builder lastName(java.lang.String lastName) {
            this.lastName = lastName;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getOrganizationName}
         * @param organizationName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#organization_name Route53DomainsDomain#organization_name}.
         * @return {@code this}
         */
        public Builder organizationName(java.lang.String organizationName) {
            this.organizationName = organizationName;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getPhoneNumber}
         * @param phoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#phone_number Route53DomainsDomain#phone_number}.
         * @return {@code this}
         */
        public Builder phoneNumber(java.lang.String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getState}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#state Route53DomainsDomain#state}.
         * @return {@code this}
         */
        public Builder state(java.lang.String state) {
            this.state = state;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainAdminContact#getZipCode}
         * @param zipCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#zip_code Route53DomainsDomain#zip_code}.
         * @return {@code this}
         */
        public Builder zipCode(java.lang.String zipCode) {
            this.zipCode = zipCode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53DomainsDomainAdminContact}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53DomainsDomainAdminContact build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53DomainsDomainAdminContact}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53DomainsDomainAdminContact {
        private final java.lang.String addressLine1;
        private final java.lang.String addressLine2;
        private final java.lang.String city;
        private final java.lang.String contactType;
        private final java.lang.String countryCode;
        private final java.lang.String email;
        private final java.lang.Object extraParam;
        private final java.lang.String fax;
        private final java.lang.String firstName;
        private final java.lang.String lastName;
        private final java.lang.String organizationName;
        private final java.lang.String phoneNumber;
        private final java.lang.String state;
        private final java.lang.String zipCode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.addressLine1 = software.amazon.jsii.Kernel.get(this, "addressLine1", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.addressLine2 = software.amazon.jsii.Kernel.get(this, "addressLine2", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.city = software.amazon.jsii.Kernel.get(this, "city", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contactType = software.amazon.jsii.Kernel.get(this, "contactType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.countryCode = software.amazon.jsii.Kernel.get(this, "countryCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.email = software.amazon.jsii.Kernel.get(this, "email", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.extraParam = software.amazon.jsii.Kernel.get(this, "extraParam", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fax = software.amazon.jsii.Kernel.get(this, "fax", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.firstName = software.amazon.jsii.Kernel.get(this, "firstName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lastName = software.amazon.jsii.Kernel.get(this, "lastName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.organizationName = software.amazon.jsii.Kernel.get(this, "organizationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.phoneNumber = software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.state = software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.zipCode = software.amazon.jsii.Kernel.get(this, "zipCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.addressLine1 = builder.addressLine1;
            this.addressLine2 = builder.addressLine2;
            this.city = builder.city;
            this.contactType = builder.contactType;
            this.countryCode = builder.countryCode;
            this.email = builder.email;
            this.extraParam = builder.extraParam;
            this.fax = builder.fax;
            this.firstName = builder.firstName;
            this.lastName = builder.lastName;
            this.organizationName = builder.organizationName;
            this.phoneNumber = builder.phoneNumber;
            this.state = builder.state;
            this.zipCode = builder.zipCode;
        }

        @Override
        public final java.lang.String getAddressLine1() {
            return this.addressLine1;
        }

        @Override
        public final java.lang.String getAddressLine2() {
            return this.addressLine2;
        }

        @Override
        public final java.lang.String getCity() {
            return this.city;
        }

        @Override
        public final java.lang.String getContactType() {
            return this.contactType;
        }

        @Override
        public final java.lang.String getCountryCode() {
            return this.countryCode;
        }

        @Override
        public final java.lang.String getEmail() {
            return this.email;
        }

        @Override
        public final java.lang.Object getExtraParam() {
            return this.extraParam;
        }

        @Override
        public final java.lang.String getFax() {
            return this.fax;
        }

        @Override
        public final java.lang.String getFirstName() {
            return this.firstName;
        }

        @Override
        public final java.lang.String getLastName() {
            return this.lastName;
        }

        @Override
        public final java.lang.String getOrganizationName() {
            return this.organizationName;
        }

        @Override
        public final java.lang.String getPhoneNumber() {
            return this.phoneNumber;
        }

        @Override
        public final java.lang.String getState() {
            return this.state;
        }

        @Override
        public final java.lang.String getZipCode() {
            return this.zipCode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAddressLine1() != null) {
                data.set("addressLine1", om.valueToTree(this.getAddressLine1()));
            }
            if (this.getAddressLine2() != null) {
                data.set("addressLine2", om.valueToTree(this.getAddressLine2()));
            }
            if (this.getCity() != null) {
                data.set("city", om.valueToTree(this.getCity()));
            }
            if (this.getContactType() != null) {
                data.set("contactType", om.valueToTree(this.getContactType()));
            }
            if (this.getCountryCode() != null) {
                data.set("countryCode", om.valueToTree(this.getCountryCode()));
            }
            if (this.getEmail() != null) {
                data.set("email", om.valueToTree(this.getEmail()));
            }
            if (this.getExtraParam() != null) {
                data.set("extraParam", om.valueToTree(this.getExtraParam()));
            }
            if (this.getFax() != null) {
                data.set("fax", om.valueToTree(this.getFax()));
            }
            if (this.getFirstName() != null) {
                data.set("firstName", om.valueToTree(this.getFirstName()));
            }
            if (this.getLastName() != null) {
                data.set("lastName", om.valueToTree(this.getLastName()));
            }
            if (this.getOrganizationName() != null) {
                data.set("organizationName", om.valueToTree(this.getOrganizationName()));
            }
            if (this.getPhoneNumber() != null) {
                data.set("phoneNumber", om.valueToTree(this.getPhoneNumber()));
            }
            if (this.getState() != null) {
                data.set("state", om.valueToTree(this.getState()));
            }
            if (this.getZipCode() != null) {
                data.set("zipCode", om.valueToTree(this.getZipCode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53DomainsDomain.Route53DomainsDomainAdminContact"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53DomainsDomainAdminContact.Jsii$Proxy that = (Route53DomainsDomainAdminContact.Jsii$Proxy) o;

            if (this.addressLine1 != null ? !this.addressLine1.equals(that.addressLine1) : that.addressLine1 != null) return false;
            if (this.addressLine2 != null ? !this.addressLine2.equals(that.addressLine2) : that.addressLine2 != null) return false;
            if (this.city != null ? !this.city.equals(that.city) : that.city != null) return false;
            if (this.contactType != null ? !this.contactType.equals(that.contactType) : that.contactType != null) return false;
            if (this.countryCode != null ? !this.countryCode.equals(that.countryCode) : that.countryCode != null) return false;
            if (this.email != null ? !this.email.equals(that.email) : that.email != null) return false;
            if (this.extraParam != null ? !this.extraParam.equals(that.extraParam) : that.extraParam != null) return false;
            if (this.fax != null ? !this.fax.equals(that.fax) : that.fax != null) return false;
            if (this.firstName != null ? !this.firstName.equals(that.firstName) : that.firstName != null) return false;
            if (this.lastName != null ? !this.lastName.equals(that.lastName) : that.lastName != null) return false;
            if (this.organizationName != null ? !this.organizationName.equals(that.organizationName) : that.organizationName != null) return false;
            if (this.phoneNumber != null ? !this.phoneNumber.equals(that.phoneNumber) : that.phoneNumber != null) return false;
            if (this.state != null ? !this.state.equals(that.state) : that.state != null) return false;
            return this.zipCode != null ? this.zipCode.equals(that.zipCode) : that.zipCode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.addressLine1 != null ? this.addressLine1.hashCode() : 0;
            result = 31 * result + (this.addressLine2 != null ? this.addressLine2.hashCode() : 0);
            result = 31 * result + (this.city != null ? this.city.hashCode() : 0);
            result = 31 * result + (this.contactType != null ? this.contactType.hashCode() : 0);
            result = 31 * result + (this.countryCode != null ? this.countryCode.hashCode() : 0);
            result = 31 * result + (this.email != null ? this.email.hashCode() : 0);
            result = 31 * result + (this.extraParam != null ? this.extraParam.hashCode() : 0);
            result = 31 * result + (this.fax != null ? this.fax.hashCode() : 0);
            result = 31 * result + (this.firstName != null ? this.firstName.hashCode() : 0);
            result = 31 * result + (this.lastName != null ? this.lastName.hashCode() : 0);
            result = 31 * result + (this.organizationName != null ? this.organizationName.hashCode() : 0);
            result = 31 * result + (this.phoneNumber != null ? this.phoneNumber.hashCode() : 0);
            result = 31 * result + (this.state != null ? this.state.hashCode() : 0);
            result = 31 * result + (this.zipCode != null ? this.zipCode.hashCode() : 0);
            return result;
        }
    }
}
