package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainMatchingAutoMergingConsolidation")
@software.amazon.jsii.Jsii.Proxy(CustomerprofilesDomainMatchingAutoMergingConsolidation.Jsii$Proxy.class)
public interface CustomerprofilesDomainMatchingAutoMergingConsolidation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching_attributes_list CustomerprofilesDomain#matching_attributes_list}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getMatchingAttributesList();

    /**
     * @return a {@link Builder} of {@link CustomerprofilesDomainMatchingAutoMergingConsolidation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CustomerprofilesDomainMatchingAutoMergingConsolidation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CustomerprofilesDomainMatchingAutoMergingConsolidation> {
        java.lang.Object matchingAttributesList;

        /**
         * Sets the value of {@link CustomerprofilesDomainMatchingAutoMergingConsolidation#getMatchingAttributesList}
         * @param matchingAttributesList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching_attributes_list CustomerprofilesDomain#matching_attributes_list}. This parameter is required.
         * @return {@code this}
         */
        public Builder matchingAttributesList(com.hashicorp.cdktf.IResolvable matchingAttributesList) {
            this.matchingAttributesList = matchingAttributesList;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainMatchingAutoMergingConsolidation#getMatchingAttributesList}
         * @param matchingAttributesList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching_attributes_list CustomerprofilesDomain#matching_attributes_list}. This parameter is required.
         * @return {@code this}
         */
        public Builder matchingAttributesList(java.util.List<? extends java.util.List<java.lang.String>> matchingAttributesList) {
            this.matchingAttributesList = matchingAttributesList;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CustomerprofilesDomainMatchingAutoMergingConsolidation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CustomerprofilesDomainMatchingAutoMergingConsolidation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CustomerprofilesDomainMatchingAutoMergingConsolidation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CustomerprofilesDomainMatchingAutoMergingConsolidation {
        private final java.lang.Object matchingAttributesList;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.matchingAttributesList = software.amazon.jsii.Kernel.get(this, "matchingAttributesList", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.matchingAttributesList = java.util.Objects.requireNonNull(builder.matchingAttributesList, "matchingAttributesList is required");
        }

        @Override
        public final java.lang.Object getMatchingAttributesList() {
            return this.matchingAttributesList;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("matchingAttributesList", om.valueToTree(this.getMatchingAttributesList()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.customerprofilesDomain.CustomerprofilesDomainMatchingAutoMergingConsolidation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CustomerprofilesDomainMatchingAutoMergingConsolidation.Jsii$Proxy that = (CustomerprofilesDomainMatchingAutoMergingConsolidation.Jsii$Proxy) o;

            return this.matchingAttributesList.equals(that.matchingAttributesList);
        }

        @Override
        public final int hashCode() {
            int result = this.matchingAttributesList.hashCode();
            return result;
        }
    }
}
