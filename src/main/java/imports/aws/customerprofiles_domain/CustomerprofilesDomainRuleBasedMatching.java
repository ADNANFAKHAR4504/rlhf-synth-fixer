package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatching")
@software.amazon.jsii.Jsii.Proxy(CustomerprofilesDomainRuleBasedMatching.Jsii$Proxy.class)
public interface CustomerprofilesDomainRuleBasedMatching extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * attribute_types_selector block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#attribute_types_selector CustomerprofilesDomain#attribute_types_selector}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector getAttributeTypesSelector() {
        return null;
    }

    /**
     * conflict_resolution block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolution CustomerprofilesDomain#conflict_resolution}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolution getConflictResolution() {
        return null;
    }

    /**
     * exporting_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#exporting_config CustomerprofilesDomain#exporting_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfig getExportingConfig() {
        return null;
    }

    /**
     * matching_rules block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching_rules CustomerprofilesDomain#matching_rules}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMatchingRules() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#max_allowed_rule_level_for_matching CustomerprofilesDomain#max_allowed_rule_level_for_matching}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxAllowedRuleLevelForMatching() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#max_allowed_rule_level_for_merging CustomerprofilesDomain#max_allowed_rule_level_for_merging}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxAllowedRuleLevelForMerging() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#status CustomerprofilesDomain#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CustomerprofilesDomainRuleBasedMatching}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CustomerprofilesDomainRuleBasedMatching}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CustomerprofilesDomainRuleBasedMatching> {
        java.lang.Object enabled;
        imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector attributeTypesSelector;
        imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolution conflictResolution;
        imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfig exportingConfig;
        java.lang.Object matchingRules;
        java.lang.Number maxAllowedRuleLevelForMatching;
        java.lang.Number maxAllowedRuleLevelForMerging;
        java.lang.String status;

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatching#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatching#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#enabled CustomerprofilesDomain#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatching#getAttributeTypesSelector}
         * @param attributeTypesSelector attribute_types_selector block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#attribute_types_selector CustomerprofilesDomain#attribute_types_selector}
         * @return {@code this}
         */
        public Builder attributeTypesSelector(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector attributeTypesSelector) {
            this.attributeTypesSelector = attributeTypesSelector;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatching#getConflictResolution}
         * @param conflictResolution conflict_resolution block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#conflict_resolution CustomerprofilesDomain#conflict_resolution}
         * @return {@code this}
         */
        public Builder conflictResolution(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolution conflictResolution) {
            this.conflictResolution = conflictResolution;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatching#getExportingConfig}
         * @param exportingConfig exporting_config block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#exporting_config CustomerprofilesDomain#exporting_config}
         * @return {@code this}
         */
        public Builder exportingConfig(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfig exportingConfig) {
            this.exportingConfig = exportingConfig;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatching#getMatchingRules}
         * @param matchingRules matching_rules block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching_rules CustomerprofilesDomain#matching_rules}
         * @return {@code this}
         */
        public Builder matchingRules(com.hashicorp.cdktf.IResolvable matchingRules) {
            this.matchingRules = matchingRules;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatching#getMatchingRules}
         * @param matchingRules matching_rules block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#matching_rules CustomerprofilesDomain#matching_rules}
         * @return {@code this}
         */
        public Builder matchingRules(java.util.List<? extends imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingMatchingRules> matchingRules) {
            this.matchingRules = matchingRules;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatching#getMaxAllowedRuleLevelForMatching}
         * @param maxAllowedRuleLevelForMatching Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#max_allowed_rule_level_for_matching CustomerprofilesDomain#max_allowed_rule_level_for_matching}.
         * @return {@code this}
         */
        public Builder maxAllowedRuleLevelForMatching(java.lang.Number maxAllowedRuleLevelForMatching) {
            this.maxAllowedRuleLevelForMatching = maxAllowedRuleLevelForMatching;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatching#getMaxAllowedRuleLevelForMerging}
         * @param maxAllowedRuleLevelForMerging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#max_allowed_rule_level_for_merging CustomerprofilesDomain#max_allowed_rule_level_for_merging}.
         * @return {@code this}
         */
        public Builder maxAllowedRuleLevelForMerging(java.lang.Number maxAllowedRuleLevelForMerging) {
            this.maxAllowedRuleLevelForMerging = maxAllowedRuleLevelForMerging;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainRuleBasedMatching#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#status CustomerprofilesDomain#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CustomerprofilesDomainRuleBasedMatching}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CustomerprofilesDomainRuleBasedMatching build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CustomerprofilesDomainRuleBasedMatching}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CustomerprofilesDomainRuleBasedMatching {
        private final java.lang.Object enabled;
        private final imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector attributeTypesSelector;
        private final imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolution conflictResolution;
        private final imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfig exportingConfig;
        private final java.lang.Object matchingRules;
        private final java.lang.Number maxAllowedRuleLevelForMatching;
        private final java.lang.Number maxAllowedRuleLevelForMerging;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.attributeTypesSelector = software.amazon.jsii.Kernel.get(this, "attributeTypesSelector", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector.class));
            this.conflictResolution = software.amazon.jsii.Kernel.get(this, "conflictResolution", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolution.class));
            this.exportingConfig = software.amazon.jsii.Kernel.get(this, "exportingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfig.class));
            this.matchingRules = software.amazon.jsii.Kernel.get(this, "matchingRules", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.maxAllowedRuleLevelForMatching = software.amazon.jsii.Kernel.get(this, "maxAllowedRuleLevelForMatching", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxAllowedRuleLevelForMerging = software.amazon.jsii.Kernel.get(this, "maxAllowedRuleLevelForMerging", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.attributeTypesSelector = builder.attributeTypesSelector;
            this.conflictResolution = builder.conflictResolution;
            this.exportingConfig = builder.exportingConfig;
            this.matchingRules = builder.matchingRules;
            this.maxAllowedRuleLevelForMatching = builder.maxAllowedRuleLevelForMatching;
            this.maxAllowedRuleLevelForMerging = builder.maxAllowedRuleLevelForMerging;
            this.status = builder.status;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector getAttributeTypesSelector() {
            return this.attributeTypesSelector;
        }

        @Override
        public final imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolution getConflictResolution() {
            return this.conflictResolution;
        }

        @Override
        public final imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfig getExportingConfig() {
            return this.exportingConfig;
        }

        @Override
        public final java.lang.Object getMatchingRules() {
            return this.matchingRules;
        }

        @Override
        public final java.lang.Number getMaxAllowedRuleLevelForMatching() {
            return this.maxAllowedRuleLevelForMatching;
        }

        @Override
        public final java.lang.Number getMaxAllowedRuleLevelForMerging() {
            return this.maxAllowedRuleLevelForMerging;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getAttributeTypesSelector() != null) {
                data.set("attributeTypesSelector", om.valueToTree(this.getAttributeTypesSelector()));
            }
            if (this.getConflictResolution() != null) {
                data.set("conflictResolution", om.valueToTree(this.getConflictResolution()));
            }
            if (this.getExportingConfig() != null) {
                data.set("exportingConfig", om.valueToTree(this.getExportingConfig()));
            }
            if (this.getMatchingRules() != null) {
                data.set("matchingRules", om.valueToTree(this.getMatchingRules()));
            }
            if (this.getMaxAllowedRuleLevelForMatching() != null) {
                data.set("maxAllowedRuleLevelForMatching", om.valueToTree(this.getMaxAllowedRuleLevelForMatching()));
            }
            if (this.getMaxAllowedRuleLevelForMerging() != null) {
                data.set("maxAllowedRuleLevelForMerging", om.valueToTree(this.getMaxAllowedRuleLevelForMerging()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatching"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CustomerprofilesDomainRuleBasedMatching.Jsii$Proxy that = (CustomerprofilesDomainRuleBasedMatching.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            if (this.attributeTypesSelector != null ? !this.attributeTypesSelector.equals(that.attributeTypesSelector) : that.attributeTypesSelector != null) return false;
            if (this.conflictResolution != null ? !this.conflictResolution.equals(that.conflictResolution) : that.conflictResolution != null) return false;
            if (this.exportingConfig != null ? !this.exportingConfig.equals(that.exportingConfig) : that.exportingConfig != null) return false;
            if (this.matchingRules != null ? !this.matchingRules.equals(that.matchingRules) : that.matchingRules != null) return false;
            if (this.maxAllowedRuleLevelForMatching != null ? !this.maxAllowedRuleLevelForMatching.equals(that.maxAllowedRuleLevelForMatching) : that.maxAllowedRuleLevelForMatching != null) return false;
            if (this.maxAllowedRuleLevelForMerging != null ? !this.maxAllowedRuleLevelForMerging.equals(that.maxAllowedRuleLevelForMerging) : that.maxAllowedRuleLevelForMerging != null) return false;
            return this.status != null ? this.status.equals(that.status) : that.status == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.attributeTypesSelector != null ? this.attributeTypesSelector.hashCode() : 0);
            result = 31 * result + (this.conflictResolution != null ? this.conflictResolution.hashCode() : 0);
            result = 31 * result + (this.exportingConfig != null ? this.exportingConfig.hashCode() : 0);
            result = 31 * result + (this.matchingRules != null ? this.matchingRules.hashCode() : 0);
            result = 31 * result + (this.maxAllowedRuleLevelForMatching != null ? this.maxAllowedRuleLevelForMatching.hashCode() : 0);
            result = 31 * result + (this.maxAllowedRuleLevelForMerging != null ? this.maxAllowedRuleLevelForMerging.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            return result;
        }
    }
}
