package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.953Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroup")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroup.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroup extends software.amazon.jsii.JsiiSerializable {

    /**
     * rules_source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rules_source NetworkfirewallRuleGroup#rules_source}
     */
    @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSource getRulesSource();

    /**
     * reference_sets block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#reference_sets NetworkfirewallRuleGroup#reference_sets}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupReferenceSets getReferenceSets() {
        return null;
    }

    /**
     * rule_variables block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rule_variables NetworkfirewallRuleGroup#rule_variables}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariables getRuleVariables() {
        return null;
    }

    /**
     * stateful_rule_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#stateful_rule_options NetworkfirewallRuleGroup#stateful_rule_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions getStatefulRuleOptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroup}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroup}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroup> {
        imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSource rulesSource;
        imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupReferenceSets referenceSets;
        imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariables ruleVariables;
        imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions statefulRuleOptions;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroup#getRulesSource}
         * @param rulesSource rules_source block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rules_source NetworkfirewallRuleGroup#rules_source}
         * @return {@code this}
         */
        public Builder rulesSource(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSource rulesSource) {
            this.rulesSource = rulesSource;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroup#getReferenceSets}
         * @param referenceSets reference_sets block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#reference_sets NetworkfirewallRuleGroup#reference_sets}
         * @return {@code this}
         */
        public Builder referenceSets(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupReferenceSets referenceSets) {
            this.referenceSets = referenceSets;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroup#getRuleVariables}
         * @param ruleVariables rule_variables block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#rule_variables NetworkfirewallRuleGroup#rule_variables}
         * @return {@code this}
         */
        public Builder ruleVariables(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariables ruleVariables) {
            this.ruleVariables = ruleVariables;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroup#getStatefulRuleOptions}
         * @param statefulRuleOptions stateful_rule_options block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#stateful_rule_options NetworkfirewallRuleGroup#stateful_rule_options}
         * @return {@code this}
         */
        public Builder statefulRuleOptions(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions statefulRuleOptions) {
            this.statefulRuleOptions = statefulRuleOptions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroup}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroup build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroup}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroup {
        private final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSource rulesSource;
        private final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupReferenceSets referenceSets;
        private final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariables ruleVariables;
        private final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions statefulRuleOptions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.rulesSource = software.amazon.jsii.Kernel.get(this, "rulesSource", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSource.class));
            this.referenceSets = software.amazon.jsii.Kernel.get(this, "referenceSets", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupReferenceSets.class));
            this.ruleVariables = software.amazon.jsii.Kernel.get(this, "ruleVariables", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariables.class));
            this.statefulRuleOptions = software.amazon.jsii.Kernel.get(this, "statefulRuleOptions", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.rulesSource = java.util.Objects.requireNonNull(builder.rulesSource, "rulesSource is required");
            this.referenceSets = builder.referenceSets;
            this.ruleVariables = builder.ruleVariables;
            this.statefulRuleOptions = builder.statefulRuleOptions;
        }

        @Override
        public final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSource getRulesSource() {
            return this.rulesSource;
        }

        @Override
        public final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupReferenceSets getReferenceSets() {
            return this.referenceSets;
        }

        @Override
        public final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariables getRuleVariables() {
            return this.ruleVariables;
        }

        @Override
        public final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupStatefulRuleOptions getStatefulRuleOptions() {
            return this.statefulRuleOptions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("rulesSource", om.valueToTree(this.getRulesSource()));
            if (this.getReferenceSets() != null) {
                data.set("referenceSets", om.valueToTree(this.getReferenceSets()));
            }
            if (this.getRuleVariables() != null) {
                data.set("ruleVariables", om.valueToTree(this.getRuleVariables()));
            }
            if (this.getStatefulRuleOptions() != null) {
                data.set("statefulRuleOptions", om.valueToTree(this.getStatefulRuleOptions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroup"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroup.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroup.Jsii$Proxy) o;

            if (!rulesSource.equals(that.rulesSource)) return false;
            if (this.referenceSets != null ? !this.referenceSets.equals(that.referenceSets) : that.referenceSets != null) return false;
            if (this.ruleVariables != null ? !this.ruleVariables.equals(that.ruleVariables) : that.ruleVariables != null) return false;
            return this.statefulRuleOptions != null ? this.statefulRuleOptions.equals(that.statefulRuleOptions) : that.statefulRuleOptions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.rulesSource.hashCode();
            result = 31 * result + (this.referenceSets != null ? this.referenceSets.hashCode() : 0);
            result = 31 * result + (this.ruleVariables != null ? this.ruleVariables.hashCode() : 0);
            result = 31 * result + (this.statefulRuleOptions != null ? this.statefulRuleOptions.hashCode() : 0);
            return result;
        }
    }
}
