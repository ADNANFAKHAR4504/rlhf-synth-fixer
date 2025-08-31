package imports.aws.ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.192Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceCostCategory.CeCostCategoryRule")
@software.amazon.jsii.Jsii.Proxy(CeCostCategoryRule.Jsii$Proxy.class)
public interface CeCostCategoryRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * inherited_value block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#inherited_value CeCostCategory#inherited_value}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValue getInheritedValue() {
        return null;
    }

    /**
     * rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#rule CeCostCategory#rule}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRule getRule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#type CeCostCategory#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#value CeCostCategory#value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CeCostCategoryRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CeCostCategoryRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CeCostCategoryRule> {
        imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValue inheritedValue;
        imports.aws.ce_cost_category.CeCostCategoryRuleRule rule;
        java.lang.String type;
        java.lang.String value;

        /**
         * Sets the value of {@link CeCostCategoryRule#getInheritedValue}
         * @param inheritedValue inherited_value block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#inherited_value CeCostCategory#inherited_value}
         * @return {@code this}
         */
        public Builder inheritedValue(imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValue inheritedValue) {
            this.inheritedValue = inheritedValue;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRule#getRule}
         * @param rule rule block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#rule CeCostCategory#rule}
         * @return {@code this}
         */
        public Builder rule(imports.aws.ce_cost_category.CeCostCategoryRuleRule rule) {
            this.rule = rule;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRule#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#type CeCostCategory#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRule#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#value CeCostCategory#value}.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CeCostCategoryRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CeCostCategoryRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CeCostCategoryRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CeCostCategoryRule {
        private final imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValue inheritedValue;
        private final imports.aws.ce_cost_category.CeCostCategoryRuleRule rule;
        private final java.lang.String type;
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.inheritedValue = software.amazon.jsii.Kernel.get(this, "inheritedValue", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValue.class));
            this.rule = software.amazon.jsii.Kernel.get(this, "rule", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRule.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.inheritedValue = builder.inheritedValue;
            this.rule = builder.rule;
            this.type = builder.type;
            this.value = builder.value;
        }

        @Override
        public final imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValue getInheritedValue() {
            return this.inheritedValue;
        }

        @Override
        public final imports.aws.ce_cost_category.CeCostCategoryRuleRule getRule() {
            return this.rule;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInheritedValue() != null) {
                data.set("inheritedValue", om.valueToTree(this.getInheritedValue()));
            }
            if (this.getRule() != null) {
                data.set("rule", om.valueToTree(this.getRule()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }
            if (this.getValue() != null) {
                data.set("value", om.valueToTree(this.getValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ceCostCategory.CeCostCategoryRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CeCostCategoryRule.Jsii$Proxy that = (CeCostCategoryRule.Jsii$Proxy) o;

            if (this.inheritedValue != null ? !this.inheritedValue.equals(that.inheritedValue) : that.inheritedValue != null) return false;
            if (this.rule != null ? !this.rule.equals(that.rule) : that.rule != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
            return this.value != null ? this.value.equals(that.value) : that.value == null;
        }

        @Override
        public final int hashCode() {
            int result = this.inheritedValue != null ? this.inheritedValue.hashCode() : 0;
            result = 31 * result + (this.rule != null ? this.rule.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            result = 31 * result + (this.value != null ? this.value.hashCode() : 0);
            return result;
        }
    }
}
