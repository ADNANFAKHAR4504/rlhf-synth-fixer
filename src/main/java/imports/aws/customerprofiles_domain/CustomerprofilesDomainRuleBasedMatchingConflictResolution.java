package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingConflictResolution")
@software.amazon.jsii.Jsii.Proxy(CustomerprofilesDomainRuleBasedMatchingConflictResolution.Jsii$Proxy.class)
public interface CustomerprofilesDomainRuleBasedMatchingConflictResolution extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolving_model CustomerprofilesDomain#conflict_resolving_model}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConflictResolvingModel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#source_name CustomerprofilesDomain#source_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CustomerprofilesDomainRuleBasedMatchingConflictResolution}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CustomerprofilesDomainRuleBasedMatchingConflictResolution}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CustomerprofilesDomainRuleBasedMatchingConflictResolution> {
        java.lang.String conflictResolvingModel;
        java.lang.String sourceName;

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatchingConflictResolution#getConflictResolvingModel}
         * @param conflictResolvingModel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolving_model CustomerprofilesDomain#conflict_resolving_model}. This parameter is required.
         * @return {@code this}
         */
        public Builder conflictResolvingModel(java.lang.String conflictResolvingModel) {
            this.conflictResolvingModel = conflictResolvingModel;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatchingConflictResolution#getSourceName}
         * @param sourceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#source_name CustomerprofilesDomain#source_name}.
         * @return {@code this}
         */
        public Builder sourceName(java.lang.String sourceName) {
            this.sourceName = sourceName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CustomerprofilesDomainRuleBasedMatchingConflictResolution}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CustomerprofilesDomainRuleBasedMatchingConflictResolution build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CustomerprofilesDomainRuleBasedMatchingConflictResolution}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CustomerprofilesDomainRuleBasedMatchingConflictResolution {
        private final java.lang.String conflictResolvingModel;
        private final java.lang.String sourceName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.conflictResolvingModel = software.amazon.jsii.Kernel.get(this, "conflictResolvingModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceName = software.amazon.jsii.Kernel.get(this, "sourceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.conflictResolvingModel = java.util.Objects.requireNonNull(builder.conflictResolvingModel, "conflictResolvingModel is required");
            this.sourceName = builder.sourceName;
        }

        @Override
        public final java.lang.String getConflictResolvingModel() {
            return this.conflictResolvingModel;
        }

        @Override
        public final java.lang.String getSourceName() {
            return this.sourceName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("conflictResolvingModel", om.valueToTree(this.getConflictResolvingModel()));
            if (this.getSourceName() != null) {
                data.set("sourceName", om.valueToTree(this.getSourceName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingConflictResolution"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CustomerprofilesDomainRuleBasedMatchingConflictResolution.Jsii$Proxy that = (CustomerprofilesDomainRuleBasedMatchingConflictResolution.Jsii$Proxy) o;

            if (!conflictResolvingModel.equals(that.conflictResolvingModel)) return false;
            return this.sourceName != null ? this.sourceName.equals(that.sourceName) : that.sourceName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.conflictResolvingModel.hashCode();
            result = 31 * result + (this.sourceName != null ? this.sourceName.hashCode() : 0);
            return result;
        }
    }
}
