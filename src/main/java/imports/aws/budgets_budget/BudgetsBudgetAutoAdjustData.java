package imports.aws.budgets_budget;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.184Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudget.BudgetsBudgetAutoAdjustData")
@software.amazon.jsii.Jsii.Proxy(BudgetsBudgetAutoAdjustData.Jsii$Proxy.class)
public interface BudgetsBudgetAutoAdjustData extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#auto_adjust_type BudgetsBudget#auto_adjust_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAutoAdjustType();

    /**
     * historical_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#historical_options BudgetsBudget#historical_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptions getHistoricalOptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BudgetsBudgetAutoAdjustData}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BudgetsBudgetAutoAdjustData}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BudgetsBudgetAutoAdjustData> {
        java.lang.String autoAdjustType;
        imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptions historicalOptions;

        /**
         * Sets the value of {@link BudgetsBudgetAutoAdjustData#getAutoAdjustType}
         * @param autoAdjustType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#auto_adjust_type BudgetsBudget#auto_adjust_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder autoAdjustType(java.lang.String autoAdjustType) {
            this.autoAdjustType = autoAdjustType;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetAutoAdjustData#getHistoricalOptions}
         * @param historicalOptions historical_options block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#historical_options BudgetsBudget#historical_options}
         * @return {@code this}
         */
        public Builder historicalOptions(imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptions historicalOptions) {
            this.historicalOptions = historicalOptions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BudgetsBudgetAutoAdjustData}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BudgetsBudgetAutoAdjustData build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BudgetsBudgetAutoAdjustData}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BudgetsBudgetAutoAdjustData {
        private final java.lang.String autoAdjustType;
        private final imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptions historicalOptions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.autoAdjustType = software.amazon.jsii.Kernel.get(this, "autoAdjustType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.historicalOptions = software.amazon.jsii.Kernel.get(this, "historicalOptions", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptions.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.autoAdjustType = java.util.Objects.requireNonNull(builder.autoAdjustType, "autoAdjustType is required");
            this.historicalOptions = builder.historicalOptions;
        }

        @Override
        public final java.lang.String getAutoAdjustType() {
            return this.autoAdjustType;
        }

        @Override
        public final imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptions getHistoricalOptions() {
            return this.historicalOptions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("autoAdjustType", om.valueToTree(this.getAutoAdjustType()));
            if (this.getHistoricalOptions() != null) {
                data.set("historicalOptions", om.valueToTree(this.getHistoricalOptions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.budgetsBudget.BudgetsBudgetAutoAdjustData"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BudgetsBudgetAutoAdjustData.Jsii$Proxy that = (BudgetsBudgetAutoAdjustData.Jsii$Proxy) o;

            if (!autoAdjustType.equals(that.autoAdjustType)) return false;
            return this.historicalOptions != null ? this.historicalOptions.equals(that.historicalOptions) : that.historicalOptions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.autoAdjustType.hashCode();
            result = 31 * result + (this.historicalOptions != null ? this.historicalOptions.hashCode() : 0);
            return result;
        }
    }
}
