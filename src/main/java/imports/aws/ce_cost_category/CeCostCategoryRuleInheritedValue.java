package imports.aws.ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.192Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceCostCategory.CeCostCategoryRuleInheritedValue")
@software.amazon.jsii.Jsii.Proxy(CeCostCategoryRuleInheritedValue.Jsii$Proxy.class)
public interface CeCostCategoryRuleInheritedValue extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#dimension_key CeCostCategory#dimension_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDimensionKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#dimension_name CeCostCategory#dimension_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDimensionName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CeCostCategoryRuleInheritedValue}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CeCostCategoryRuleInheritedValue}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CeCostCategoryRuleInheritedValue> {
        java.lang.String dimensionKey;
        java.lang.String dimensionName;

        /**
         * Sets the value of {@link CeCostCategoryRuleInheritedValue#getDimensionKey}
         * @param dimensionKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#dimension_key CeCostCategory#dimension_key}.
         * @return {@code this}
         */
        public Builder dimensionKey(java.lang.String dimensionKey) {
            this.dimensionKey = dimensionKey;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleInheritedValue#getDimensionName}
         * @param dimensionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#dimension_name CeCostCategory#dimension_name}.
         * @return {@code this}
         */
        public Builder dimensionName(java.lang.String dimensionName) {
            this.dimensionName = dimensionName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CeCostCategoryRuleInheritedValue}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CeCostCategoryRuleInheritedValue build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CeCostCategoryRuleInheritedValue}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CeCostCategoryRuleInheritedValue {
        private final java.lang.String dimensionKey;
        private final java.lang.String dimensionName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dimensionKey = software.amazon.jsii.Kernel.get(this, "dimensionKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dimensionName = software.amazon.jsii.Kernel.get(this, "dimensionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dimensionKey = builder.dimensionKey;
            this.dimensionName = builder.dimensionName;
        }

        @Override
        public final java.lang.String getDimensionKey() {
            return this.dimensionKey;
        }

        @Override
        public final java.lang.String getDimensionName() {
            return this.dimensionName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDimensionKey() != null) {
                data.set("dimensionKey", om.valueToTree(this.getDimensionKey()));
            }
            if (this.getDimensionName() != null) {
                data.set("dimensionName", om.valueToTree(this.getDimensionName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ceCostCategory.CeCostCategoryRuleInheritedValue"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CeCostCategoryRuleInheritedValue.Jsii$Proxy that = (CeCostCategoryRuleInheritedValue.Jsii$Proxy) o;

            if (this.dimensionKey != null ? !this.dimensionKey.equals(that.dimensionKey) : that.dimensionKey != null) return false;
            return this.dimensionName != null ? this.dimensionName.equals(that.dimensionName) : that.dimensionName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dimensionKey != null ? this.dimensionKey.hashCode() : 0;
            result = 31 * result + (this.dimensionName != null ? this.dimensionName.hashCode() : 0);
            return result;
        }
    }
}
