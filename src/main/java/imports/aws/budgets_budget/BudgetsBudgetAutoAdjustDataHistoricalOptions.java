package imports.aws.budgets_budget;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.184Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudget.BudgetsBudgetAutoAdjustDataHistoricalOptions")
@software.amazon.jsii.Jsii.Proxy(BudgetsBudgetAutoAdjustDataHistoricalOptions.Jsii$Proxy.class)
public interface BudgetsBudgetAutoAdjustDataHistoricalOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#budget_adjustment_period BudgetsBudget#budget_adjustment_period}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getBudgetAdjustmentPeriod();

    /**
     * @return a {@link Builder} of {@link BudgetsBudgetAutoAdjustDataHistoricalOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BudgetsBudgetAutoAdjustDataHistoricalOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BudgetsBudgetAutoAdjustDataHistoricalOptions> {
        java.lang.Number budgetAdjustmentPeriod;

        /**
         * Sets the value of {@link BudgetsBudgetAutoAdjustDataHistoricalOptions#getBudgetAdjustmentPeriod}
         * @param budgetAdjustmentPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#budget_adjustment_period BudgetsBudget#budget_adjustment_period}. This parameter is required.
         * @return {@code this}
         */
        public Builder budgetAdjustmentPeriod(java.lang.Number budgetAdjustmentPeriod) {
            this.budgetAdjustmentPeriod = budgetAdjustmentPeriod;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BudgetsBudgetAutoAdjustDataHistoricalOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BudgetsBudgetAutoAdjustDataHistoricalOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BudgetsBudgetAutoAdjustDataHistoricalOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BudgetsBudgetAutoAdjustDataHistoricalOptions {
        private final java.lang.Number budgetAdjustmentPeriod;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.budgetAdjustmentPeriod = software.amazon.jsii.Kernel.get(this, "budgetAdjustmentPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.budgetAdjustmentPeriod = java.util.Objects.requireNonNull(builder.budgetAdjustmentPeriod, "budgetAdjustmentPeriod is required");
        }

        @Override
        public final java.lang.Number getBudgetAdjustmentPeriod() {
            return this.budgetAdjustmentPeriod;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("budgetAdjustmentPeriod", om.valueToTree(this.getBudgetAdjustmentPeriod()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.budgetsBudget.BudgetsBudgetAutoAdjustDataHistoricalOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BudgetsBudgetAutoAdjustDataHistoricalOptions.Jsii$Proxy that = (BudgetsBudgetAutoAdjustDataHistoricalOptions.Jsii$Proxy) o;

            return this.budgetAdjustmentPeriod.equals(that.budgetAdjustmentPeriod);
        }

        @Override
        public final int hashCode() {
            int result = this.budgetAdjustmentPeriod.hashCode();
            return result;
        }
    }
}
