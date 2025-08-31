package imports.aws.budgets_budget_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudgetAction.BudgetsBudgetActionDefinitionScpActionDefinition")
@software.amazon.jsii.Jsii.Proxy(BudgetsBudgetActionDefinitionScpActionDefinition.Jsii$Proxy.class)
public interface BudgetsBudgetActionDefinitionScpActionDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#policy_id BudgetsBudgetAction#policy_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPolicyId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#target_ids BudgetsBudgetAction#target_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTargetIds();

    /**
     * @return a {@link Builder} of {@link BudgetsBudgetActionDefinitionScpActionDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BudgetsBudgetActionDefinitionScpActionDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BudgetsBudgetActionDefinitionScpActionDefinition> {
        java.lang.String policyId;
        java.util.List<java.lang.String> targetIds;

        /**
         * Sets the value of {@link BudgetsBudgetActionDefinitionScpActionDefinition#getPolicyId}
         * @param policyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#policy_id BudgetsBudgetAction#policy_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder policyId(java.lang.String policyId) {
            this.policyId = policyId;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionDefinitionScpActionDefinition#getTargetIds}
         * @param targetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#target_ids BudgetsBudgetAction#target_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetIds(java.util.List<java.lang.String> targetIds) {
            this.targetIds = targetIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BudgetsBudgetActionDefinitionScpActionDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BudgetsBudgetActionDefinitionScpActionDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BudgetsBudgetActionDefinitionScpActionDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BudgetsBudgetActionDefinitionScpActionDefinition {
        private final java.lang.String policyId;
        private final java.util.List<java.lang.String> targetIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.policyId = software.amazon.jsii.Kernel.get(this, "policyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetIds = software.amazon.jsii.Kernel.get(this, "targetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.policyId = java.util.Objects.requireNonNull(builder.policyId, "policyId is required");
            this.targetIds = java.util.Objects.requireNonNull(builder.targetIds, "targetIds is required");
        }

        @Override
        public final java.lang.String getPolicyId() {
            return this.policyId;
        }

        @Override
        public final java.util.List<java.lang.String> getTargetIds() {
            return this.targetIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("policyId", om.valueToTree(this.getPolicyId()));
            data.set("targetIds", om.valueToTree(this.getTargetIds()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.budgetsBudgetAction.BudgetsBudgetActionDefinitionScpActionDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BudgetsBudgetActionDefinitionScpActionDefinition.Jsii$Proxy that = (BudgetsBudgetActionDefinitionScpActionDefinition.Jsii$Proxy) o;

            if (!policyId.equals(that.policyId)) return false;
            return this.targetIds.equals(that.targetIds);
        }

        @Override
        public final int hashCode() {
            int result = this.policyId.hashCode();
            result = 31 * result + (this.targetIds.hashCode());
            return result;
        }
    }
}
