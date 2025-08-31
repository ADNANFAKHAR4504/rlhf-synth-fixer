package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.434Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexDocumentMetadataConfigurationUpdates")
@software.amazon.jsii.Jsii.Proxy(KendraIndexDocumentMetadataConfigurationUpdates.Jsii$Proxy.class)
public interface KendraIndexDocumentMetadataConfigurationUpdates extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#name KendraIndex#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#type KendraIndex#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * relevance block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#relevance KendraIndex#relevance}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevance getRelevance() {
        return null;
    }

    /**
     * search block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#search KendraIndex#search}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearch getSearch() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraIndexDocumentMetadataConfigurationUpdates}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraIndexDocumentMetadataConfigurationUpdates}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraIndexDocumentMetadataConfigurationUpdates> {
        java.lang.String name;
        java.lang.String type;
        imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevance relevance;
        imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearch search;

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdates#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#name KendraIndex#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdates#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#type KendraIndex#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdates#getRelevance}
         * @param relevance relevance block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#relevance KendraIndex#relevance}
         * @return {@code this}
         */
        public Builder relevance(imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevance relevance) {
            this.relevance = relevance;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdates#getSearch}
         * @param search search block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#search KendraIndex#search}
         * @return {@code this}
         */
        public Builder search(imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearch search) {
            this.search = search;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraIndexDocumentMetadataConfigurationUpdates}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraIndexDocumentMetadataConfigurationUpdates build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraIndexDocumentMetadataConfigurationUpdates}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraIndexDocumentMetadataConfigurationUpdates {
        private final java.lang.String name;
        private final java.lang.String type;
        private final imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevance relevance;
        private final imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearch search;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.relevance = software.amazon.jsii.Kernel.get(this, "relevance", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevance.class));
            this.search = software.amazon.jsii.Kernel.get(this, "search", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearch.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.relevance = builder.relevance;
            this.search = builder.search;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevance getRelevance() {
            return this.relevance;
        }

        @Override
        public final imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearch getSearch() {
            return this.search;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getRelevance() != null) {
                data.set("relevance", om.valueToTree(this.getRelevance()));
            }
            if (this.getSearch() != null) {
                data.set("search", om.valueToTree(this.getSearch()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraIndex.KendraIndexDocumentMetadataConfigurationUpdates"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraIndexDocumentMetadataConfigurationUpdates.Jsii$Proxy that = (KendraIndexDocumentMetadataConfigurationUpdates.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!type.equals(that.type)) return false;
            if (this.relevance != null ? !this.relevance.equals(that.relevance) : that.relevance != null) return false;
            return this.search != null ? this.search.equals(that.search) : that.search == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.relevance != null ? this.relevance.hashCode() : 0);
            result = 31 * result + (this.search != null ? this.search.hashCode() : 0);
            return result;
        }
    }
}
