package imports.aws.ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.195Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceCostCategory.CeCostCategoryRuleRuleNotNot")
@software.amazon.jsii.Jsii.Proxy(CeCostCategoryRuleRuleNotNot.Jsii$Proxy.class)
public interface CeCostCategoryRuleRuleNotNot extends software.amazon.jsii.JsiiSerializable {

    /**
     * cost_category block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#cost_category CeCostCategory#cost_category}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotCostCategory getCostCategory() {
        return null;
    }

    /**
     * dimension block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#dimension CeCostCategory#dimension}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotDimension getDimension() {
        return null;
    }

    /**
     * tags block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#tags CeCostCategory#tags}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotTags getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CeCostCategoryRuleRuleNotNot}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CeCostCategoryRuleRuleNotNot}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CeCostCategoryRuleRuleNotNot> {
        imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotCostCategory costCategory;
        imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotDimension dimension;
        imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotTags tags;

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleNotNot#getCostCategory}
         * @param costCategory cost_category block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#cost_category CeCostCategory#cost_category}
         * @return {@code this}
         */
        public Builder costCategory(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotCostCategory costCategory) {
            this.costCategory = costCategory;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleNotNot#getDimension}
         * @param dimension dimension block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#dimension CeCostCategory#dimension}
         * @return {@code this}
         */
        public Builder dimension(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotDimension dimension) {
            this.dimension = dimension;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleNotNot#getTags}
         * @param tags tags block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#tags CeCostCategory#tags}
         * @return {@code this}
         */
        public Builder tags(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotTags tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CeCostCategoryRuleRuleNotNot}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CeCostCategoryRuleRuleNotNot build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CeCostCategoryRuleRuleNotNot}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CeCostCategoryRuleRuleNotNot {
        private final imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotCostCategory costCategory;
        private final imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotDimension dimension;
        private final imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotTags tags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.costCategory = software.amazon.jsii.Kernel.get(this, "costCategory", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotCostCategory.class));
            this.dimension = software.amazon.jsii.Kernel.get(this, "dimension", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotDimension.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotTags.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.costCategory = builder.costCategory;
            this.dimension = builder.dimension;
            this.tags = builder.tags;
        }

        @Override
        public final imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotCostCategory getCostCategory() {
            return this.costCategory;
        }

        @Override
        public final imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotDimension getDimension() {
            return this.dimension;
        }

        @Override
        public final imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotTags getTags() {
            return this.tags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCostCategory() != null) {
                data.set("costCategory", om.valueToTree(this.getCostCategory()));
            }
            if (this.getDimension() != null) {
                data.set("dimension", om.valueToTree(this.getDimension()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ceCostCategory.CeCostCategoryRuleRuleNotNot"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CeCostCategoryRuleRuleNotNot.Jsii$Proxy that = (CeCostCategoryRuleRuleNotNot.Jsii$Proxy) o;

            if (this.costCategory != null ? !this.costCategory.equals(that.costCategory) : that.costCategory != null) return false;
            if (this.dimension != null ? !this.dimension.equals(that.dimension) : that.dimension != null) return false;
            return this.tags != null ? this.tags.equals(that.tags) : that.tags == null;
        }

        @Override
        public final int hashCode() {
            int result = this.costCategory != null ? this.costCategory.hashCode() : 0;
            result = 31 * result + (this.dimension != null ? this.dimension.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            return result;
        }
    }
}
