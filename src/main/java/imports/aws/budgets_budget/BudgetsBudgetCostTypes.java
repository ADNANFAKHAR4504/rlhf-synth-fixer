package imports.aws.budgets_budget;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.184Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudget.BudgetsBudgetCostTypes")
@software.amazon.jsii.Jsii.Proxy(BudgetsBudgetCostTypes.Jsii$Proxy.class)
public interface BudgetsBudgetCostTypes extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_credit BudgetsBudget#include_credit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeCredit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_discount BudgetsBudget#include_discount}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeDiscount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_other_subscription BudgetsBudget#include_other_subscription}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeOtherSubscription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_recurring BudgetsBudget#include_recurring}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeRecurring() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_refund BudgetsBudget#include_refund}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeRefund() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_subscription BudgetsBudget#include_subscription}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeSubscription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_support BudgetsBudget#include_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_tax BudgetsBudget#include_tax}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeTax() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_upfront BudgetsBudget#include_upfront}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeUpfront() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#use_amortized BudgetsBudget#use_amortized}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUseAmortized() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#use_blended BudgetsBudget#use_blended}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUseBlended() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BudgetsBudgetCostTypes}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BudgetsBudgetCostTypes}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BudgetsBudgetCostTypes> {
        java.lang.Object includeCredit;
        java.lang.Object includeDiscount;
        java.lang.Object includeOtherSubscription;
        java.lang.Object includeRecurring;
        java.lang.Object includeRefund;
        java.lang.Object includeSubscription;
        java.lang.Object includeSupport;
        java.lang.Object includeTax;
        java.lang.Object includeUpfront;
        java.lang.Object useAmortized;
        java.lang.Object useBlended;

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeCredit}
         * @param includeCredit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_credit BudgetsBudget#include_credit}.
         * @return {@code this}
         */
        public Builder includeCredit(java.lang.Boolean includeCredit) {
            this.includeCredit = includeCredit;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeCredit}
         * @param includeCredit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_credit BudgetsBudget#include_credit}.
         * @return {@code this}
         */
        public Builder includeCredit(com.hashicorp.cdktf.IResolvable includeCredit) {
            this.includeCredit = includeCredit;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeDiscount}
         * @param includeDiscount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_discount BudgetsBudget#include_discount}.
         * @return {@code this}
         */
        public Builder includeDiscount(java.lang.Boolean includeDiscount) {
            this.includeDiscount = includeDiscount;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeDiscount}
         * @param includeDiscount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_discount BudgetsBudget#include_discount}.
         * @return {@code this}
         */
        public Builder includeDiscount(com.hashicorp.cdktf.IResolvable includeDiscount) {
            this.includeDiscount = includeDiscount;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeOtherSubscription}
         * @param includeOtherSubscription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_other_subscription BudgetsBudget#include_other_subscription}.
         * @return {@code this}
         */
        public Builder includeOtherSubscription(java.lang.Boolean includeOtherSubscription) {
            this.includeOtherSubscription = includeOtherSubscription;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeOtherSubscription}
         * @param includeOtherSubscription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_other_subscription BudgetsBudget#include_other_subscription}.
         * @return {@code this}
         */
        public Builder includeOtherSubscription(com.hashicorp.cdktf.IResolvable includeOtherSubscription) {
            this.includeOtherSubscription = includeOtherSubscription;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeRecurring}
         * @param includeRecurring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_recurring BudgetsBudget#include_recurring}.
         * @return {@code this}
         */
        public Builder includeRecurring(java.lang.Boolean includeRecurring) {
            this.includeRecurring = includeRecurring;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeRecurring}
         * @param includeRecurring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_recurring BudgetsBudget#include_recurring}.
         * @return {@code this}
         */
        public Builder includeRecurring(com.hashicorp.cdktf.IResolvable includeRecurring) {
            this.includeRecurring = includeRecurring;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeRefund}
         * @param includeRefund Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_refund BudgetsBudget#include_refund}.
         * @return {@code this}
         */
        public Builder includeRefund(java.lang.Boolean includeRefund) {
            this.includeRefund = includeRefund;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeRefund}
         * @param includeRefund Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_refund BudgetsBudget#include_refund}.
         * @return {@code this}
         */
        public Builder includeRefund(com.hashicorp.cdktf.IResolvable includeRefund) {
            this.includeRefund = includeRefund;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeSubscription}
         * @param includeSubscription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_subscription BudgetsBudget#include_subscription}.
         * @return {@code this}
         */
        public Builder includeSubscription(java.lang.Boolean includeSubscription) {
            this.includeSubscription = includeSubscription;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeSubscription}
         * @param includeSubscription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_subscription BudgetsBudget#include_subscription}.
         * @return {@code this}
         */
        public Builder includeSubscription(com.hashicorp.cdktf.IResolvable includeSubscription) {
            this.includeSubscription = includeSubscription;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeSupport}
         * @param includeSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_support BudgetsBudget#include_support}.
         * @return {@code this}
         */
        public Builder includeSupport(java.lang.Boolean includeSupport) {
            this.includeSupport = includeSupport;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeSupport}
         * @param includeSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_support BudgetsBudget#include_support}.
         * @return {@code this}
         */
        public Builder includeSupport(com.hashicorp.cdktf.IResolvable includeSupport) {
            this.includeSupport = includeSupport;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeTax}
         * @param includeTax Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_tax BudgetsBudget#include_tax}.
         * @return {@code this}
         */
        public Builder includeTax(java.lang.Boolean includeTax) {
            this.includeTax = includeTax;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeTax}
         * @param includeTax Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_tax BudgetsBudget#include_tax}.
         * @return {@code this}
         */
        public Builder includeTax(com.hashicorp.cdktf.IResolvable includeTax) {
            this.includeTax = includeTax;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeUpfront}
         * @param includeUpfront Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_upfront BudgetsBudget#include_upfront}.
         * @return {@code this}
         */
        public Builder includeUpfront(java.lang.Boolean includeUpfront) {
            this.includeUpfront = includeUpfront;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getIncludeUpfront}
         * @param includeUpfront Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#include_upfront BudgetsBudget#include_upfront}.
         * @return {@code this}
         */
        public Builder includeUpfront(com.hashicorp.cdktf.IResolvable includeUpfront) {
            this.includeUpfront = includeUpfront;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getUseAmortized}
         * @param useAmortized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#use_amortized BudgetsBudget#use_amortized}.
         * @return {@code this}
         */
        public Builder useAmortized(java.lang.Boolean useAmortized) {
            this.useAmortized = useAmortized;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getUseAmortized}
         * @param useAmortized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#use_amortized BudgetsBudget#use_amortized}.
         * @return {@code this}
         */
        public Builder useAmortized(com.hashicorp.cdktf.IResolvable useAmortized) {
            this.useAmortized = useAmortized;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getUseBlended}
         * @param useBlended Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#use_blended BudgetsBudget#use_blended}.
         * @return {@code this}
         */
        public Builder useBlended(java.lang.Boolean useBlended) {
            this.useBlended = useBlended;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetCostTypes#getUseBlended}
         * @param useBlended Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#use_blended BudgetsBudget#use_blended}.
         * @return {@code this}
         */
        public Builder useBlended(com.hashicorp.cdktf.IResolvable useBlended) {
            this.useBlended = useBlended;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BudgetsBudgetCostTypes}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BudgetsBudgetCostTypes build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BudgetsBudgetCostTypes}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BudgetsBudgetCostTypes {
        private final java.lang.Object includeCredit;
        private final java.lang.Object includeDiscount;
        private final java.lang.Object includeOtherSubscription;
        private final java.lang.Object includeRecurring;
        private final java.lang.Object includeRefund;
        private final java.lang.Object includeSubscription;
        private final java.lang.Object includeSupport;
        private final java.lang.Object includeTax;
        private final java.lang.Object includeUpfront;
        private final java.lang.Object useAmortized;
        private final java.lang.Object useBlended;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.includeCredit = software.amazon.jsii.Kernel.get(this, "includeCredit", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeDiscount = software.amazon.jsii.Kernel.get(this, "includeDiscount", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeOtherSubscription = software.amazon.jsii.Kernel.get(this, "includeOtherSubscription", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeRecurring = software.amazon.jsii.Kernel.get(this, "includeRecurring", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeRefund = software.amazon.jsii.Kernel.get(this, "includeRefund", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeSubscription = software.amazon.jsii.Kernel.get(this, "includeSubscription", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeSupport = software.amazon.jsii.Kernel.get(this, "includeSupport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeTax = software.amazon.jsii.Kernel.get(this, "includeTax", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeUpfront = software.amazon.jsii.Kernel.get(this, "includeUpfront", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.useAmortized = software.amazon.jsii.Kernel.get(this, "useAmortized", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.useBlended = software.amazon.jsii.Kernel.get(this, "useBlended", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.includeCredit = builder.includeCredit;
            this.includeDiscount = builder.includeDiscount;
            this.includeOtherSubscription = builder.includeOtherSubscription;
            this.includeRecurring = builder.includeRecurring;
            this.includeRefund = builder.includeRefund;
            this.includeSubscription = builder.includeSubscription;
            this.includeSupport = builder.includeSupport;
            this.includeTax = builder.includeTax;
            this.includeUpfront = builder.includeUpfront;
            this.useAmortized = builder.useAmortized;
            this.useBlended = builder.useBlended;
        }

        @Override
        public final java.lang.Object getIncludeCredit() {
            return this.includeCredit;
        }

        @Override
        public final java.lang.Object getIncludeDiscount() {
            return this.includeDiscount;
        }

        @Override
        public final java.lang.Object getIncludeOtherSubscription() {
            return this.includeOtherSubscription;
        }

        @Override
        public final java.lang.Object getIncludeRecurring() {
            return this.includeRecurring;
        }

        @Override
        public final java.lang.Object getIncludeRefund() {
            return this.includeRefund;
        }

        @Override
        public final java.lang.Object getIncludeSubscription() {
            return this.includeSubscription;
        }

        @Override
        public final java.lang.Object getIncludeSupport() {
            return this.includeSupport;
        }

        @Override
        public final java.lang.Object getIncludeTax() {
            return this.includeTax;
        }

        @Override
        public final java.lang.Object getIncludeUpfront() {
            return this.includeUpfront;
        }

        @Override
        public final java.lang.Object getUseAmortized() {
            return this.useAmortized;
        }

        @Override
        public final java.lang.Object getUseBlended() {
            return this.useBlended;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIncludeCredit() != null) {
                data.set("includeCredit", om.valueToTree(this.getIncludeCredit()));
            }
            if (this.getIncludeDiscount() != null) {
                data.set("includeDiscount", om.valueToTree(this.getIncludeDiscount()));
            }
            if (this.getIncludeOtherSubscription() != null) {
                data.set("includeOtherSubscription", om.valueToTree(this.getIncludeOtherSubscription()));
            }
            if (this.getIncludeRecurring() != null) {
                data.set("includeRecurring", om.valueToTree(this.getIncludeRecurring()));
            }
            if (this.getIncludeRefund() != null) {
                data.set("includeRefund", om.valueToTree(this.getIncludeRefund()));
            }
            if (this.getIncludeSubscription() != null) {
                data.set("includeSubscription", om.valueToTree(this.getIncludeSubscription()));
            }
            if (this.getIncludeSupport() != null) {
                data.set("includeSupport", om.valueToTree(this.getIncludeSupport()));
            }
            if (this.getIncludeTax() != null) {
                data.set("includeTax", om.valueToTree(this.getIncludeTax()));
            }
            if (this.getIncludeUpfront() != null) {
                data.set("includeUpfront", om.valueToTree(this.getIncludeUpfront()));
            }
            if (this.getUseAmortized() != null) {
                data.set("useAmortized", om.valueToTree(this.getUseAmortized()));
            }
            if (this.getUseBlended() != null) {
                data.set("useBlended", om.valueToTree(this.getUseBlended()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.budgetsBudget.BudgetsBudgetCostTypes"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BudgetsBudgetCostTypes.Jsii$Proxy that = (BudgetsBudgetCostTypes.Jsii$Proxy) o;

            if (this.includeCredit != null ? !this.includeCredit.equals(that.includeCredit) : that.includeCredit != null) return false;
            if (this.includeDiscount != null ? !this.includeDiscount.equals(that.includeDiscount) : that.includeDiscount != null) return false;
            if (this.includeOtherSubscription != null ? !this.includeOtherSubscription.equals(that.includeOtherSubscription) : that.includeOtherSubscription != null) return false;
            if (this.includeRecurring != null ? !this.includeRecurring.equals(that.includeRecurring) : that.includeRecurring != null) return false;
            if (this.includeRefund != null ? !this.includeRefund.equals(that.includeRefund) : that.includeRefund != null) return false;
            if (this.includeSubscription != null ? !this.includeSubscription.equals(that.includeSubscription) : that.includeSubscription != null) return false;
            if (this.includeSupport != null ? !this.includeSupport.equals(that.includeSupport) : that.includeSupport != null) return false;
            if (this.includeTax != null ? !this.includeTax.equals(that.includeTax) : that.includeTax != null) return false;
            if (this.includeUpfront != null ? !this.includeUpfront.equals(that.includeUpfront) : that.includeUpfront != null) return false;
            if (this.useAmortized != null ? !this.useAmortized.equals(that.useAmortized) : that.useAmortized != null) return false;
            return this.useBlended != null ? this.useBlended.equals(that.useBlended) : that.useBlended == null;
        }

        @Override
        public final int hashCode() {
            int result = this.includeCredit != null ? this.includeCredit.hashCode() : 0;
            result = 31 * result + (this.includeDiscount != null ? this.includeDiscount.hashCode() : 0);
            result = 31 * result + (this.includeOtherSubscription != null ? this.includeOtherSubscription.hashCode() : 0);
            result = 31 * result + (this.includeRecurring != null ? this.includeRecurring.hashCode() : 0);
            result = 31 * result + (this.includeRefund != null ? this.includeRefund.hashCode() : 0);
            result = 31 * result + (this.includeSubscription != null ? this.includeSubscription.hashCode() : 0);
            result = 31 * result + (this.includeSupport != null ? this.includeSupport.hashCode() : 0);
            result = 31 * result + (this.includeTax != null ? this.includeTax.hashCode() : 0);
            result = 31 * result + (this.includeUpfront != null ? this.includeUpfront.hashCode() : 0);
            result = 31 * result + (this.useAmortized != null ? this.useAmortized.hashCode() : 0);
            result = 31 * result + (this.useBlended != null ? this.useBlended.hashCode() : 0);
            return result;
        }
    }
}
