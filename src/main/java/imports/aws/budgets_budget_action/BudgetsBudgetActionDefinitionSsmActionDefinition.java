package imports.aws.budgets_budget_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudgetAction.BudgetsBudgetActionDefinitionSsmActionDefinition")
@software.amazon.jsii.Jsii.Proxy(BudgetsBudgetActionDefinitionSsmActionDefinition.Jsii$Proxy.class)
public interface BudgetsBudgetActionDefinitionSsmActionDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#action_sub_type BudgetsBudgetAction#action_sub_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getActionSubType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#instance_ids BudgetsBudgetAction#instance_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInstanceIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#region BudgetsBudgetAction#region}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRegion();

    /**
     * @return a {@link Builder} of {@link BudgetsBudgetActionDefinitionSsmActionDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BudgetsBudgetActionDefinitionSsmActionDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BudgetsBudgetActionDefinitionSsmActionDefinition> {
        java.lang.String actionSubType;
        java.util.List<java.lang.String> instanceIds;
        java.lang.String region;

        /**
         * Sets the value of {@link BudgetsBudgetActionDefinitionSsmActionDefinition#getActionSubType}
         * @param actionSubType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#action_sub_type BudgetsBudgetAction#action_sub_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder actionSubType(java.lang.String actionSubType) {
            this.actionSubType = actionSubType;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionDefinitionSsmActionDefinition#getInstanceIds}
         * @param instanceIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#instance_ids BudgetsBudgetAction#instance_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceIds(java.util.List<java.lang.String> instanceIds) {
            this.instanceIds = instanceIds;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionDefinitionSsmActionDefinition#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#region BudgetsBudgetAction#region}. This parameter is required.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BudgetsBudgetActionDefinitionSsmActionDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BudgetsBudgetActionDefinitionSsmActionDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BudgetsBudgetActionDefinitionSsmActionDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BudgetsBudgetActionDefinitionSsmActionDefinition {
        private final java.lang.String actionSubType;
        private final java.util.List<java.lang.String> instanceIds;
        private final java.lang.String region;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.actionSubType = software.amazon.jsii.Kernel.get(this, "actionSubType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceIds = software.amazon.jsii.Kernel.get(this, "instanceIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.actionSubType = java.util.Objects.requireNonNull(builder.actionSubType, "actionSubType is required");
            this.instanceIds = java.util.Objects.requireNonNull(builder.instanceIds, "instanceIds is required");
            this.region = java.util.Objects.requireNonNull(builder.region, "region is required");
        }

        @Override
        public final java.lang.String getActionSubType() {
            return this.actionSubType;
        }

        @Override
        public final java.util.List<java.lang.String> getInstanceIds() {
            return this.instanceIds;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("actionSubType", om.valueToTree(this.getActionSubType()));
            data.set("instanceIds", om.valueToTree(this.getInstanceIds()));
            data.set("region", om.valueToTree(this.getRegion()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.budgetsBudgetAction.BudgetsBudgetActionDefinitionSsmActionDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BudgetsBudgetActionDefinitionSsmActionDefinition.Jsii$Proxy that = (BudgetsBudgetActionDefinitionSsmActionDefinition.Jsii$Proxy) o;

            if (!actionSubType.equals(that.actionSubType)) return false;
            if (!instanceIds.equals(that.instanceIds)) return false;
            return this.region.equals(that.region);
        }

        @Override
        public final int hashCode() {
            int result = this.actionSubType.hashCode();
            result = 31 * result + (this.instanceIds.hashCode());
            result = 31 * result + (this.region.hashCode());
            return result;
        }
    }
}
