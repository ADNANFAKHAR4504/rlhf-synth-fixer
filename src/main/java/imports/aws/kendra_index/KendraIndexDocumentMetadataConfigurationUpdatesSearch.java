package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.434Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexDocumentMetadataConfigurationUpdatesSearch")
@software.amazon.jsii.Jsii.Proxy(KendraIndexDocumentMetadataConfigurationUpdatesSearch.Jsii$Proxy.class)
public interface KendraIndexDocumentMetadataConfigurationUpdatesSearch extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#displayable KendraIndex#displayable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisplayable() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#facetable KendraIndex#facetable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFacetable() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#searchable KendraIndex#searchable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSearchable() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#sortable KendraIndex#sortable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSortable() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraIndexDocumentMetadataConfigurationUpdatesSearch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraIndexDocumentMetadataConfigurationUpdatesSearch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraIndexDocumentMetadataConfigurationUpdatesSearch> {
        java.lang.Object displayable;
        java.lang.Object facetable;
        java.lang.Object searchable;
        java.lang.Object sortable;

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesSearch#getDisplayable}
         * @param displayable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#displayable KendraIndex#displayable}.
         * @return {@code this}
         */
        public Builder displayable(java.lang.Boolean displayable) {
            this.displayable = displayable;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesSearch#getDisplayable}
         * @param displayable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#displayable KendraIndex#displayable}.
         * @return {@code this}
         */
        public Builder displayable(com.hashicorp.cdktf.IResolvable displayable) {
            this.displayable = displayable;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesSearch#getFacetable}
         * @param facetable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#facetable KendraIndex#facetable}.
         * @return {@code this}
         */
        public Builder facetable(java.lang.Boolean facetable) {
            this.facetable = facetable;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesSearch#getFacetable}
         * @param facetable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#facetable KendraIndex#facetable}.
         * @return {@code this}
         */
        public Builder facetable(com.hashicorp.cdktf.IResolvable facetable) {
            this.facetable = facetable;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesSearch#getSearchable}
         * @param searchable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#searchable KendraIndex#searchable}.
         * @return {@code this}
         */
        public Builder searchable(java.lang.Boolean searchable) {
            this.searchable = searchable;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesSearch#getSearchable}
         * @param searchable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#searchable KendraIndex#searchable}.
         * @return {@code this}
         */
        public Builder searchable(com.hashicorp.cdktf.IResolvable searchable) {
            this.searchable = searchable;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesSearch#getSortable}
         * @param sortable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#sortable KendraIndex#sortable}.
         * @return {@code this}
         */
        public Builder sortable(java.lang.Boolean sortable) {
            this.sortable = sortable;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesSearch#getSortable}
         * @param sortable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#sortable KendraIndex#sortable}.
         * @return {@code this}
         */
        public Builder sortable(com.hashicorp.cdktf.IResolvable sortable) {
            this.sortable = sortable;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraIndexDocumentMetadataConfigurationUpdatesSearch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraIndexDocumentMetadataConfigurationUpdatesSearch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraIndexDocumentMetadataConfigurationUpdatesSearch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraIndexDocumentMetadataConfigurationUpdatesSearch {
        private final java.lang.Object displayable;
        private final java.lang.Object facetable;
        private final java.lang.Object searchable;
        private final java.lang.Object sortable;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.displayable = software.amazon.jsii.Kernel.get(this, "displayable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.facetable = software.amazon.jsii.Kernel.get(this, "facetable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.searchable = software.amazon.jsii.Kernel.get(this, "searchable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sortable = software.amazon.jsii.Kernel.get(this, "sortable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.displayable = builder.displayable;
            this.facetable = builder.facetable;
            this.searchable = builder.searchable;
            this.sortable = builder.sortable;
        }

        @Override
        public final java.lang.Object getDisplayable() {
            return this.displayable;
        }

        @Override
        public final java.lang.Object getFacetable() {
            return this.facetable;
        }

        @Override
        public final java.lang.Object getSearchable() {
            return this.searchable;
        }

        @Override
        public final java.lang.Object getSortable() {
            return this.sortable;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDisplayable() != null) {
                data.set("displayable", om.valueToTree(this.getDisplayable()));
            }
            if (this.getFacetable() != null) {
                data.set("facetable", om.valueToTree(this.getFacetable()));
            }
            if (this.getSearchable() != null) {
                data.set("searchable", om.valueToTree(this.getSearchable()));
            }
            if (this.getSortable() != null) {
                data.set("sortable", om.valueToTree(this.getSortable()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraIndex.KendraIndexDocumentMetadataConfigurationUpdatesSearch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraIndexDocumentMetadataConfigurationUpdatesSearch.Jsii$Proxy that = (KendraIndexDocumentMetadataConfigurationUpdatesSearch.Jsii$Proxy) o;

            if (this.displayable != null ? !this.displayable.equals(that.displayable) : that.displayable != null) return false;
            if (this.facetable != null ? !this.facetable.equals(that.facetable) : that.facetable != null) return false;
            if (this.searchable != null ? !this.searchable.equals(that.searchable) : that.searchable != null) return false;
            return this.sortable != null ? this.sortable.equals(that.sortable) : that.sortable == null;
        }

        @Override
        public final int hashCode() {
            int result = this.displayable != null ? this.displayable.hashCode() : 0;
            result = 31 * result + (this.facetable != null ? this.facetable.hashCode() : 0);
            result = 31 * result + (this.searchable != null ? this.searchable.hashCode() : 0);
            result = 31 * result + (this.sortable != null ? this.sortable.hashCode() : 0);
            return result;
        }
    }
}
