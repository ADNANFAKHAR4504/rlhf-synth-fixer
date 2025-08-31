package imports.aws.ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.200Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceCostCategory.CeCostCategorySplitChargeRule")
@software.amazon.jsii.Jsii.Proxy(CeCostCategorySplitChargeRule.Jsii$Proxy.class)
public interface CeCostCategorySplitChargeRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#method CeCostCategory#method}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMethod();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#source CeCostCategory#source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#targets CeCostCategory#targets}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTargets();

    /**
     * parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#parameter CeCostCategory#parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParameter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CeCostCategorySplitChargeRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CeCostCategorySplitChargeRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CeCostCategorySplitChargeRule> {
        java.lang.String method;
        java.lang.String source;
        java.util.List<java.lang.String> targets;
        java.lang.Object parameter;

        /**
         * Sets the value of {@link CeCostCategorySplitChargeRule#getMethod}
         * @param method Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#method CeCostCategory#method}. This parameter is required.
         * @return {@code this}
         */
        public Builder method(java.lang.String method) {
            this.method = method;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategorySplitChargeRule#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#source CeCostCategory#source}. This parameter is required.
         * @return {@code this}
         */
        public Builder source(java.lang.String source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategorySplitChargeRule#getTargets}
         * @param targets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#targets CeCostCategory#targets}. This parameter is required.
         * @return {@code this}
         */
        public Builder targets(java.util.List<java.lang.String> targets) {
            this.targets = targets;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategorySplitChargeRule#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#parameter CeCostCategory#parameter}
         * @return {@code this}
         */
        public Builder parameter(com.hashicorp.cdktf.IResolvable parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategorySplitChargeRule#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#parameter CeCostCategory#parameter}
         * @return {@code this}
         */
        public Builder parameter(java.util.List<? extends imports.aws.ce_cost_category.CeCostCategorySplitChargeRuleParameter> parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CeCostCategorySplitChargeRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CeCostCategorySplitChargeRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CeCostCategorySplitChargeRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CeCostCategorySplitChargeRule {
        private final java.lang.String method;
        private final java.lang.String source;
        private final java.util.List<java.lang.String> targets;
        private final java.lang.Object parameter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.method = software.amazon.jsii.Kernel.get(this, "method", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targets = software.amazon.jsii.Kernel.get(this, "targets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.parameter = software.amazon.jsii.Kernel.get(this, "parameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.method = java.util.Objects.requireNonNull(builder.method, "method is required");
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
            this.targets = java.util.Objects.requireNonNull(builder.targets, "targets is required");
            this.parameter = builder.parameter;
        }

        @Override
        public final java.lang.String getMethod() {
            return this.method;
        }

        @Override
        public final java.lang.String getSource() {
            return this.source;
        }

        @Override
        public final java.util.List<java.lang.String> getTargets() {
            return this.targets;
        }

        @Override
        public final java.lang.Object getParameter() {
            return this.parameter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("method", om.valueToTree(this.getMethod()));
            data.set("source", om.valueToTree(this.getSource()));
            data.set("targets", om.valueToTree(this.getTargets()));
            if (this.getParameter() != null) {
                data.set("parameter", om.valueToTree(this.getParameter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ceCostCategory.CeCostCategorySplitChargeRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CeCostCategorySplitChargeRule.Jsii$Proxy that = (CeCostCategorySplitChargeRule.Jsii$Proxy) o;

            if (!method.equals(that.method)) return false;
            if (!source.equals(that.source)) return false;
            if (!targets.equals(that.targets)) return false;
            return this.parameter != null ? this.parameter.equals(that.parameter) : that.parameter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.method.hashCode();
            result = 31 * result + (this.source.hashCode());
            result = 31 * result + (this.targets.hashCode());
            result = 31 * result + (this.parameter != null ? this.parameter.hashCode() : 0);
            return result;
        }
    }
}
