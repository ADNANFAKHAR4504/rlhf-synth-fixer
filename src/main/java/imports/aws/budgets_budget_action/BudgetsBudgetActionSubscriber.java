package imports.aws.budgets_budget_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudgetAction.BudgetsBudgetActionSubscriber")
@software.amazon.jsii.Jsii.Proxy(BudgetsBudgetActionSubscriber.Jsii$Proxy.class)
public interface BudgetsBudgetActionSubscriber extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#address BudgetsBudgetAction#address}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAddress();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#subscription_type BudgetsBudgetAction#subscription_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSubscriptionType();

    /**
     * @return a {@link Builder} of {@link BudgetsBudgetActionSubscriber}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BudgetsBudgetActionSubscriber}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BudgetsBudgetActionSubscriber> {
        java.lang.String address;
        java.lang.String subscriptionType;

        /**
         * Sets the value of {@link BudgetsBudgetActionSubscriber#getAddress}
         * @param address Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#address BudgetsBudgetAction#address}. This parameter is required.
         * @return {@code this}
         */
        public Builder address(java.lang.String address) {
            this.address = address;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionSubscriber#getSubscriptionType}
         * @param subscriptionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#subscription_type BudgetsBudgetAction#subscription_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder subscriptionType(java.lang.String subscriptionType) {
            this.subscriptionType = subscriptionType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BudgetsBudgetActionSubscriber}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BudgetsBudgetActionSubscriber build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BudgetsBudgetActionSubscriber}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BudgetsBudgetActionSubscriber {
        private final java.lang.String address;
        private final java.lang.String subscriptionType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.address = software.amazon.jsii.Kernel.get(this, "address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subscriptionType = software.amazon.jsii.Kernel.get(this, "subscriptionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.address = java.util.Objects.requireNonNull(builder.address, "address is required");
            this.subscriptionType = java.util.Objects.requireNonNull(builder.subscriptionType, "subscriptionType is required");
        }

        @Override
        public final java.lang.String getAddress() {
            return this.address;
        }

        @Override
        public final java.lang.String getSubscriptionType() {
            return this.subscriptionType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("address", om.valueToTree(this.getAddress()));
            data.set("subscriptionType", om.valueToTree(this.getSubscriptionType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.budgetsBudgetAction.BudgetsBudgetActionSubscriber"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BudgetsBudgetActionSubscriber.Jsii$Proxy that = (BudgetsBudgetActionSubscriber.Jsii$Proxy) o;

            if (!address.equals(that.address)) return false;
            return this.subscriptionType.equals(that.subscriptionType);
        }

        @Override
        public final int hashCode() {
            int result = this.address.hashCode();
            result = 31 * result + (this.subscriptionType.hashCode());
            return result;
        }
    }
}
