package imports.aws.networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.950Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicy")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallFirewallPolicyFirewallPolicy.Jsii$Proxy.class)
public interface NetworkfirewallFirewallPolicyFirewallPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateless_default_actions NetworkfirewallFirewallPolicy#stateless_default_actions}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStatelessDefaultActions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateless_fragment_default_actions NetworkfirewallFirewallPolicy#stateless_fragment_default_actions}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStatelessFragmentDefaultActions();

    /**
     * policy_variables block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#policy_variables NetworkfirewallFirewallPolicy#policy_variables}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables getPolicyVariables() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateful_default_actions NetworkfirewallFirewallPolicy#stateful_default_actions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStatefulDefaultActions() {
        return null;
    }

    /**
     * stateful_engine_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateful_engine_options NetworkfirewallFirewallPolicy#stateful_engine_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions getStatefulEngineOptions() {
        return null;
    }

    /**
     * stateful_rule_group_reference block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateful_rule_group_reference NetworkfirewallFirewallPolicy#stateful_rule_group_reference}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStatefulRuleGroupReference() {
        return null;
    }

    /**
     * stateless_custom_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateless_custom_action NetworkfirewallFirewallPolicy#stateless_custom_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStatelessCustomAction() {
        return null;
    }

    /**
     * stateless_rule_group_reference block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateless_rule_group_reference NetworkfirewallFirewallPolicy#stateless_rule_group_reference}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStatelessRuleGroupReference() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#tls_inspection_configuration_arn NetworkfirewallFirewallPolicy#tls_inspection_configuration_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTlsInspectionConfigurationArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallFirewallPolicyFirewallPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallFirewallPolicyFirewallPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallFirewallPolicyFirewallPolicy> {
        java.util.List<java.lang.String> statelessDefaultActions;
        java.util.List<java.lang.String> statelessFragmentDefaultActions;
        imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables policyVariables;
        java.util.List<java.lang.String> statefulDefaultActions;
        imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions statefulEngineOptions;
        java.lang.Object statefulRuleGroupReference;
        java.lang.Object statelessCustomAction;
        java.lang.Object statelessRuleGroupReference;
        java.lang.String tlsInspectionConfigurationArn;

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicy#getStatelessDefaultActions}
         * @param statelessDefaultActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateless_default_actions NetworkfirewallFirewallPolicy#stateless_default_actions}. This parameter is required.
         * @return {@code this}
         */
        public Builder statelessDefaultActions(java.util.List<java.lang.String> statelessDefaultActions) {
            this.statelessDefaultActions = statelessDefaultActions;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicy#getStatelessFragmentDefaultActions}
         * @param statelessFragmentDefaultActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateless_fragment_default_actions NetworkfirewallFirewallPolicy#stateless_fragment_default_actions}. This parameter is required.
         * @return {@code this}
         */
        public Builder statelessFragmentDefaultActions(java.util.List<java.lang.String> statelessFragmentDefaultActions) {
            this.statelessFragmentDefaultActions = statelessFragmentDefaultActions;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicy#getPolicyVariables}
         * @param policyVariables policy_variables block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#policy_variables NetworkfirewallFirewallPolicy#policy_variables}
         * @return {@code this}
         */
        public Builder policyVariables(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables policyVariables) {
            this.policyVariables = policyVariables;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicy#getStatefulDefaultActions}
         * @param statefulDefaultActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateful_default_actions NetworkfirewallFirewallPolicy#stateful_default_actions}.
         * @return {@code this}
         */
        public Builder statefulDefaultActions(java.util.List<java.lang.String> statefulDefaultActions) {
            this.statefulDefaultActions = statefulDefaultActions;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicy#getStatefulEngineOptions}
         * @param statefulEngineOptions stateful_engine_options block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateful_engine_options NetworkfirewallFirewallPolicy#stateful_engine_options}
         * @return {@code this}
         */
        public Builder statefulEngineOptions(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions statefulEngineOptions) {
            this.statefulEngineOptions = statefulEngineOptions;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicy#getStatefulRuleGroupReference}
         * @param statefulRuleGroupReference stateful_rule_group_reference block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateful_rule_group_reference NetworkfirewallFirewallPolicy#stateful_rule_group_reference}
         * @return {@code this}
         */
        public Builder statefulRuleGroupReference(com.hashicorp.cdktf.IResolvable statefulRuleGroupReference) {
            this.statefulRuleGroupReference = statefulRuleGroupReference;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicy#getStatefulRuleGroupReference}
         * @param statefulRuleGroupReference stateful_rule_group_reference block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateful_rule_group_reference NetworkfirewallFirewallPolicy#stateful_rule_group_reference}
         * @return {@code this}
         */
        public Builder statefulRuleGroupReference(java.util.List<? extends imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference> statefulRuleGroupReference) {
            this.statefulRuleGroupReference = statefulRuleGroupReference;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicy#getStatelessCustomAction}
         * @param statelessCustomAction stateless_custom_action block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateless_custom_action NetworkfirewallFirewallPolicy#stateless_custom_action}
         * @return {@code this}
         */
        public Builder statelessCustomAction(com.hashicorp.cdktf.IResolvable statelessCustomAction) {
            this.statelessCustomAction = statelessCustomAction;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicy#getStatelessCustomAction}
         * @param statelessCustomAction stateless_custom_action block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateless_custom_action NetworkfirewallFirewallPolicy#stateless_custom_action}
         * @return {@code this}
         */
        public Builder statelessCustomAction(java.util.List<? extends imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction> statelessCustomAction) {
            this.statelessCustomAction = statelessCustomAction;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicy#getStatelessRuleGroupReference}
         * @param statelessRuleGroupReference stateless_rule_group_reference block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateless_rule_group_reference NetworkfirewallFirewallPolicy#stateless_rule_group_reference}
         * @return {@code this}
         */
        public Builder statelessRuleGroupReference(com.hashicorp.cdktf.IResolvable statelessRuleGroupReference) {
            this.statelessRuleGroupReference = statelessRuleGroupReference;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicy#getStatelessRuleGroupReference}
         * @param statelessRuleGroupReference stateless_rule_group_reference block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#stateless_rule_group_reference NetworkfirewallFirewallPolicy#stateless_rule_group_reference}
         * @return {@code this}
         */
        public Builder statelessRuleGroupReference(java.util.List<? extends imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessRuleGroupReference> statelessRuleGroupReference) {
            this.statelessRuleGroupReference = statelessRuleGroupReference;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicy#getTlsInspectionConfigurationArn}
         * @param tlsInspectionConfigurationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#tls_inspection_configuration_arn NetworkfirewallFirewallPolicy#tls_inspection_configuration_arn}.
         * @return {@code this}
         */
        public Builder tlsInspectionConfigurationArn(java.lang.String tlsInspectionConfigurationArn) {
            this.tlsInspectionConfigurationArn = tlsInspectionConfigurationArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallFirewallPolicyFirewallPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallFirewallPolicyFirewallPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallFirewallPolicyFirewallPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallFirewallPolicyFirewallPolicy {
        private final java.util.List<java.lang.String> statelessDefaultActions;
        private final java.util.List<java.lang.String> statelessFragmentDefaultActions;
        private final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables policyVariables;
        private final java.util.List<java.lang.String> statefulDefaultActions;
        private final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions statefulEngineOptions;
        private final java.lang.Object statefulRuleGroupReference;
        private final java.lang.Object statelessCustomAction;
        private final java.lang.Object statelessRuleGroupReference;
        private final java.lang.String tlsInspectionConfigurationArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.statelessDefaultActions = software.amazon.jsii.Kernel.get(this, "statelessDefaultActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.statelessFragmentDefaultActions = software.amazon.jsii.Kernel.get(this, "statelessFragmentDefaultActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.policyVariables = software.amazon.jsii.Kernel.get(this, "policyVariables", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables.class));
            this.statefulDefaultActions = software.amazon.jsii.Kernel.get(this, "statefulDefaultActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.statefulEngineOptions = software.amazon.jsii.Kernel.get(this, "statefulEngineOptions", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions.class));
            this.statefulRuleGroupReference = software.amazon.jsii.Kernel.get(this, "statefulRuleGroupReference", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.statelessCustomAction = software.amazon.jsii.Kernel.get(this, "statelessCustomAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.statelessRuleGroupReference = software.amazon.jsii.Kernel.get(this, "statelessRuleGroupReference", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tlsInspectionConfigurationArn = software.amazon.jsii.Kernel.get(this, "tlsInspectionConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.statelessDefaultActions = java.util.Objects.requireNonNull(builder.statelessDefaultActions, "statelessDefaultActions is required");
            this.statelessFragmentDefaultActions = java.util.Objects.requireNonNull(builder.statelessFragmentDefaultActions, "statelessFragmentDefaultActions is required");
            this.policyVariables = builder.policyVariables;
            this.statefulDefaultActions = builder.statefulDefaultActions;
            this.statefulEngineOptions = builder.statefulEngineOptions;
            this.statefulRuleGroupReference = builder.statefulRuleGroupReference;
            this.statelessCustomAction = builder.statelessCustomAction;
            this.statelessRuleGroupReference = builder.statelessRuleGroupReference;
            this.tlsInspectionConfigurationArn = builder.tlsInspectionConfigurationArn;
        }

        @Override
        public final java.util.List<java.lang.String> getStatelessDefaultActions() {
            return this.statelessDefaultActions;
        }

        @Override
        public final java.util.List<java.lang.String> getStatelessFragmentDefaultActions() {
            return this.statelessFragmentDefaultActions;
        }

        @Override
        public final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables getPolicyVariables() {
            return this.policyVariables;
        }

        @Override
        public final java.util.List<java.lang.String> getStatefulDefaultActions() {
            return this.statefulDefaultActions;
        }

        @Override
        public final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions getStatefulEngineOptions() {
            return this.statefulEngineOptions;
        }

        @Override
        public final java.lang.Object getStatefulRuleGroupReference() {
            return this.statefulRuleGroupReference;
        }

        @Override
        public final java.lang.Object getStatelessCustomAction() {
            return this.statelessCustomAction;
        }

        @Override
        public final java.lang.Object getStatelessRuleGroupReference() {
            return this.statelessRuleGroupReference;
        }

        @Override
        public final java.lang.String getTlsInspectionConfigurationArn() {
            return this.tlsInspectionConfigurationArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("statelessDefaultActions", om.valueToTree(this.getStatelessDefaultActions()));
            data.set("statelessFragmentDefaultActions", om.valueToTree(this.getStatelessFragmentDefaultActions()));
            if (this.getPolicyVariables() != null) {
                data.set("policyVariables", om.valueToTree(this.getPolicyVariables()));
            }
            if (this.getStatefulDefaultActions() != null) {
                data.set("statefulDefaultActions", om.valueToTree(this.getStatefulDefaultActions()));
            }
            if (this.getStatefulEngineOptions() != null) {
                data.set("statefulEngineOptions", om.valueToTree(this.getStatefulEngineOptions()));
            }
            if (this.getStatefulRuleGroupReference() != null) {
                data.set("statefulRuleGroupReference", om.valueToTree(this.getStatefulRuleGroupReference()));
            }
            if (this.getStatelessCustomAction() != null) {
                data.set("statelessCustomAction", om.valueToTree(this.getStatelessCustomAction()));
            }
            if (this.getStatelessRuleGroupReference() != null) {
                data.set("statelessRuleGroupReference", om.valueToTree(this.getStatelessRuleGroupReference()));
            }
            if (this.getTlsInspectionConfigurationArn() != null) {
                data.set("tlsInspectionConfigurationArn", om.valueToTree(this.getTlsInspectionConfigurationArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallFirewallPolicyFirewallPolicy.Jsii$Proxy that = (NetworkfirewallFirewallPolicyFirewallPolicy.Jsii$Proxy) o;

            if (!statelessDefaultActions.equals(that.statelessDefaultActions)) return false;
            if (!statelessFragmentDefaultActions.equals(that.statelessFragmentDefaultActions)) return false;
            if (this.policyVariables != null ? !this.policyVariables.equals(that.policyVariables) : that.policyVariables != null) return false;
            if (this.statefulDefaultActions != null ? !this.statefulDefaultActions.equals(that.statefulDefaultActions) : that.statefulDefaultActions != null) return false;
            if (this.statefulEngineOptions != null ? !this.statefulEngineOptions.equals(that.statefulEngineOptions) : that.statefulEngineOptions != null) return false;
            if (this.statefulRuleGroupReference != null ? !this.statefulRuleGroupReference.equals(that.statefulRuleGroupReference) : that.statefulRuleGroupReference != null) return false;
            if (this.statelessCustomAction != null ? !this.statelessCustomAction.equals(that.statelessCustomAction) : that.statelessCustomAction != null) return false;
            if (this.statelessRuleGroupReference != null ? !this.statelessRuleGroupReference.equals(that.statelessRuleGroupReference) : that.statelessRuleGroupReference != null) return false;
            return this.tlsInspectionConfigurationArn != null ? this.tlsInspectionConfigurationArn.equals(that.tlsInspectionConfigurationArn) : that.tlsInspectionConfigurationArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.statelessDefaultActions.hashCode();
            result = 31 * result + (this.statelessFragmentDefaultActions.hashCode());
            result = 31 * result + (this.policyVariables != null ? this.policyVariables.hashCode() : 0);
            result = 31 * result + (this.statefulDefaultActions != null ? this.statefulDefaultActions.hashCode() : 0);
            result = 31 * result + (this.statefulEngineOptions != null ? this.statefulEngineOptions.hashCode() : 0);
            result = 31 * result + (this.statefulRuleGroupReference != null ? this.statefulRuleGroupReference.hashCode() : 0);
            result = 31 * result + (this.statelessCustomAction != null ? this.statelessCustomAction.hashCode() : 0);
            result = 31 * result + (this.statelessRuleGroupReference != null ? this.statelessRuleGroupReference.hashCode() : 0);
            result = 31 * result + (this.tlsInspectionConfigurationArn != null ? this.tlsInspectionConfigurationArn.hashCode() : 0);
            return result;
        }
    }
}
