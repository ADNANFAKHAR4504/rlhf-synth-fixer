package imports.aws.identitystore_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.identitystoreUser.IdentitystoreUserAddresses")
@software.amazon.jsii.Jsii.Proxy(IdentitystoreUserAddresses.Jsii$Proxy.class)
public interface IdentitystoreUserAddresses extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#country IdentitystoreUser#country}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCountry() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#formatted IdentitystoreUser#formatted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFormatted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#locality IdentitystoreUser#locality}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocality() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#postal_code IdentitystoreUser#postal_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPostalCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#primary IdentitystoreUser#primary}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPrimary() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#region IdentitystoreUser#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#street_address IdentitystoreUser#street_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStreetAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#type IdentitystoreUser#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IdentitystoreUserAddresses}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IdentitystoreUserAddresses}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IdentitystoreUserAddresses> {
        java.lang.String country;
        java.lang.String formatted;
        java.lang.String locality;
        java.lang.String postalCode;
        java.lang.Object primary;
        java.lang.String region;
        java.lang.String streetAddress;
        java.lang.String type;

        /**
         * Sets the value of {@link IdentitystoreUserAddresses#getCountry}
         * @param country Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#country IdentitystoreUser#country}.
         * @return {@code this}
         */
        public Builder country(java.lang.String country) {
            this.country = country;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserAddresses#getFormatted}
         * @param formatted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#formatted IdentitystoreUser#formatted}.
         * @return {@code this}
         */
        public Builder formatted(java.lang.String formatted) {
            this.formatted = formatted;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserAddresses#getLocality}
         * @param locality Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#locality IdentitystoreUser#locality}.
         * @return {@code this}
         */
        public Builder locality(java.lang.String locality) {
            this.locality = locality;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserAddresses#getPostalCode}
         * @param postalCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#postal_code IdentitystoreUser#postal_code}.
         * @return {@code this}
         */
        public Builder postalCode(java.lang.String postalCode) {
            this.postalCode = postalCode;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserAddresses#getPrimary}
         * @param primary Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#primary IdentitystoreUser#primary}.
         * @return {@code this}
         */
        public Builder primary(java.lang.Boolean primary) {
            this.primary = primary;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserAddresses#getPrimary}
         * @param primary Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#primary IdentitystoreUser#primary}.
         * @return {@code this}
         */
        public Builder primary(com.hashicorp.cdktf.IResolvable primary) {
            this.primary = primary;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserAddresses#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#region IdentitystoreUser#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserAddresses#getStreetAddress}
         * @param streetAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#street_address IdentitystoreUser#street_address}.
         * @return {@code this}
         */
        public Builder streetAddress(java.lang.String streetAddress) {
            this.streetAddress = streetAddress;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserAddresses#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#type IdentitystoreUser#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IdentitystoreUserAddresses}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IdentitystoreUserAddresses build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IdentitystoreUserAddresses}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IdentitystoreUserAddresses {
        private final java.lang.String country;
        private final java.lang.String formatted;
        private final java.lang.String locality;
        private final java.lang.String postalCode;
        private final java.lang.Object primary;
        private final java.lang.String region;
        private final java.lang.String streetAddress;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.country = software.amazon.jsii.Kernel.get(this, "country", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.formatted = software.amazon.jsii.Kernel.get(this, "formatted", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.locality = software.amazon.jsii.Kernel.get(this, "locality", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.postalCode = software.amazon.jsii.Kernel.get(this, "postalCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.primary = software.amazon.jsii.Kernel.get(this, "primary", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.streetAddress = software.amazon.jsii.Kernel.get(this, "streetAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.country = builder.country;
            this.formatted = builder.formatted;
            this.locality = builder.locality;
            this.postalCode = builder.postalCode;
            this.primary = builder.primary;
            this.region = builder.region;
            this.streetAddress = builder.streetAddress;
            this.type = builder.type;
        }

        @Override
        public final java.lang.String getCountry() {
            return this.country;
        }

        @Override
        public final java.lang.String getFormatted() {
            return this.formatted;
        }

        @Override
        public final java.lang.String getLocality() {
            return this.locality;
        }

        @Override
        public final java.lang.String getPostalCode() {
            return this.postalCode;
        }

        @Override
        public final java.lang.Object getPrimary() {
            return this.primary;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.String getStreetAddress() {
            return this.streetAddress;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCountry() != null) {
                data.set("country", om.valueToTree(this.getCountry()));
            }
            if (this.getFormatted() != null) {
                data.set("formatted", om.valueToTree(this.getFormatted()));
            }
            if (this.getLocality() != null) {
                data.set("locality", om.valueToTree(this.getLocality()));
            }
            if (this.getPostalCode() != null) {
                data.set("postalCode", om.valueToTree(this.getPostalCode()));
            }
            if (this.getPrimary() != null) {
                data.set("primary", om.valueToTree(this.getPrimary()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }
            if (this.getStreetAddress() != null) {
                data.set("streetAddress", om.valueToTree(this.getStreetAddress()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.identitystoreUser.IdentitystoreUserAddresses"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IdentitystoreUserAddresses.Jsii$Proxy that = (IdentitystoreUserAddresses.Jsii$Proxy) o;

            if (this.country != null ? !this.country.equals(that.country) : that.country != null) return false;
            if (this.formatted != null ? !this.formatted.equals(that.formatted) : that.formatted != null) return false;
            if (this.locality != null ? !this.locality.equals(that.locality) : that.locality != null) return false;
            if (this.postalCode != null ? !this.postalCode.equals(that.postalCode) : that.postalCode != null) return false;
            if (this.primary != null ? !this.primary.equals(that.primary) : that.primary != null) return false;
            if (this.region != null ? !this.region.equals(that.region) : that.region != null) return false;
            if (this.streetAddress != null ? !this.streetAddress.equals(that.streetAddress) : that.streetAddress != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.country != null ? this.country.hashCode() : 0;
            result = 31 * result + (this.formatted != null ? this.formatted.hashCode() : 0);
            result = 31 * result + (this.locality != null ? this.locality.hashCode() : 0);
            result = 31 * result + (this.postalCode != null ? this.postalCode.hashCode() : 0);
            result = 31 * result + (this.primary != null ? this.primary.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            result = 31 * result + (this.streetAddress != null ? this.streetAddress.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
