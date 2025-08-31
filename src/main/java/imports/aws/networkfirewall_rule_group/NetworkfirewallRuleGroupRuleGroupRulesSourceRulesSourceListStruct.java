package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.955Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#generated_rules_type NetworkfirewallRuleGroup#generated_rules_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGeneratedRulesType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#targets NetworkfirewallRuleGroup#targets}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTargets();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#target_types NetworkfirewallRuleGroup#target_types}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTargetTypes();

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct> {
        java.lang.String generatedRulesType;
        java.util.List<java.lang.String> targets;
        java.util.List<java.lang.String> targetTypes;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct#getGeneratedRulesType}
         * @param generatedRulesType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#generated_rules_type NetworkfirewallRuleGroup#generated_rules_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder generatedRulesType(java.lang.String generatedRulesType) {
            this.generatedRulesType = generatedRulesType;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct#getTargets}
         * @param targets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#targets NetworkfirewallRuleGroup#targets}. This parameter is required.
         * @return {@code this}
         */
        public Builder targets(java.util.List<java.lang.String> targets) {
            this.targets = targets;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct#getTargetTypes}
         * @param targetTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#target_types NetworkfirewallRuleGroup#target_types}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetTypes(java.util.List<java.lang.String> targetTypes) {
            this.targetTypes = targetTypes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct {
        private final java.lang.String generatedRulesType;
        private final java.util.List<java.lang.String> targets;
        private final java.util.List<java.lang.String> targetTypes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.generatedRulesType = software.amazon.jsii.Kernel.get(this, "generatedRulesType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targets = software.amazon.jsii.Kernel.get(this, "targets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.targetTypes = software.amazon.jsii.Kernel.get(this, "targetTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.generatedRulesType = java.util.Objects.requireNonNull(builder.generatedRulesType, "generatedRulesType is required");
            this.targets = java.util.Objects.requireNonNull(builder.targets, "targets is required");
            this.targetTypes = java.util.Objects.requireNonNull(builder.targetTypes, "targetTypes is required");
        }

        @Override
        public final java.lang.String getGeneratedRulesType() {
            return this.generatedRulesType;
        }

        @Override
        public final java.util.List<java.lang.String> getTargets() {
            return this.targets;
        }

        @Override
        public final java.util.List<java.lang.String> getTargetTypes() {
            return this.targetTypes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("generatedRulesType", om.valueToTree(this.getGeneratedRulesType()));
            data.set("targets", om.valueToTree(this.getTargets()));
            data.set("targetTypes", om.valueToTree(this.getTargetTypes()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct.Jsii$Proxy) o;

            if (!generatedRulesType.equals(that.generatedRulesType)) return false;
            if (!targets.equals(that.targets)) return false;
            return this.targetTypes.equals(that.targetTypes);
        }

        @Override
        public final int hashCode() {
            int result = this.generatedRulesType.hashCode();
            result = 31 * result + (this.targets.hashCode());
            result = 31 * result + (this.targetTypes.hashCode());
            return result;
        }
    }
}
