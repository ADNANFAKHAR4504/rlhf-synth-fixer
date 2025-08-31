package imports.aws.budgets_budget_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudgetAction.BudgetsBudgetActionDefinition")
@software.amazon.jsii.Jsii.Proxy(BudgetsBudgetActionDefinition.Jsii$Proxy.class)
public interface BudgetsBudgetActionDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * iam_action_definition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#iam_action_definition BudgetsBudgetAction#iam_action_definition}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionIamActionDefinition getIamActionDefinition() {
        return null;
    }

    /**
     * scp_action_definition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#scp_action_definition BudgetsBudgetAction#scp_action_definition}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinition getScpActionDefinition() {
        return null;
    }

    /**
     * ssm_action_definition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#ssm_action_definition BudgetsBudgetAction#ssm_action_definition}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionSsmActionDefinition getSsmActionDefinition() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BudgetsBudgetActionDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BudgetsBudgetActionDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BudgetsBudgetActionDefinition> {
        imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionIamActionDefinition iamActionDefinition;
        imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinition scpActionDefinition;
        imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionSsmActionDefinition ssmActionDefinition;

        /**
         * Sets the value of {@link BudgetsBudgetActionDefinition#getIamActionDefinition}
         * @param iamActionDefinition iam_action_definition block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#iam_action_definition BudgetsBudgetAction#iam_action_definition}
         * @return {@code this}
         */
        public Builder iamActionDefinition(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionIamActionDefinition iamActionDefinition) {
            this.iamActionDefinition = iamActionDefinition;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionDefinition#getScpActionDefinition}
         * @param scpActionDefinition scp_action_definition block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#scp_action_definition BudgetsBudgetAction#scp_action_definition}
         * @return {@code this}
         */
        public Builder scpActionDefinition(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinition scpActionDefinition) {
            this.scpActionDefinition = scpActionDefinition;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionDefinition#getSsmActionDefinition}
         * @param ssmActionDefinition ssm_action_definition block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#ssm_action_definition BudgetsBudgetAction#ssm_action_definition}
         * @return {@code this}
         */
        public Builder ssmActionDefinition(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionSsmActionDefinition ssmActionDefinition) {
            this.ssmActionDefinition = ssmActionDefinition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BudgetsBudgetActionDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BudgetsBudgetActionDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BudgetsBudgetActionDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BudgetsBudgetActionDefinition {
        private final imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionIamActionDefinition iamActionDefinition;
        private final imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinition scpActionDefinition;
        private final imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionSsmActionDefinition ssmActionDefinition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.iamActionDefinition = software.amazon.jsii.Kernel.get(this, "iamActionDefinition", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionIamActionDefinition.class));
            this.scpActionDefinition = software.amazon.jsii.Kernel.get(this, "scpActionDefinition", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinition.class));
            this.ssmActionDefinition = software.amazon.jsii.Kernel.get(this, "ssmActionDefinition", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionSsmActionDefinition.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.iamActionDefinition = builder.iamActionDefinition;
            this.scpActionDefinition = builder.scpActionDefinition;
            this.ssmActionDefinition = builder.ssmActionDefinition;
        }

        @Override
        public final imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionIamActionDefinition getIamActionDefinition() {
            return this.iamActionDefinition;
        }

        @Override
        public final imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinition getScpActionDefinition() {
            return this.scpActionDefinition;
        }

        @Override
        public final imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionSsmActionDefinition getSsmActionDefinition() {
            return this.ssmActionDefinition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIamActionDefinition() != null) {
                data.set("iamActionDefinition", om.valueToTree(this.getIamActionDefinition()));
            }
            if (this.getScpActionDefinition() != null) {
                data.set("scpActionDefinition", om.valueToTree(this.getScpActionDefinition()));
            }
            if (this.getSsmActionDefinition() != null) {
                data.set("ssmActionDefinition", om.valueToTree(this.getSsmActionDefinition()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.budgetsBudgetAction.BudgetsBudgetActionDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BudgetsBudgetActionDefinition.Jsii$Proxy that = (BudgetsBudgetActionDefinition.Jsii$Proxy) o;

            if (this.iamActionDefinition != null ? !this.iamActionDefinition.equals(that.iamActionDefinition) : that.iamActionDefinition != null) return false;
            if (this.scpActionDefinition != null ? !this.scpActionDefinition.equals(that.scpActionDefinition) : that.scpActionDefinition != null) return false;
            return this.ssmActionDefinition != null ? this.ssmActionDefinition.equals(that.ssmActionDefinition) : that.ssmActionDefinition == null;
        }

        @Override
        public final int hashCode() {
            int result = this.iamActionDefinition != null ? this.iamActionDefinition.hashCode() : 0;
            result = 31 * result + (this.scpActionDefinition != null ? this.scpActionDefinition.hashCode() : 0);
            result = 31 * result + (this.ssmActionDefinition != null ? this.ssmActionDefinition.hashCode() : 0);
            return result;
        }
    }
}
