package imports.aws.ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.198Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceCostCategory.CeCostCategoryRuleRuleOrAnd")
@software.amazon.jsii.Jsii.Proxy(CeCostCategoryRuleRuleOrAnd.Jsii$Proxy.class)
public interface CeCostCategoryRuleRuleOrAnd extends software.amazon.jsii.JsiiSerializable {

    /**
     * cost_category block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#cost_category CeCostCategory#cost_category}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndCostCategory getCostCategory() {
        return null;
    }

    /**
     * dimension block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#dimension CeCostCategory#dimension}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndDimension getDimension() {
        return null;
    }

    /**
     * tags block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#tags CeCostCategory#tags}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndTags getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CeCostCategoryRuleRuleOrAnd}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CeCostCategoryRuleRuleOrAnd}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CeCostCategoryRuleRuleOrAnd> {
        imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndCostCategory costCategory;
        imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndDimension dimension;
        imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndTags tags;

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleOrAnd#getCostCategory}
         * @param costCategory cost_category block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#cost_category CeCostCategory#cost_category}
         * @return {@code this}
         */
        public Builder costCategory(imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndCostCategory costCategory) {
            this.costCategory = costCategory;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleOrAnd#getDimension}
         * @param dimension dimension block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#dimension CeCostCategory#dimension}
         * @return {@code this}
         */
        public Builder dimension(imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndDimension dimension) {
            this.dimension = dimension;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleOrAnd#getTags}
         * @param tags tags block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#tags CeCostCategory#tags}
         * @return {@code this}
         */
        public Builder tags(imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndTags tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CeCostCategoryRuleRuleOrAnd}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CeCostCategoryRuleRuleOrAnd build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CeCostCategoryRuleRuleOrAnd}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CeCostCategoryRuleRuleOrAnd {
        private final imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndCostCategory costCategory;
        private final imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndDimension dimension;
        private final imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndTags tags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.costCategory = software.amazon.jsii.Kernel.get(this, "costCategory", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndCostCategory.class));
            this.dimension = software.amazon.jsii.Kernel.get(this, "dimension", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndDimension.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndTags.class));
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
        public final imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndCostCategory getCostCategory() {
            return this.costCategory;
        }

        @Override
        public final imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndDimension getDimension() {
            return this.dimension;
        }

        @Override
        public final imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrAndTags getTags() {
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
            struct.set("fqn", om.valueToTree("aws.ceCostCategory.CeCostCategoryRuleRuleOrAnd"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CeCostCategoryRuleRuleOrAnd.Jsii$Proxy that = (CeCostCategoryRuleRuleOrAnd.Jsii$Proxy) o;

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
