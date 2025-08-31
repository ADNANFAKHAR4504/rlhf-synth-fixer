package imports.aws.lakeformation_opt_in;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.491Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationOptIn.LakeformationOptInResourceDataLfTagPolicy")
@software.amazon.jsii.Jsii.Proxy(LakeformationOptInResourceDataLfTagPolicy.Jsii$Proxy.class)
public interface LakeformationOptInResourceDataLfTagPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#resource_type LakeformationOptIn#resource_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#catalog_id LakeformationOptIn#catalog_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalogId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#expression LakeformationOptIn#expression}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExpression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#expression_name LakeformationOptIn#expression_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExpressionName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LakeformationOptInResourceDataLfTagPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LakeformationOptInResourceDataLfTagPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LakeformationOptInResourceDataLfTagPolicy> {
        java.lang.String resourceType;
        java.lang.String catalogId;
        java.util.List<java.lang.String> expression;
        java.lang.String expressionName;

        /**
         * Sets the value of {@link LakeformationOptInResourceDataLfTagPolicy#getResourceType}
         * @param resourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#resource_type LakeformationOptIn#resource_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceType(java.lang.String resourceType) {
            this.resourceType = resourceType;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceDataLfTagPolicy#getCatalogId}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#catalog_id LakeformationOptIn#catalog_id}.
         * @return {@code this}
         */
        public Builder catalogId(java.lang.String catalogId) {
            this.catalogId = catalogId;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceDataLfTagPolicy#getExpression}
         * @param expression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#expression LakeformationOptIn#expression}.
         * @return {@code this}
         */
        public Builder expression(java.util.List<java.lang.String> expression) {
            this.expression = expression;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceDataLfTagPolicy#getExpressionName}
         * @param expressionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#expression_name LakeformationOptIn#expression_name}.
         * @return {@code this}
         */
        public Builder expressionName(java.lang.String expressionName) {
            this.expressionName = expressionName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LakeformationOptInResourceDataLfTagPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LakeformationOptInResourceDataLfTagPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LakeformationOptInResourceDataLfTagPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LakeformationOptInResourceDataLfTagPolicy {
        private final java.lang.String resourceType;
        private final java.lang.String catalogId;
        private final java.util.List<java.lang.String> expression;
        private final java.lang.String expressionName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.resourceType = software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogId = software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.expression = software.amazon.jsii.Kernel.get(this, "expression", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.expressionName = software.amazon.jsii.Kernel.get(this, "expressionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.resourceType = java.util.Objects.requireNonNull(builder.resourceType, "resourceType is required");
            this.catalogId = builder.catalogId;
            this.expression = builder.expression;
            this.expressionName = builder.expressionName;
        }

        @Override
        public final java.lang.String getResourceType() {
            return this.resourceType;
        }

        @Override
        public final java.lang.String getCatalogId() {
            return this.catalogId;
        }

        @Override
        public final java.util.List<java.lang.String> getExpression() {
            return this.expression;
        }

        @Override
        public final java.lang.String getExpressionName() {
            return this.expressionName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("resourceType", om.valueToTree(this.getResourceType()));
            if (this.getCatalogId() != null) {
                data.set("catalogId", om.valueToTree(this.getCatalogId()));
            }
            if (this.getExpression() != null) {
                data.set("expression", om.valueToTree(this.getExpression()));
            }
            if (this.getExpressionName() != null) {
                data.set("expressionName", om.valueToTree(this.getExpressionName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lakeformationOptIn.LakeformationOptInResourceDataLfTagPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LakeformationOptInResourceDataLfTagPolicy.Jsii$Proxy that = (LakeformationOptInResourceDataLfTagPolicy.Jsii$Proxy) o;

            if (!resourceType.equals(that.resourceType)) return false;
            if (this.catalogId != null ? !this.catalogId.equals(that.catalogId) : that.catalogId != null) return false;
            if (this.expression != null ? !this.expression.equals(that.expression) : that.expression != null) return false;
            return this.expressionName != null ? this.expressionName.equals(that.expressionName) : that.expressionName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.resourceType.hashCode();
            result = 31 * result + (this.catalogId != null ? this.catalogId.hashCode() : 0);
            result = 31 * result + (this.expression != null ? this.expression.hashCode() : 0);
            result = 31 * result + (this.expressionName != null ? this.expressionName.hashCode() : 0);
            return result;
        }
    }
}
