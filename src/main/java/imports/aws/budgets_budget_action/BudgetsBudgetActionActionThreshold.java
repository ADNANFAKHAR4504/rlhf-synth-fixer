package imports.aws.budgets_budget_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudgetAction.BudgetsBudgetActionActionThreshold")
@software.amazon.jsii.Jsii.Proxy(BudgetsBudgetActionActionThreshold.Jsii$Proxy.class)
public interface BudgetsBudgetActionActionThreshold extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#action_threshold_type BudgetsBudgetAction#action_threshold_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getActionThresholdType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#action_threshold_value BudgetsBudgetAction#action_threshold_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getActionThresholdValue();

    /**
     * @return a {@link Builder} of {@link BudgetsBudgetActionActionThreshold}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BudgetsBudgetActionActionThreshold}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BudgetsBudgetActionActionThreshold> {
        java.lang.String actionThresholdType;
        java.lang.Number actionThresholdValue;

        /**
         * Sets the value of {@link BudgetsBudgetActionActionThreshold#getActionThresholdType}
         * @param actionThresholdType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#action_threshold_type BudgetsBudgetAction#action_threshold_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder actionThresholdType(java.lang.String actionThresholdType) {
            this.actionThresholdType = actionThresholdType;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionActionThreshold#getActionThresholdValue}
         * @param actionThresholdValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#action_threshold_value BudgetsBudgetAction#action_threshold_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder actionThresholdValue(java.lang.Number actionThresholdValue) {
            this.actionThresholdValue = actionThresholdValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BudgetsBudgetActionActionThreshold}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BudgetsBudgetActionActionThreshold build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BudgetsBudgetActionActionThreshold}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BudgetsBudgetActionActionThreshold {
        private final java.lang.String actionThresholdType;
        private final java.lang.Number actionThresholdValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.actionThresholdType = software.amazon.jsii.Kernel.get(this, "actionThresholdType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.actionThresholdValue = software.amazon.jsii.Kernel.get(this, "actionThresholdValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.actionThresholdType = java.util.Objects.requireNonNull(builder.actionThresholdType, "actionThresholdType is required");
            this.actionThresholdValue = java.util.Objects.requireNonNull(builder.actionThresholdValue, "actionThresholdValue is required");
        }

        @Override
        public final java.lang.String getActionThresholdType() {
            return this.actionThresholdType;
        }

        @Override
        public final java.lang.Number getActionThresholdValue() {
            return this.actionThresholdValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("actionThresholdType", om.valueToTree(this.getActionThresholdType()));
            data.set("actionThresholdValue", om.valueToTree(this.getActionThresholdValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.budgetsBudgetAction.BudgetsBudgetActionActionThreshold"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BudgetsBudgetActionActionThreshold.Jsii$Proxy that = (BudgetsBudgetActionActionThreshold.Jsii$Proxy) o;

            if (!actionThresholdType.equals(that.actionThresholdType)) return false;
            return this.actionThresholdValue.equals(that.actionThresholdValue);
        }

        @Override
        public final int hashCode() {
            int result = this.actionThresholdType.hashCode();
            result = 31 * result + (this.actionThresholdValue.hashCode());
            return result;
        }
    }
}
