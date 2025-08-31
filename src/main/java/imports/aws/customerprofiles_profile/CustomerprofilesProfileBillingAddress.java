package imports.aws.customerprofiles_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.404Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesProfile.CustomerprofilesProfileBillingAddress")
@software.amazon.jsii.Jsii.Proxy(CustomerprofilesProfileBillingAddress.Jsii$Proxy.class)
public interface CustomerprofilesProfileBillingAddress extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAddress1() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAddress2() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAddress3() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAddress4() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCountry() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCounty() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPostalCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProvince() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getState() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CustomerprofilesProfileBillingAddress}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CustomerprofilesProfileBillingAddress}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CustomerprofilesProfileBillingAddress> {
        java.lang.String address1;
        java.lang.String address2;
        java.lang.String address3;
        java.lang.String address4;
        java.lang.String city;
        java.lang.String country;
        java.lang.String county;
        java.lang.String postalCode;
        java.lang.String province;
        java.lang.String state;

        /**
         * Sets the value of {@link CustomerprofilesProfileBillingAddress#getAddress1}
         * @param address1 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_1 CustomerprofilesProfile#address_1}.
         * @return {@code this}
         */
        public Builder address1(java.lang.String address1) {
            this.address1 = address1;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileBillingAddress#getAddress2}
         * @param address2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_2 CustomerprofilesProfile#address_2}.
         * @return {@code this}
         */
        public Builder address2(java.lang.String address2) {
            this.address2 = address2;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileBillingAddress#getAddress3}
         * @param address3 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_3 CustomerprofilesProfile#address_3}.
         * @return {@code this}
         */
        public Builder address3(java.lang.String address3) {
            this.address3 = address3;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileBillingAddress#getAddress4}
         * @param address4 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#address_4 CustomerprofilesProfile#address_4}.
         * @return {@code this}
         */
        public Builder address4(java.lang.String address4) {
            this.address4 = address4;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileBillingAddress#getCity}
         * @param city Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#city CustomerprofilesProfile#city}.
         * @return {@code this}
         */
        public Builder city(java.lang.String city) {
            this.city = city;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileBillingAddress#getCountry}
         * @param country Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#country CustomerprofilesProfile#country}.
         * @return {@code this}
         */
        public Builder country(java.lang.String country) {
            this.country = country;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileBillingAddress#getCounty}
         * @param county Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#county CustomerprofilesProfile#county}.
         * @return {@code this}
         */
        public Builder county(java.lang.String county) {
            this.county = county;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileBillingAddress#getPostalCode}
         * @param postalCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#postal_code CustomerprofilesProfile#postal_code}.
         * @return {@code this}
         */
        public Builder postalCode(java.lang.String postalCode) {
            this.postalCode = postalCode;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileBillingAddress#getProvince}
         * @param province Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#province CustomerprofilesProfile#province}.
         * @return {@code this}
         */
        public Builder province(java.lang.String province) {
            this.province = province;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesProfileBillingAddress#getState}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_profile#state CustomerprofilesProfile#state}.
         * @return {@code this}
         */
        public Builder state(java.lang.String state) {
            this.state = state;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CustomerprofilesProfileBillingAddress}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CustomerprofilesProfileBillingAddress build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CustomerprofilesProfileBillingAddress}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CustomerprofilesProfileBillingAddress {
        private final java.lang.String address1;
        private final java.lang.String address2;
        private final java.lang.String address3;
        private final java.lang.String address4;
        private final java.lang.String city;
        private final java.lang.String country;
        private final java.lang.String county;
        private final java.lang.String postalCode;
        private final java.lang.String province;
        private final java.lang.String state;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.address1 = software.amazon.jsii.Kernel.get(this, "address1", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.address2 = software.amazon.jsii.Kernel.get(this, "address2", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.address3 = software.amazon.jsii.Kernel.get(this, "address3", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.address4 = software.amazon.jsii.Kernel.get(this, "address4", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.city = software.amazon.jsii.Kernel.get(this, "city", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.country = software.amazon.jsii.Kernel.get(this, "country", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.county = software.amazon.jsii.Kernel.get(this, "county", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.postalCode = software.amazon.jsii.Kernel.get(this, "postalCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.province = software.amazon.jsii.Kernel.get(this, "province", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.state = software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.address1 = builder.address1;
            this.address2 = builder.address2;
            this.address3 = builder.address3;
            this.address4 = builder.address4;
            this.city = builder.city;
            this.country = builder.country;
            this.county = builder.county;
            this.postalCode = builder.postalCode;
            this.province = builder.province;
            this.state = builder.state;
        }

        @Override
        public final java.lang.String getAddress1() {
            return this.address1;
        }

        @Override
        public final java.lang.String getAddress2() {
            return this.address2;
        }

        @Override
        public final java.lang.String getAddress3() {
            return this.address3;
        }

        @Override
        public final java.lang.String getAddress4() {
            return this.address4;
        }

        @Override
        public final java.lang.String getCity() {
            return this.city;
        }

        @Override
        public final java.lang.String getCountry() {
            return this.country;
        }

        @Override
        public final java.lang.String getCounty() {
            return this.county;
        }

        @Override
        public final java.lang.String getPostalCode() {
            return this.postalCode;
        }

        @Override
        public final java.lang.String getProvince() {
            return this.province;
        }

        @Override
        public final java.lang.String getState() {
            return this.state;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAddress1() != null) {
                data.set("address1", om.valueToTree(this.getAddress1()));
            }
            if (this.getAddress2() != null) {
                data.set("address2", om.valueToTree(this.getAddress2()));
            }
            if (this.getAddress3() != null) {
                data.set("address3", om.valueToTree(this.getAddress3()));
            }
            if (this.getAddress4() != null) {
                data.set("address4", om.valueToTree(this.getAddress4()));
            }
            if (this.getCity() != null) {
                data.set("city", om.valueToTree(this.getCity()));
            }
            if (this.getCountry() != null) {
                data.set("country", om.valueToTree(this.getCountry()));
            }
            if (this.getCounty() != null) {
                data.set("county", om.valueToTree(this.getCounty()));
            }
            if (this.getPostalCode() != null) {
                data.set("postalCode", om.valueToTree(this.getPostalCode()));
            }
            if (this.getProvince() != null) {
                data.set("province", om.valueToTree(this.getProvince()));
            }
            if (this.getState() != null) {
                data.set("state", om.valueToTree(this.getState()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.customerprofilesProfile.CustomerprofilesProfileBillingAddress"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CustomerprofilesProfileBillingAddress.Jsii$Proxy that = (CustomerprofilesProfileBillingAddress.Jsii$Proxy) o;

            if (this.address1 != null ? !this.address1.equals(that.address1) : that.address1 != null) return false;
            if (this.address2 != null ? !this.address2.equals(that.address2) : that.address2 != null) return false;
            if (this.address3 != null ? !this.address3.equals(that.address3) : that.address3 != null) return false;
            if (this.address4 != null ? !this.address4.equals(that.address4) : that.address4 != null) return false;
            if (this.city != null ? !this.city.equals(that.city) : that.city != null) return false;
            if (this.country != null ? !this.country.equals(that.country) : that.country != null) return false;
            if (this.county != null ? !this.county.equals(that.county) : that.county != null) return false;
            if (this.postalCode != null ? !this.postalCode.equals(that.postalCode) : that.postalCode != null) return false;
            if (this.province != null ? !this.province.equals(that.province) : that.province != null) return false;
            return this.state != null ? this.state.equals(that.state) : that.state == null;
        }

        @Override
        public final int hashCode() {
            int result = this.address1 != null ? this.address1.hashCode() : 0;
            result = 31 * result + (this.address2 != null ? this.address2.hashCode() : 0);
            result = 31 * result + (this.address3 != null ? this.address3.hashCode() : 0);
            result = 31 * result + (this.address4 != null ? this.address4.hashCode() : 0);
            result = 31 * result + (this.city != null ? this.city.hashCode() : 0);
            result = 31 * result + (this.country != null ? this.country.hashCode() : 0);
            result = 31 * result + (this.county != null ? this.county.hashCode() : 0);
            result = 31 * result + (this.postalCode != null ? this.postalCode.hashCode() : 0);
            result = 31 * result + (this.province != null ? this.province.hashCode() : 0);
            result = 31 * result + (this.state != null ? this.state.hashCode() : 0);
            return result;
        }
    }
}
