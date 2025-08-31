package imports.aws.data_aws_networkmanager_core_network_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.772Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies")
@software.amazon.jsii.Jsii.Proxy(DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies.Jsii$Proxy.class)
public interface DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies extends software.amazon.jsii.JsiiSerializable {

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#action DataAwsNetworkmanagerCoreNetworkPolicyDocument#action}
     */
    @org.jetbrains.annotations.NotNull imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPoliciesAction getAction();

    /**
     * conditions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#conditions DataAwsNetworkmanagerCoreNetworkPolicyDocument#conditions}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getConditions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#rule_number DataAwsNetworkmanagerCoreNetworkPolicyDocument#rule_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getRuleNumber();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#condition_logic DataAwsNetworkmanagerCoreNetworkPolicyDocument#condition_logic}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConditionLogic() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#description DataAwsNetworkmanagerCoreNetworkPolicyDocument#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies> {
        imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPoliciesAction action;
        java.lang.Object conditions;
        java.lang.Number ruleNumber;
        java.lang.String conditionLogic;
        java.lang.String description;

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies#getAction}
         * @param action action block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#action DataAwsNetworkmanagerCoreNetworkPolicyDocument#action}
         * @return {@code this}
         */
        public Builder action(imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPoliciesAction action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies#getConditions}
         * @param conditions conditions block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#conditions DataAwsNetworkmanagerCoreNetworkPolicyDocument#conditions}
         * @return {@code this}
         */
        public Builder conditions(com.hashicorp.cdktf.IResolvable conditions) {
            this.conditions = conditions;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies#getConditions}
         * @param conditions conditions block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#conditions DataAwsNetworkmanagerCoreNetworkPolicyDocument#conditions}
         * @return {@code this}
         */
        public Builder conditions(java.util.List<? extends imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPoliciesConditions> conditions) {
            this.conditions = conditions;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies#getRuleNumber}
         * @param ruleNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#rule_number DataAwsNetworkmanagerCoreNetworkPolicyDocument#rule_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleNumber(java.lang.Number ruleNumber) {
            this.ruleNumber = ruleNumber;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies#getConditionLogic}
         * @param conditionLogic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#condition_logic DataAwsNetworkmanagerCoreNetworkPolicyDocument#condition_logic}.
         * @return {@code this}
         */
        public Builder conditionLogic(java.lang.String conditionLogic) {
            this.conditionLogic = conditionLogic;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/networkmanager_core_network_policy_document#description DataAwsNetworkmanagerCoreNetworkPolicyDocument#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies {
        private final imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPoliciesAction action;
        private final java.lang.Object conditions;
        private final java.lang.Number ruleNumber;
        private final java.lang.String conditionLogic;
        private final java.lang.String description;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPoliciesAction.class));
            this.conditions = software.amazon.jsii.Kernel.get(this, "conditions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ruleNumber = software.amazon.jsii.Kernel.get(this, "ruleNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.conditionLogic = software.amazon.jsii.Kernel.get(this, "conditionLogic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.conditions = java.util.Objects.requireNonNull(builder.conditions, "conditions is required");
            this.ruleNumber = java.util.Objects.requireNonNull(builder.ruleNumber, "ruleNumber is required");
            this.conditionLogic = builder.conditionLogic;
            this.description = builder.description;
        }

        @Override
        public final imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPoliciesAction getAction() {
            return this.action;
        }

        @Override
        public final java.lang.Object getConditions() {
            return this.conditions;
        }

        @Override
        public final java.lang.Number getRuleNumber() {
            return this.ruleNumber;
        }

        @Override
        public final java.lang.String getConditionLogic() {
            return this.conditionLogic;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("action", om.valueToTree(this.getAction()));
            data.set("conditions", om.valueToTree(this.getConditions()));
            data.set("ruleNumber", om.valueToTree(this.getRuleNumber()));
            if (this.getConditionLogic() != null) {
                data.set("conditionLogic", om.valueToTree(this.getConditionLogic()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies.Jsii$Proxy that = (DataAwsNetworkmanagerCoreNetworkPolicyDocumentAttachmentPolicies.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            if (!conditions.equals(that.conditions)) return false;
            if (!ruleNumber.equals(that.ruleNumber)) return false;
            if (this.conditionLogic != null ? !this.conditionLogic.equals(that.conditionLogic) : that.conditionLogic != null) return false;
            return this.description != null ? this.description.equals(that.description) : that.description == null;
        }

        @Override
        public final int hashCode() {
            int result = this.action.hashCode();
            result = 31 * result + (this.conditions.hashCode());
            result = 31 * result + (this.ruleNumber.hashCode());
            result = 31 * result + (this.conditionLogic != null ? this.conditionLogic.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            return result;
        }
    }
}
