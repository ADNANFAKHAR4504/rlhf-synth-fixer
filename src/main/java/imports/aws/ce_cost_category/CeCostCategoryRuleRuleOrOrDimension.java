package imports.aws.ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.200Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceCostCategory.CeCostCategoryRuleRuleOrOrDimension")
@software.amazon.jsii.Jsii.Proxy(CeCostCategoryRuleRuleOrOrDimension.Jsii$Proxy.class)
public interface CeCostCategoryRuleRuleOrOrDimension extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#key CeCostCategory#key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#match_options CeCostCategory#match_options}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getMatchOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#values CeCostCategory#values}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getValues() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CeCostCategoryRuleRuleOrOrDimension}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CeCostCategoryRuleRuleOrOrDimension}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CeCostCategoryRuleRuleOrOrDimension> {
        java.lang.String key;
        java.util.List<java.lang.String> matchOptions;
        java.util.List<java.lang.String> values;

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleOrOrDimension#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#key CeCostCategory#key}.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleOrOrDimension#getMatchOptions}
         * @param matchOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#match_options CeCostCategory#match_options}.
         * @return {@code this}
         */
        public Builder matchOptions(java.util.List<java.lang.String> matchOptions) {
            this.matchOptions = matchOptions;
            return this;
        }

        /**
         * Sets the value of {@link CeCostCategoryRuleRuleOrOrDimension#getValues}
         * @param values Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_cost_category#values CeCostCategory#values}.
         * @return {@code this}
         */
        public Builder values(java.util.List<java.lang.String> values) {
            this.values = values;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CeCostCategoryRuleRuleOrOrDimension}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CeCostCategoryRuleRuleOrOrDimension build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CeCostCategoryRuleRuleOrOrDimension}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CeCostCategoryRuleRuleOrOrDimension {
        private final java.lang.String key;
        private final java.util.List<java.lang.String> matchOptions;
        private final java.util.List<java.lang.String> values;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.matchOptions = software.amazon.jsii.Kernel.get(this, "matchOptions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.values = software.amazon.jsii.Kernel.get(this, "values", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.key = builder.key;
            this.matchOptions = builder.matchOptions;
            this.values = builder.values;
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        public final java.util.List<java.lang.String> getMatchOptions() {
            return this.matchOptions;
        }

        @Override
        public final java.util.List<java.lang.String> getValues() {
            return this.values;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKey() != null) {
                data.set("key", om.valueToTree(this.getKey()));
            }
            if (this.getMatchOptions() != null) {
                data.set("matchOptions", om.valueToTree(this.getMatchOptions()));
            }
            if (this.getValues() != null) {
                data.set("values", om.valueToTree(this.getValues()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ceCostCategory.CeCostCategoryRuleRuleOrOrDimension"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CeCostCategoryRuleRuleOrOrDimension.Jsii$Proxy that = (CeCostCategoryRuleRuleOrOrDimension.Jsii$Proxy) o;

            if (this.key != null ? !this.key.equals(that.key) : that.key != null) return false;
            if (this.matchOptions != null ? !this.matchOptions.equals(that.matchOptions) : that.matchOptions != null) return false;
            return this.values != null ? this.values.equals(that.values) : that.values == null;
        }

        @Override
        public final int hashCode() {
            int result = this.key != null ? this.key.hashCode() : 0;
            result = 31 * result + (this.matchOptions != null ? this.matchOptions.hashCode() : 0);
            result = 31 * result + (this.values != null ? this.values.hashCode() : 0);
            return result;
        }
    }
}
