package imports.aws.ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.193Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceCostCategory.CeCostCategoryRuleRuleAnd")
@software.amazon.jsii.Jsii.Proxy(CeCostCategoryRuleRuleAnd.Jsii$Proxy.class)
public interface CeCostCategoryRuleRuleAnd extends software.amazon.jsii.JsiiSerializable {

    /**
     * and block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#and CeCostCategory#and}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAnd() {
        return null;
    }

    /**
     * cost_category block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#cost_category CeCostCategory#cost_category}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndCostCategory getCostCategory() {
        return null;
    }

    /**
     * dimension block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#dimension CeCostCategory#dimension}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndDimension getDimension() {
        return null;
    }

    /**
     * not block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#not CeCostCategory#not}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndNot getNot() {
        return null;
    }

    /**
     * or block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#or CeCostCategory#or}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOr() {
        return null;
    }

    /**
     * tags block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#tags CeCostCategory#tags}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndTags getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CeCostCategoryRuleRuleAnd}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CeCostCategoryRuleRuleAnd}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CeCostCategoryRuleRuleAnd> {
        java.lang.Object and;
        imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndCostCategory costCategory;
        imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndDimension dimension;
        imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndNot not;
        java.lang.Object or;
        imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndTags tags;

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleAnd#getAnd}
         * @param and and block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#and CeCostCategory#and}
         * @return {@code this}
         */
        public Builder and(com.hashicorp.cdktf.IResolvable and) {
            this.and = and;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleAnd#getAnd}
         * @param and and block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#and CeCostCategory#and}
         * @return {@code this}
         */
        public Builder and(java.util.List<? extends imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndAnd> and) {
            this.and = and;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleAnd#getCostCategory}
         * @param costCategory cost_category block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#cost_category CeCostCategory#cost_category}
         * @return {@code this}
         */
        public Builder costCategory(imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndCostCategory costCategory) {
            this.costCategory = costCategory;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleAnd#getDimension}
         * @param dimension dimension block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#dimension CeCostCategory#dimension}
         * @return {@code this}
         */
        public Builder dimension(imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndDimension dimension) {
            this.dimension = dimension;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleAnd#getNot}
         * @param not not block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#not CeCostCategory#not}
         * @return {@code this}
         */
        public Builder not(imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndNot not) {
            this.not = not;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleAnd#getOr}
         * @param or or block.
         *           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#or CeCostCategory#or}
         * @return {@code this}
         */
        public Builder or(com.hashicorp.cdktf.IResolvable or) {
            this.or = or;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleAnd#getOr}
         * @param or or block.
         *           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#or CeCostCategory#or}
         * @return {@code this}
         */
        public Builder or(java.util.List<? extends imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndOr> or) {
            this.or = or;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleAnd#getTags}
         * @param tags tags block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#tags CeCostCategory#tags}
         * @return {@code this}
         */
        public Builder tags(imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndTags tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CeCostCategoryRuleRuleAnd}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CeCostCategoryRuleRuleAnd build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CeCostCategoryRuleRuleAnd}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CeCostCategoryRuleRuleAnd {
        private final java.lang.Object and;
        private final imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndCostCategory costCategory;
        private final imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndDimension dimension;
        private final imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndNot not;
        private final java.lang.Object or;
        private final imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndTags tags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.and = software.amazon.jsii.Kernel.get(this, "and", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.costCategory = software.amazon.jsii.Kernel.get(this, "costCategory", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndCostCategory.class));
            this.dimension = software.amazon.jsii.Kernel.get(this, "dimension", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndDimension.class));
            this.not = software.amazon.jsii.Kernel.get(this, "not", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndNot.class));
            this.or = software.amazon.jsii.Kernel.get(this, "or", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndTags.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.and = builder.and;
            this.costCategory = builder.costCategory;
            this.dimension = builder.dimension;
            this.not = builder.not;
            this.or = builder.or;
            this.tags = builder.tags;
        }

        @Override
        public final java.lang.Object getAnd() {
            return this.and;
        }

        @Override
        public final imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndCostCategory getCostCategory() {
            return this.costCategory;
        }

        @Override
        public final imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndDimension getDimension() {
            return this.dimension;
        }

        @Override
        public final imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndNot getNot() {
            return this.not;
        }

        @Override
        public final java.lang.Object getOr() {
            return this.or;
        }

        @Override
        public final imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndTags getTags() {
            return this.tags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAnd() != null) {
                data.set("and", om.valueToTree(this.getAnd()));
            }
            if (this.getCostCategory() != null) {
                data.set("costCategory", om.valueToTree(this.getCostCategory()));
            }
            if (this.getDimension() != null) {
                data.set("dimension", om.valueToTree(this.getDimension()));
            }
            if (this.getNot() != null) {
                data.set("not", om.valueToTree(this.getNot()));
            }
            if (this.getOr() != null) {
                data.set("or", om.valueToTree(this.getOr()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ceCostCategory.CeCostCategoryRuleRuleAnd"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CeCostCategoryRuleRuleAnd.Jsii$Proxy that = (CeCostCategoryRuleRuleAnd.Jsii$Proxy) o;

            if (this.and != null ? !this.and.equals(that.and) : that.and != null) return false;
            if (this.costCategory != null ? !this.costCategory.equals(that.costCategory) : that.costCategory != null) return false;
            if (this.dimension != null ? !this.dimension.equals(that.dimension) : that.dimension != null) return false;
            if (this.not != null ? !this.not.equals(that.not) : that.not != null) return false;
            if (this.or != null ? !this.or.equals(that.or) : that.or != null) return false;
            return this.tags != null ? this.tags.equals(that.tags) : that.tags == null;
        }

        @Override
        public final int hashCode() {
            int result = this.and != null ? this.and.hashCode() : 0;
            result = 31 * result + (this.costCategory != null ? this.costCategory.hashCode() : 0);
            result = 31 * result + (this.dimension != null ? this.dimension.hashCode() : 0);
            result = 31 * result + (this.not != null ? this.not.hashCode() : 0);
            result = 31 * result + (this.or != null ? this.or.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            return result;
        }
    }
}
