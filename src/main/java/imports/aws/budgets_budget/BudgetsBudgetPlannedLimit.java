package imports.aws.budgets_budget;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudget.BudgetsBudgetPlannedLimit")
@software.amazon.jsii.Jsii.Proxy(BudgetsBudgetPlannedLimit.Jsii$Proxy.class)
public interface BudgetsBudgetPlannedLimit extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#amount BudgetsBudget#amount}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAmount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#start_time BudgetsBudget#start_time}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStartTime();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#unit BudgetsBudget#unit}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUnit();

    /**
     * @return a {@link Builder} of {@link BudgetsBudgetPlannedLimit}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BudgetsBudgetPlannedLimit}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BudgetsBudgetPlannedLimit> {
        java.lang.String amount;
        java.lang.String startTime;
        java.lang.String unit;

        /**
         * Sets the value of {@link BudgetsBudgetPlannedLimit#getAmount}
         * @param amount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#amount BudgetsBudget#amount}. This parameter is required.
         * @return {@code this}
         */
        public Builder amount(java.lang.String amount) {
            this.amount = amount;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetPlannedLimit#getStartTime}
         * @param startTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#start_time BudgetsBudget#start_time}. This parameter is required.
         * @return {@code this}
         */
        public Builder startTime(java.lang.String startTime) {
            this.startTime = startTime;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetPlannedLimit#getUnit}
         * @param unit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#unit BudgetsBudget#unit}. This parameter is required.
         * @return {@code this}
         */
        public Builder unit(java.lang.String unit) {
            this.unit = unit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BudgetsBudgetPlannedLimit}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BudgetsBudgetPlannedLimit build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BudgetsBudgetPlannedLimit}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BudgetsBudgetPlannedLimit {
        private final java.lang.String amount;
        private final java.lang.String startTime;
        private final java.lang.String unit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.amount = software.amazon.jsii.Kernel.get(this, "amount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startTime = software.amazon.jsii.Kernel.get(this, "startTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.unit = software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.amount = java.util.Objects.requireNonNull(builder.amount, "amount is required");
            this.startTime = java.util.Objects.requireNonNull(builder.startTime, "startTime is required");
            this.unit = java.util.Objects.requireNonNull(builder.unit, "unit is required");
        }

        @Override
        public final java.lang.String getAmount() {
            return this.amount;
        }

        @Override
        public final java.lang.String getStartTime() {
            return this.startTime;
        }

        @Override
        public final java.lang.String getUnit() {
            return this.unit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("amount", om.valueToTree(this.getAmount()));
            data.set("startTime", om.valueToTree(this.getStartTime()));
            data.set("unit", om.valueToTree(this.getUnit()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.budgetsBudget.BudgetsBudgetPlannedLimit"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BudgetsBudgetPlannedLimit.Jsii$Proxy that = (BudgetsBudgetPlannedLimit.Jsii$Proxy) o;

            if (!amount.equals(that.amount)) return false;
            if (!startTime.equals(that.startTime)) return false;
            return this.unit.equals(that.unit);
        }

        @Override
        public final int hashCode() {
            int result = this.amount.hashCode();
            result = 31 * result + (this.startTime.hashCode());
            result = 31 * result + (this.unit.hashCode());
            return result;
        }
    }
}
