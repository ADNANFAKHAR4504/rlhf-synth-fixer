package imports.aws.data_aws_iam_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.672Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocumentStatement")
@software.amazon.jsii.Jsii.Proxy(DataAwsIamPolicyDocumentStatement.Jsii$Proxy.class)
public interface DataAwsIamPolicyDocumentStatement extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#actions DataAwsIamPolicyDocument#actions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getActions() {
        return null;
    }

    /**
     * condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#condition DataAwsIamPolicyDocument#condition}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCondition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#effect DataAwsIamPolicyDocument#effect}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEffect() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#not_actions DataAwsIamPolicyDocument#not_actions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotActions() {
        return null;
    }

    /**
     * not_principals block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#not_principals DataAwsIamPolicyDocument#not_principals}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNotPrincipals() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#not_resources DataAwsIamPolicyDocument#not_resources}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotResources() {
        return null;
    }

    /**
     * principals block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#principals DataAwsIamPolicyDocument#principals}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPrincipals() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#resources DataAwsIamPolicyDocument#resources}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResources() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#sid DataAwsIamPolicyDocument#sid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSid() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsIamPolicyDocumentStatement}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsIamPolicyDocumentStatement}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsIamPolicyDocumentStatement> {
        java.util.List<java.lang.String> actions;
        java.lang.Object condition;
        java.lang.String effect;
        java.util.List<java.lang.String> notActions;
        java.lang.Object notPrincipals;
        java.util.List<java.lang.String> notResources;
        java.lang.Object principals;
        java.util.List<java.lang.String> resources;
        java.lang.String sid;

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentStatement#getActions}
         * @param actions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#actions DataAwsIamPolicyDocument#actions}.
         * @return {@code this}
         */
        public Builder actions(java.util.List<java.lang.String> actions) {
            this.actions = actions;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentStatement#getCondition}
         * @param condition condition block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#condition DataAwsIamPolicyDocument#condition}
         * @return {@code this}
         */
        public Builder condition(com.hashicorp.cdktf.IResolvable condition) {
            this.condition = condition;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentStatement#getCondition}
         * @param condition condition block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#condition DataAwsIamPolicyDocument#condition}
         * @return {@code this}
         */
        public Builder condition(java.util.List<? extends imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementCondition> condition) {
            this.condition = condition;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentStatement#getEffect}
         * @param effect Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#effect DataAwsIamPolicyDocument#effect}.
         * @return {@code this}
         */
        public Builder effect(java.lang.String effect) {
            this.effect = effect;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentStatement#getNotActions}
         * @param notActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#not_actions DataAwsIamPolicyDocument#not_actions}.
         * @return {@code this}
         */
        public Builder notActions(java.util.List<java.lang.String> notActions) {
            this.notActions = notActions;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentStatement#getNotPrincipals}
         * @param notPrincipals not_principals block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#not_principals DataAwsIamPolicyDocument#not_principals}
         * @return {@code this}
         */
        public Builder notPrincipals(com.hashicorp.cdktf.IResolvable notPrincipals) {
            this.notPrincipals = notPrincipals;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentStatement#getNotPrincipals}
         * @param notPrincipals not_principals block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#not_principals DataAwsIamPolicyDocument#not_principals}
         * @return {@code this}
         */
        public Builder notPrincipals(java.util.List<? extends imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementNotPrincipals> notPrincipals) {
            this.notPrincipals = notPrincipals;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentStatement#getNotResources}
         * @param notResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#not_resources DataAwsIamPolicyDocument#not_resources}.
         * @return {@code this}
         */
        public Builder notResources(java.util.List<java.lang.String> notResources) {
            this.notResources = notResources;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentStatement#getPrincipals}
         * @param principals principals block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#principals DataAwsIamPolicyDocument#principals}
         * @return {@code this}
         */
        public Builder principals(com.hashicorp.cdktf.IResolvable principals) {
            this.principals = principals;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentStatement#getPrincipals}
         * @param principals principals block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#principals DataAwsIamPolicyDocument#principals}
         * @return {@code this}
         */
        public Builder principals(java.util.List<? extends imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementPrincipals> principals) {
            this.principals = principals;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentStatement#getResources}
         * @param resources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#resources DataAwsIamPolicyDocument#resources}.
         * @return {@code this}
         */
        public Builder resources(java.util.List<java.lang.String> resources) {
            this.resources = resources;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentStatement#getSid}
         * @param sid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#sid DataAwsIamPolicyDocument#sid}.
         * @return {@code this}
         */
        public Builder sid(java.lang.String sid) {
            this.sid = sid;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsIamPolicyDocumentStatement}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsIamPolicyDocumentStatement build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsIamPolicyDocumentStatement}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsIamPolicyDocumentStatement {
        private final java.util.List<java.lang.String> actions;
        private final java.lang.Object condition;
        private final java.lang.String effect;
        private final java.util.List<java.lang.String> notActions;
        private final java.lang.Object notPrincipals;
        private final java.util.List<java.lang.String> notResources;
        private final java.lang.Object principals;
        private final java.util.List<java.lang.String> resources;
        private final java.lang.String sid;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.actions = software.amazon.jsii.Kernel.get(this, "actions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.condition = software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.effect = software.amazon.jsii.Kernel.get(this, "effect", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notActions = software.amazon.jsii.Kernel.get(this, "notActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.notPrincipals = software.amazon.jsii.Kernel.get(this, "notPrincipals", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.notResources = software.amazon.jsii.Kernel.get(this, "notResources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.principals = software.amazon.jsii.Kernel.get(this, "principals", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.resources = software.amazon.jsii.Kernel.get(this, "resources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sid = software.amazon.jsii.Kernel.get(this, "sid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.actions = builder.actions;
            this.condition = builder.condition;
            this.effect = builder.effect;
            this.notActions = builder.notActions;
            this.notPrincipals = builder.notPrincipals;
            this.notResources = builder.notResources;
            this.principals = builder.principals;
            this.resources = builder.resources;
            this.sid = builder.sid;
        }

        @Override
        public final java.util.List<java.lang.String> getActions() {
            return this.actions;
        }

        @Override
        public final java.lang.Object getCondition() {
            return this.condition;
        }

        @Override
        public final java.lang.String getEffect() {
            return this.effect;
        }

        @Override
        public final java.util.List<java.lang.String> getNotActions() {
            return this.notActions;
        }

        @Override
        public final java.lang.Object getNotPrincipals() {
            return this.notPrincipals;
        }

        @Override
        public final java.util.List<java.lang.String> getNotResources() {
            return this.notResources;
        }

        @Override
        public final java.lang.Object getPrincipals() {
            return this.principals;
        }

        @Override
        public final java.util.List<java.lang.String> getResources() {
            return this.resources;
        }

        @Override
        public final java.lang.String getSid() {
            return this.sid;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getActions() != null) {
                data.set("actions", om.valueToTree(this.getActions()));
            }
            if (this.getCondition() != null) {
                data.set("condition", om.valueToTree(this.getCondition()));
            }
            if (this.getEffect() != null) {
                data.set("effect", om.valueToTree(this.getEffect()));
            }
            if (this.getNotActions() != null) {
                data.set("notActions", om.valueToTree(this.getNotActions()));
            }
            if (this.getNotPrincipals() != null) {
                data.set("notPrincipals", om.valueToTree(this.getNotPrincipals()));
            }
            if (this.getNotResources() != null) {
                data.set("notResources", om.valueToTree(this.getNotResources()));
            }
            if (this.getPrincipals() != null) {
                data.set("principals", om.valueToTree(this.getPrincipals()));
            }
            if (this.getResources() != null) {
                data.set("resources", om.valueToTree(this.getResources()));
            }
            if (this.getSid() != null) {
                data.set("sid", om.valueToTree(this.getSid()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocumentStatement"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsIamPolicyDocumentStatement.Jsii$Proxy that = (DataAwsIamPolicyDocumentStatement.Jsii$Proxy) o;

            if (this.actions != null ? !this.actions.equals(that.actions) : that.actions != null) return false;
            if (this.condition != null ? !this.condition.equals(that.condition) : that.condition != null) return false;
            if (this.effect != null ? !this.effect.equals(that.effect) : that.effect != null) return false;
            if (this.notActions != null ? !this.notActions.equals(that.notActions) : that.notActions != null) return false;
            if (this.notPrincipals != null ? !this.notPrincipals.equals(that.notPrincipals) : that.notPrincipals != null) return false;
            if (this.notResources != null ? !this.notResources.equals(that.notResources) : that.notResources != null) return false;
            if (this.principals != null ? !this.principals.equals(that.principals) : that.principals != null) return false;
            if (this.resources != null ? !this.resources.equals(that.resources) : that.resources != null) return false;
            return this.sid != null ? this.sid.equals(that.sid) : that.sid == null;
        }

        @Override
        public final int hashCode() {
            int result = this.actions != null ? this.actions.hashCode() : 0;
            result = 31 * result + (this.condition != null ? this.condition.hashCode() : 0);
            result = 31 * result + (this.effect != null ? this.effect.hashCode() : 0);
            result = 31 * result + (this.notActions != null ? this.notActions.hashCode() : 0);
            result = 31 * result + (this.notPrincipals != null ? this.notPrincipals.hashCode() : 0);
            result = 31 * result + (this.notResources != null ? this.notResources.hashCode() : 0);
            result = 31 * result + (this.principals != null ? this.principals.hashCode() : 0);
            result = 31 * result + (this.resources != null ? this.resources.hashCode() : 0);
            result = 31 * result + (this.sid != null ? this.sid.hashCode() : 0);
            return result;
        }
    }
}
