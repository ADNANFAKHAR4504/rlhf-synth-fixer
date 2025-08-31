package imports.aws.route53_records_exclusive;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.216Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeolocation")
@software.amazon.jsii.Jsii.Proxy(Route53RecordsExclusiveResourceRecordSetGeolocation.Jsii$Proxy.class)
public interface Route53RecordsExclusiveResourceRecordSetGeolocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#continent_code Route53RecordsExclusive#continent_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContinentCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#country_code Route53RecordsExclusive#country_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCountryCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#subdivision_code Route53RecordsExclusive#subdivision_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubdivisionCode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53RecordsExclusiveResourceRecordSetGeolocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53RecordsExclusiveResourceRecordSetGeolocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53RecordsExclusiveResourceRecordSetGeolocation> {
        java.lang.String continentCode;
        java.lang.String countryCode;
        java.lang.String subdivisionCode;

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSetGeolocation#getContinentCode}
         * @param continentCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#continent_code Route53RecordsExclusive#continent_code}.
         * @return {@code this}
         */
        public Builder continentCode(java.lang.String continentCode) {
            this.continentCode = continentCode;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSetGeolocation#getCountryCode}
         * @param countryCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#country_code Route53RecordsExclusive#country_code}.
         * @return {@code this}
         */
        public Builder countryCode(java.lang.String countryCode) {
            this.countryCode = countryCode;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSetGeolocation#getSubdivisionCode}
         * @param subdivisionCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#subdivision_code Route53RecordsExclusive#subdivision_code}.
         * @return {@code this}
         */
        public Builder subdivisionCode(java.lang.String subdivisionCode) {
            this.subdivisionCode = subdivisionCode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53RecordsExclusiveResourceRecordSetGeolocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53RecordsExclusiveResourceRecordSetGeolocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53RecordsExclusiveResourceRecordSetGeolocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53RecordsExclusiveResourceRecordSetGeolocation {
        private final java.lang.String continentCode;
        private final java.lang.String countryCode;
        private final java.lang.String subdivisionCode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.continentCode = software.amazon.jsii.Kernel.get(this, "continentCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.countryCode = software.amazon.jsii.Kernel.get(this, "countryCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subdivisionCode = software.amazon.jsii.Kernel.get(this, "subdivisionCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.continentCode = builder.continentCode;
            this.countryCode = builder.countryCode;
            this.subdivisionCode = builder.subdivisionCode;
        }

        @Override
        public final java.lang.String getContinentCode() {
            return this.continentCode;
        }

        @Override
        public final java.lang.String getCountryCode() {
            return this.countryCode;
        }

        @Override
        public final java.lang.String getSubdivisionCode() {
            return this.subdivisionCode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContinentCode() != null) {
                data.set("continentCode", om.valueToTree(this.getContinentCode()));
            }
            if (this.getCountryCode() != null) {
                data.set("countryCode", om.valueToTree(this.getCountryCode()));
            }
            if (this.getSubdivisionCode() != null) {
                data.set("subdivisionCode", om.valueToTree(this.getSubdivisionCode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSetGeolocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53RecordsExclusiveResourceRecordSetGeolocation.Jsii$Proxy that = (Route53RecordsExclusiveResourceRecordSetGeolocation.Jsii$Proxy) o;

            if (this.continentCode != null ? !this.continentCode.equals(that.continentCode) : that.continentCode != null) return false;
            if (this.countryCode != null ? !this.countryCode.equals(that.countryCode) : that.countryCode != null) return false;
            return this.subdivisionCode != null ? this.subdivisionCode.equals(that.subdivisionCode) : that.subdivisionCode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.continentCode != null ? this.continentCode.hashCode() : 0;
            result = 31 * result + (this.countryCode != null ? this.countryCode.hashCode() : 0);
            result = 31 * result + (this.subdivisionCode != null ? this.subdivisionCode.hashCode() : 0);
            return result;
        }
    }
}
