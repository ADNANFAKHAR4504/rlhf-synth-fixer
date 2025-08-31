package imports.aws.lakeformation_resource_lf_tags;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.497Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationResourceLfTags.LakeformationResourceLfTagsTable")
@software.amazon.jsii.Jsii.Proxy(LakeformationResourceLfTagsTable.Jsii$Proxy.class)
public interface LakeformationResourceLfTagsTable extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tags#database_name LakeformationResourceLfTags#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tags#catalog_id LakeformationResourceLfTags#catalog_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalogId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tags#name LakeformationResourceLfTags#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tags#wildcard LakeformationResourceLfTags#wildcard}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWildcard() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LakeformationResourceLfTagsTable}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LakeformationResourceLfTagsTable}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LakeformationResourceLfTagsTable> {
        java.lang.String databaseName;
        java.lang.String catalogId;
        java.lang.String name;
        java.lang.Object wildcard;

        /**
         * Sets the value of {@link LakeformationResourceLfTagsTable#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tags#database_name LakeformationResourceLfTags#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationResourceLfTagsTable#getCatalogId}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tags#catalog_id LakeformationResourceLfTags#catalog_id}.
         * @return {@code this}
         */
        public Builder catalogId(java.lang.String catalogId) {
            this.catalogId = catalogId;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationResourceLfTagsTable#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tags#name LakeformationResourceLfTags#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationResourceLfTagsTable#getWildcard}
         * @param wildcard Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tags#wildcard LakeformationResourceLfTags#wildcard}.
         * @return {@code this}
         */
        public Builder wildcard(java.lang.Boolean wildcard) {
            this.wildcard = wildcard;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationResourceLfTagsTable#getWildcard}
         * @param wildcard Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tags#wildcard LakeformationResourceLfTags#wildcard}.
         * @return {@code this}
         */
        public Builder wildcard(com.hashicorp.cdktf.IResolvable wildcard) {
            this.wildcard = wildcard;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LakeformationResourceLfTagsTable}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LakeformationResourceLfTagsTable build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LakeformationResourceLfTagsTable}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LakeformationResourceLfTagsTable {
        private final java.lang.String databaseName;
        private final java.lang.String catalogId;
        private final java.lang.String name;
        private final java.lang.Object wildcard;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogId = software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.wildcard = software.amazon.jsii.Kernel.get(this, "wildcard", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.catalogId = builder.catalogId;
            this.name = builder.name;
            this.wildcard = builder.wildcard;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getCatalogId() {
            return this.catalogId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getWildcard() {
            return this.wildcard;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            if (this.getCatalogId() != null) {
                data.set("catalogId", om.valueToTree(this.getCatalogId()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getWildcard() != null) {
                data.set("wildcard", om.valueToTree(this.getWildcard()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lakeformationResourceLfTags.LakeformationResourceLfTagsTable"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LakeformationResourceLfTagsTable.Jsii$Proxy that = (LakeformationResourceLfTagsTable.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (this.catalogId != null ? !this.catalogId.equals(that.catalogId) : that.catalogId != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            return this.wildcard != null ? this.wildcard.equals(that.wildcard) : that.wildcard == null;
        }

        @Override
        public final int hashCode() {
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.catalogId != null ? this.catalogId.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.wildcard != null ? this.wildcard.hashCode() : 0);
            return result;
        }
    }
}
