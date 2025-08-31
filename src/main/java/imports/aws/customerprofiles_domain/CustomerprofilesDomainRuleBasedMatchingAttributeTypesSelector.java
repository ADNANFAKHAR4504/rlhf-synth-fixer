package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector")
@software.amazon.jsii.Jsii.Proxy(CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector.Jsii$Proxy.class)
public interface CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#attribute_matching_model CustomerprofilesDomain#attribute_matching_model}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAttributeMatchingModel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#address CustomerprofilesDomain#address}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#email_address CustomerprofilesDomain#email_address}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEmailAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#phone_number CustomerprofilesDomain#phone_number}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPhoneNumber() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector> {
        java.lang.String attributeMatchingModel;
        java.util.List<java.lang.String> address;
        java.util.List<java.lang.String> emailAddress;
        java.util.List<java.lang.String> phoneNumber;

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector#getAttributeMatchingModel}
         * @param attributeMatchingModel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#attribute_matching_model CustomerprofilesDomain#attribute_matching_model}. This parameter is required.
         * @return {@code this}
         */
        public Builder attributeMatchingModel(java.lang.String attributeMatchingModel) {
            this.attributeMatchingModel = attributeMatchingModel;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector#getAddress}
         * @param address Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#address CustomerprofilesDomain#address}.
         * @return {@code this}
         */
        public Builder address(java.util.List<java.lang.String> address) {
            this.address = address;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector#getEmailAddress}
         * @param emailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#email_address CustomerprofilesDomain#email_address}.
         * @return {@code this}
         */
        public Builder emailAddress(java.util.List<java.lang.String> emailAddress) {
            this.emailAddress = emailAddress;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector#getPhoneNumber}
         * @param phoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#phone_number CustomerprofilesDomain#phone_number}.
         * @return {@code this}
         */
        public Builder phoneNumber(java.util.List<java.lang.String> phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector {
        private final java.lang.String attributeMatchingModel;
        private final java.util.List<java.lang.String> address;
        private final java.util.List<java.lang.String> emailAddress;
        private final java.util.List<java.lang.String> phoneNumber;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.attributeMatchingModel = software.amazon.jsii.Kernel.get(this, "attributeMatchingModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.address = software.amazon.jsii.Kernel.get(this, "address", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.emailAddress = software.amazon.jsii.Kernel.get(this, "emailAddress", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.phoneNumber = software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.attributeMatchingModel = java.util.Objects.requireNonNull(builder.attributeMatchingModel, "attributeMatchingModel is required");
            this.address = builder.address;
            this.emailAddress = builder.emailAddress;
            this.phoneNumber = builder.phoneNumber;
        }

        @Override
        public final java.lang.String getAttributeMatchingModel() {
            return this.attributeMatchingModel;
        }

        @Override
        public final java.util.List<java.lang.String> getAddress() {
            return this.address;
        }

        @Override
        public final java.util.List<java.lang.String> getEmailAddress() {
            return this.emailAddress;
        }

        @Override
        public final java.util.List<java.lang.String> getPhoneNumber() {
            return this.phoneNumber;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("attributeMatchingModel", om.valueToTree(this.getAttributeMatchingModel()));
            if (this.getAddress() != null) {
                data.set("address", om.valueToTree(this.getAddress()));
            }
            if (this.getEmailAddress() != null) {
                data.set("emailAddress", om.valueToTree(this.getEmailAddress()));
            }
            if (this.getPhoneNumber() != null) {
                data.set("phoneNumber", om.valueToTree(this.getPhoneNumber()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector.Jsii$Proxy that = (CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector.Jsii$Proxy) o;

            if (!attributeMatchingModel.equals(that.attributeMatchingModel)) return false;
            if (this.address != null ? !this.address.equals(that.address) : that.address != null) return false;
            if (this.emailAddress != null ? !this.emailAddress.equals(that.emailAddress) : that.emailAddress != null) return false;
            return this.phoneNumber != null ? this.phoneNumber.equals(that.phoneNumber) : that.phoneNumber == null;
        }

        @Override
        public final int hashCode() {
            int result = this.attributeMatchingModel.hashCode();
            result = 31 * result + (this.address != null ? this.address.hashCode() : 0);
            result = 31 * result + (this.emailAddress != null ? this.emailAddress.hashCode() : 0);
            result = 31 * result + (this.phoneNumber != null ? this.phoneNumber.hashCode() : 0);
            return result;
        }
    }
}
