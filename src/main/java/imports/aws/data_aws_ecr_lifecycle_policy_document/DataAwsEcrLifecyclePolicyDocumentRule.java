package imports.aws.data_aws_ecr_lifecycle_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.620Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEcrLifecyclePolicyDocument.DataAwsEcrLifecyclePolicyDocumentRule")
@software.amazon.jsii.Jsii.Proxy(DataAwsEcrLifecyclePolicyDocumentRule.Jsii$Proxy.class)
public interface DataAwsEcrLifecyclePolicyDocumentRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#priority DataAwsEcrLifecyclePolicyDocument#priority}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPriority();

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#action DataAwsEcrLifecyclePolicyDocument#action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#description DataAwsEcrLifecyclePolicyDocument#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * selection block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#selection DataAwsEcrLifecyclePolicyDocument#selection}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSelection() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsEcrLifecyclePolicyDocumentRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsEcrLifecyclePolicyDocumentRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsEcrLifecyclePolicyDocumentRule> {
        java.lang.Number priority;
        java.lang.Object action;
        java.lang.String description;
        java.lang.Object selection;

        /**
         * Sets the value of {@link DataAwsEcrLifecyclePolicyDocumentRule#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#priority DataAwsEcrLifecyclePolicyDocument#priority}. This parameter is required.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcrLifecyclePolicyDocumentRule#getAction}
         * @param action action block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#action DataAwsEcrLifecyclePolicyDocument#action}
         * @return {@code this}
         */
        public Builder action(com.hashicorp.cdktf.IResolvable action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcrLifecyclePolicyDocumentRule#getAction}
         * @param action action block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#action DataAwsEcrLifecyclePolicyDocument#action}
         * @return {@code this}
         */
        public Builder action(java.util.List<? extends imports.aws.data_aws_ecr_lifecycle_policy_document.DataAwsEcrLifecyclePolicyDocumentRuleAction> action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcrLifecyclePolicyDocumentRule#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#description DataAwsEcrLifecyclePolicyDocument#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcrLifecyclePolicyDocumentRule#getSelection}
         * @param selection selection block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#selection DataAwsEcrLifecyclePolicyDocument#selection}
         * @return {@code this}
         */
        public Builder selection(com.hashicorp.cdktf.IResolvable selection) {
            this.selection = selection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcrLifecyclePolicyDocumentRule#getSelection}
         * @param selection selection block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecr_lifecycle_policy_document#selection DataAwsEcrLifecyclePolicyDocument#selection}
         * @return {@code this}
         */
        public Builder selection(java.util.List<? extends imports.aws.data_aws_ecr_lifecycle_policy_document.DataAwsEcrLifecyclePolicyDocumentRuleSelection> selection) {
            this.selection = selection;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsEcrLifecyclePolicyDocumentRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsEcrLifecyclePolicyDocumentRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsEcrLifecyclePolicyDocumentRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsEcrLifecyclePolicyDocumentRule {
        private final java.lang.Number priority;
        private final java.lang.Object action;
        private final java.lang.String description;
        private final java.lang.Object selection;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.selection = software.amazon.jsii.Kernel.get(this, "selection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.priority = java.util.Objects.requireNonNull(builder.priority, "priority is required");
            this.action = builder.action;
            this.description = builder.description;
            this.selection = builder.selection;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final java.lang.Object getAction() {
            return this.action;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getSelection() {
            return this.selection;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("priority", om.valueToTree(this.getPriority()));
            if (this.getAction() != null) {
                data.set("action", om.valueToTree(this.getAction()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getSelection() != null) {
                data.set("selection", om.valueToTree(this.getSelection()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsEcrLifecyclePolicyDocument.DataAwsEcrLifecyclePolicyDocumentRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsEcrLifecyclePolicyDocumentRule.Jsii$Proxy that = (DataAwsEcrLifecyclePolicyDocumentRule.Jsii$Proxy) o;

            if (!priority.equals(that.priority)) return false;
            if (this.action != null ? !this.action.equals(that.action) : that.action != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            return this.selection != null ? this.selection.equals(that.selection) : that.selection == null;
        }

        @Override
        public final int hashCode() {
            int result = this.priority.hashCode();
            result = 31 * result + (this.action != null ? this.action.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.selection != null ? this.selection.hashCode() : 0);
            return result;
        }
    }
}
