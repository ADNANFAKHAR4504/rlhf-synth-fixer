package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.227Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateAction")
@software.amazon.jsii.Jsii.Proxy(FisExperimentTemplateAction.Jsii$Proxy.class)
public interface FisExperimentTemplateAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#action_id FisExperimentTemplate#action_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getActionId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#name FisExperimentTemplate#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#description FisExperimentTemplate#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#parameter FisExperimentTemplate#parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParameter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#start_after FisExperimentTemplate#start_after}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStartAfter() {
        return null;
    }

    /**
     * target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#target FisExperimentTemplate#target}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateActionTarget getTarget() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FisExperimentTemplateAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FisExperimentTemplateAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FisExperimentTemplateAction> {
        java.lang.String actionId;
        java.lang.String name;
        java.lang.String description;
        java.lang.Object parameter;
        java.util.List<java.lang.String> startAfter;
        imports.aws.fis_experiment_template.FisExperimentTemplateActionTarget target;

        /**
         * Sets the value of {@link FisExperimentTemplateAction#getActionId}
         * @param actionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#action_id FisExperimentTemplate#action_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder actionId(java.lang.String actionId) {
            this.actionId = actionId;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateAction#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#name FisExperimentTemplate#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateAction#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#description FisExperimentTemplate#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateAction#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#parameter FisExperimentTemplate#parameter}
         * @return {@code this}
         */
        public Builder parameter(com.hashicorp.cdktf.IResolvable parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateAction#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#parameter FisExperimentTemplate#parameter}
         * @return {@code this}
         */
        public Builder parameter(java.util.List<? extends imports.aws.fis_experiment_template.FisExperimentTemplateActionParameter> parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateAction#getStartAfter}
         * @param startAfter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#start_after FisExperimentTemplate#start_after}.
         * @return {@code this}
         */
        public Builder startAfter(java.util.List<java.lang.String> startAfter) {
            this.startAfter = startAfter;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateAction#getTarget}
         * @param target target block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#target FisExperimentTemplate#target}
         * @return {@code this}
         */
        public Builder target(imports.aws.fis_experiment_template.FisExperimentTemplateActionTarget target) {
            this.target = target;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FisExperimentTemplateAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FisExperimentTemplateAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FisExperimentTemplateAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FisExperimentTemplateAction {
        private final java.lang.String actionId;
        private final java.lang.String name;
        private final java.lang.String description;
        private final java.lang.Object parameter;
        private final java.util.List<java.lang.String> startAfter;
        private final imports.aws.fis_experiment_template.FisExperimentTemplateActionTarget target;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.actionId = software.amazon.jsii.Kernel.get(this, "actionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameter = software.amazon.jsii.Kernel.get(this, "parameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.startAfter = software.amazon.jsii.Kernel.get(this, "startAfter", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateActionTarget.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.actionId = java.util.Objects.requireNonNull(builder.actionId, "actionId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.description = builder.description;
            this.parameter = builder.parameter;
            this.startAfter = builder.startAfter;
            this.target = builder.target;
        }

        @Override
        public final java.lang.String getActionId() {
            return this.actionId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getParameter() {
            return this.parameter;
        }

        @Override
        public final java.util.List<java.lang.String> getStartAfter() {
            return this.startAfter;
        }

        @Override
        public final imports.aws.fis_experiment_template.FisExperimentTemplateActionTarget getTarget() {
            return this.target;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("actionId", om.valueToTree(this.getActionId()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getParameter() != null) {
                data.set("parameter", om.valueToTree(this.getParameter()));
            }
            if (this.getStartAfter() != null) {
                data.set("startAfter", om.valueToTree(this.getStartAfter()));
            }
            if (this.getTarget() != null) {
                data.set("target", om.valueToTree(this.getTarget()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fisExperimentTemplate.FisExperimentTemplateAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FisExperimentTemplateAction.Jsii$Proxy that = (FisExperimentTemplateAction.Jsii$Proxy) o;

            if (!actionId.equals(that.actionId)) return false;
            if (!name.equals(that.name)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.parameter != null ? !this.parameter.equals(that.parameter) : that.parameter != null) return false;
            if (this.startAfter != null ? !this.startAfter.equals(that.startAfter) : that.startAfter != null) return false;
            return this.target != null ? this.target.equals(that.target) : that.target == null;
        }

        @Override
        public final int hashCode() {
            int result = this.actionId.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.parameter != null ? this.parameter.hashCode() : 0);
            result = 31 * result + (this.startAfter != null ? this.startAfter.hashCode() : 0);
            result = 31 * result + (this.target != null ? this.target.hashCode() : 0);
            return result;
        }
    }
}
