package imports.aws.data_aws_lakeformation_permissions;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.718Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsLakeformationPermissions.DataAwsLakeformationPermissionsLfTagPolicy")
@software.amazon.jsii.Jsii.Proxy(DataAwsLakeformationPermissionsLfTagPolicy.Jsii$Proxy.class)
public interface DataAwsLakeformationPermissionsLfTagPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * expression block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#expression DataAwsLakeformationPermissions#expression}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getExpression();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#resource_type DataAwsLakeformationPermissions#resource_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_id DataAwsLakeformationPermissions#catalog_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalogId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsLakeformationPermissionsLfTagPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsLakeformationPermissionsLfTagPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsLakeformationPermissionsLfTagPolicy> {
        java.lang.Object expression;
        java.lang.String resourceType;
        java.lang.String catalogId;

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsLfTagPolicy#getExpression}
         * @param expression expression block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#expression DataAwsLakeformationPermissions#expression}
         * @return {@code this}
         */
        public Builder expression(com.hashicorp.cdktf.IResolvable expression) {
            this.expression = expression;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsLfTagPolicy#getExpression}
         * @param expression expression block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#expression DataAwsLakeformationPermissions#expression}
         * @return {@code this}
         */
        public Builder expression(java.util.List<? extends imports.aws.data_aws_lakeformation_permissions.DataAwsLakeformationPermissionsLfTagPolicyExpression> expression) {
            this.expression = expression;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsLfTagPolicy#getResourceType}
         * @param resourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#resource_type DataAwsLakeformationPermissions#resource_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceType(java.lang.String resourceType) {
            this.resourceType = resourceType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsLakeformationPermissionsLfTagPolicy#getCatalogId}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/lakeformation_permissions#catalog_id DataAwsLakeformationPermissions#catalog_id}.
         * @return {@code this}
         */
        public Builder catalogId(java.lang.String catalogId) {
            this.catalogId = catalogId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsLakeformationPermissionsLfTagPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsLakeformationPermissionsLfTagPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsLakeformationPermissionsLfTagPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsLakeformationPermissionsLfTagPolicy {
        private final java.lang.Object expression;
        private final java.lang.String resourceType;
        private final java.lang.String catalogId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.expression = software.amazon.jsii.Kernel.get(this, "expression", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.resourceType = software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogId = software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.expression = java.util.Objects.requireNonNull(builder.expression, "expression is required");
            this.resourceType = java.util.Objects.requireNonNull(builder.resourceType, "resourceType is required");
            this.catalogId = builder.catalogId;
        }

        @Override
        public final java.lang.Object getExpression() {
            return this.expression;
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
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("expression", om.valueToTree(this.getExpression()));
            data.set("resourceType", om.valueToTree(this.getResourceType()));
            if (this.getCatalogId() != null) {
                data.set("catalogId", om.valueToTree(this.getCatalogId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsLakeformationPermissions.DataAwsLakeformationPermissionsLfTagPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsLakeformationPermissionsLfTagPolicy.Jsii$Proxy that = (DataAwsLakeformationPermissionsLfTagPolicy.Jsii$Proxy) o;

            if (!expression.equals(that.expression)) return false;
            if (!resourceType.equals(that.resourceType)) return false;
            return this.catalogId != null ? this.catalogId.equals(that.catalogId) : that.catalogId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.expression.hashCode();
            result = 31 * result + (this.resourceType.hashCode());
            result = 31 * result + (this.catalogId != null ? this.catalogId.hashCode() : 0);
            return result;
        }
    }
}
