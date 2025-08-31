package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.402Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainMatchingAutoMerging")
@software.amazon.jsii.Jsii.Proxy(CustomerprofilesDomainMatchingAutoMerging.Jsii$Proxy.class)
public interface CustomerprofilesDomainMatchingAutoMerging extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * conflict_resolution block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolution CustomerprofilesDomain#conflict_resolution}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConflictResolution getConflictResolution() {
        return null;
    }

    /**
     * consolidation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#consolidation CustomerprofilesDomain#consolidation}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidation getConsolidation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#min_allowed_confidence_score_for_merging CustomerprofilesDomain#min_allowed_confidence_score_for_merging}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinAllowedConfidenceScoreForMerging() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CustomerprofilesDomainMatchingAutoMerging}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CustomerprofilesDomainMatchingAutoMerging}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CustomerprofilesDomainMatchingAutoMerging> {
        java.lang.Object enabled;
        imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConflictResolution conflictResolution;
        imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidation consolidation;
        java.lang.Number minAllowedConfidenceScoreForMerging;

        /**
         * Sets the value of {@link CustomerprofilesDomainMatchingAutoMerging#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainMatchingAutoMerging#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainMatchingAutoMerging#getConflictResolution}
         * @param conflictResolution conflict_resolution block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolution CustomerprofilesDomain#conflict_resolution}
         * @return {@code this}
         */
        public Builder conflictResolution(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConflictResolution conflictResolution) {
            this.conflictResolution = conflictResolution;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainMatchingAutoMerging#getConsolidation}
         * @param consolidation consolidation block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#consolidation CustomerprofilesDomain#consolidation}
         * @return {@code this}
         */
        public Builder consolidation(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidation consolidation) {
            this.consolidation = consolidation;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainMatchingAutoMerging#getMinAllowedConfidenceScoreForMerging}
         * @param minAllowedConfidenceScoreForMerging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#min_allowed_confidence_score_for_merging CustomerprofilesDomain#min_allowed_confidence_score_for_merging}.
         * @return {@code this}
         */
        public Builder minAllowedConfidenceScoreForMerging(java.lang.Number minAllowedConfidenceScoreForMerging) {
            this.minAllowedConfidenceScoreForMerging = minAllowedConfidenceScoreForMerging;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CustomerprofilesDomainMatchingAutoMerging}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CustomerprofilesDomainMatchingAutoMerging build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CustomerprofilesDomainMatchingAutoMerging}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CustomerprofilesDomainMatchingAutoMerging {
        private final java.lang.Object enabled;
        private final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConflictResolution conflictResolution;
        private final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidation consolidation;
        private final java.lang.Number minAllowedConfidenceScoreForMerging;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.conflictResolution = software.amazon.jsii.Kernel.get(this, "conflictResolution", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConflictResolution.class));
            this.consolidation = software.amazon.jsii.Kernel.get(this, "consolidation", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidation.class));
            this.minAllowedConfidenceScoreForMerging = software.amazon.jsii.Kernel.get(this, "minAllowedConfidenceScoreForMerging", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.conflictResolution = builder.conflictResolution;
            this.consolidation = builder.consolidation;
            this.minAllowedConfidenceScoreForMerging = builder.minAllowedConfidenceScoreForMerging;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConflictResolution getConflictResolution() {
            return this.conflictResolution;
        }

        @Override
        public final imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidation getConsolidation() {
            return this.consolidation;
        }

        @Override
        public final java.lang.Number getMinAllowedConfidenceScoreForMerging() {
            return this.minAllowedConfidenceScoreForMerging;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getConflictResolution() != null) {
                data.set("conflictResolution", om.valueToTree(this.getConflictResolution()));
            }
            if (this.getConsolidation() != null) {
                data.set("consolidation", om.valueToTree(this.getConsolidation()));
            }
            if (this.getMinAllowedConfidenceScoreForMerging() != null) {
                data.set("minAllowedConfidenceScoreForMerging", om.valueToTree(this.getMinAllowedConfidenceScoreForMerging()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.customerprofilesDomain.CustomerprofilesDomainMatchingAutoMerging"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CustomerprofilesDomainMatchingAutoMerging.Jsii$Proxy that = (CustomerprofilesDomainMatchingAutoMerging.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            if (this.conflictResolution != null ? !this.conflictResolution.equals(that.conflictResolution) : that.conflictResolution != null) return false;
            if (this.consolidation != null ? !this.consolidation.equals(that.consolidation) : that.consolidation != null) return false;
            return this.minAllowedConfidenceScoreForMerging != null ? this.minAllowedConfidenceScoreForMerging.equals(that.minAllowedConfidenceScoreForMerging) : that.minAllowedConfidenceScoreForMerging == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.conflictResolution != null ? this.conflictResolution.hashCode() : 0);
            result = 31 * result + (this.consolidation != null ? this.consolidation.hashCode() : 0);
            result = 31 * result + (this.minAllowedConfidenceScoreForMerging != null ? this.minAllowedConfidenceScoreForMerging.hashCode() : 0);
            return result;
        }
    }
}
