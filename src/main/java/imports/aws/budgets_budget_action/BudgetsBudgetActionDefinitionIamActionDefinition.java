package imports.aws.budgets_budget_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudgetAction.BudgetsBudgetActionDefinitionIamActionDefinition")
@software.amazon.jsii.Jsii.Proxy(BudgetsBudgetActionDefinitionIamActionDefinition.Jsii$Proxy.class)
public interface BudgetsBudgetActionDefinitionIamActionDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#policy_arn BudgetsBudgetAction#policy_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPolicyArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#groups BudgetsBudgetAction#groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#roles BudgetsBudgetAction#roles}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRoles() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#users BudgetsBudgetAction#users}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getUsers() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BudgetsBudgetActionDefinitionIamActionDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BudgetsBudgetActionDefinitionIamActionDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BudgetsBudgetActionDefinitionIamActionDefinition> {
        java.lang.String policyArn;
        java.util.List<java.lang.String> groups;
        java.util.List<java.lang.String> roles;
        java.util.List<java.lang.String> users;

        /**
         * Sets the value of {@link BudgetsBudgetActionDefinitionIamActionDefinition#getPolicyArn}
         * @param policyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#policy_arn BudgetsBudgetAction#policy_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder policyArn(java.lang.String policyArn) {
            this.policyArn = policyArn;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionDefinitionIamActionDefinition#getGroups}
         * @param groups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#groups BudgetsBudgetAction#groups}.
         * @return {@code this}
         */
        public Builder groups(java.util.List<java.lang.String> groups) {
            this.groups = groups;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionDefinitionIamActionDefinition#getRoles}
         * @param roles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#roles BudgetsBudgetAction#roles}.
         * @return {@code this}
         */
        public Builder roles(java.util.List<java.lang.String> roles) {
            this.roles = roles;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionDefinitionIamActionDefinition#getUsers}
         * @param users Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#users BudgetsBudgetAction#users}.
         * @return {@code this}
         */
        public Builder users(java.util.List<java.lang.String> users) {
            this.users = users;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BudgetsBudgetActionDefinitionIamActionDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BudgetsBudgetActionDefinitionIamActionDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BudgetsBudgetActionDefinitionIamActionDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BudgetsBudgetActionDefinitionIamActionDefinition {
        private final java.lang.String policyArn;
        private final java.util.List<java.lang.String> groups;
        private final java.util.List<java.lang.String> roles;
        private final java.util.List<java.lang.String> users;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.policyArn = software.amazon.jsii.Kernel.get(this, "policyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.groups = software.amazon.jsii.Kernel.get(this, "groups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.roles = software.amazon.jsii.Kernel.get(this, "roles", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.users = software.amazon.jsii.Kernel.get(this, "users", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.policyArn = java.util.Objects.requireNonNull(builder.policyArn, "policyArn is required");
            this.groups = builder.groups;
            this.roles = builder.roles;
            this.users = builder.users;
        }

        @Override
        public final java.lang.String getPolicyArn() {
            return this.policyArn;
        }

        @Override
        public final java.util.List<java.lang.String> getGroups() {
            return this.groups;
        }

        @Override
        public final java.util.List<java.lang.String> getRoles() {
            return this.roles;
        }

        @Override
        public final java.util.List<java.lang.String> getUsers() {
            return this.users;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("policyArn", om.valueToTree(this.getPolicyArn()));
            if (this.getGroups() != null) {
                data.set("groups", om.valueToTree(this.getGroups()));
            }
            if (this.getRoles() != null) {
                data.set("roles", om.valueToTree(this.getRoles()));
            }
            if (this.getUsers() != null) {
                data.set("users", om.valueToTree(this.getUsers()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.budgetsBudgetAction.BudgetsBudgetActionDefinitionIamActionDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BudgetsBudgetActionDefinitionIamActionDefinition.Jsii$Proxy that = (BudgetsBudgetActionDefinitionIamActionDefinition.Jsii$Proxy) o;

            if (!policyArn.equals(that.policyArn)) return false;
            if (this.groups != null ? !this.groups.equals(that.groups) : that.groups != null) return false;
            if (this.roles != null ? !this.roles.equals(that.roles) : that.roles != null) return false;
            return this.users != null ? this.users.equals(that.users) : that.users == null;
        }

        @Override
        public final int hashCode() {
            int result = this.policyArn.hashCode();
            result = 31 * result + (this.groups != null ? this.groups.hashCode() : 0);
            result = 31 * result + (this.roles != null ? this.roles.hashCode() : 0);
            result = 31 * result + (this.users != null ? this.users.hashCode() : 0);
            return result;
        }
    }
}
