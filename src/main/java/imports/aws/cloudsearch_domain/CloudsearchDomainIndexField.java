package imports.aws.cloudsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.260Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudsearchDomain.CloudsearchDomainIndexField")
@software.amazon.jsii.Jsii.Proxy(CloudsearchDomainIndexField.Jsii$Proxy.class)
public interface CloudsearchDomainIndexField extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#name CloudsearchDomain#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#type CloudsearchDomain#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#analysis_scheme CloudsearchDomain#analysis_scheme}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAnalysisScheme() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#default_value CloudsearchDomain#default_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#facet CloudsearchDomain#facet}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFacet() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#highlight CloudsearchDomain#highlight}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHighlight() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#return CloudsearchDomain#return}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReturnValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#search CloudsearchDomain#search}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSearch() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#sort CloudsearchDomain#sort}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#source_fields CloudsearchDomain#source_fields}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceFields() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudsearchDomainIndexField}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudsearchDomainIndexField}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudsearchDomainIndexField> {
        java.lang.String name;
        java.lang.String type;
        java.lang.String analysisScheme;
        java.lang.String defaultValue;
        java.lang.Object facet;
        java.lang.Object highlight;
        java.lang.Object returnValue;
        java.lang.Object search;
        java.lang.Object sort;
        java.lang.String sourceFields;

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#name CloudsearchDomain#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#type CloudsearchDomain#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getAnalysisScheme}
         * @param analysisScheme Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#analysis_scheme CloudsearchDomain#analysis_scheme}.
         * @return {@code this}
         */
        public Builder analysisScheme(java.lang.String analysisScheme) {
            this.analysisScheme = analysisScheme;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getDefaultValue}
         * @param defaultValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#default_value CloudsearchDomain#default_value}.
         * @return {@code this}
         */
        public Builder defaultValue(java.lang.String defaultValue) {
            this.defaultValue = defaultValue;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getFacet}
         * @param facet Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#facet CloudsearchDomain#facet}.
         * @return {@code this}
         */
        public Builder facet(java.lang.Boolean facet) {
            this.facet = facet;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getFacet}
         * @param facet Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#facet CloudsearchDomain#facet}.
         * @return {@code this}
         */
        public Builder facet(com.hashicorp.cdktf.IResolvable facet) {
            this.facet = facet;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getHighlight}
         * @param highlight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#highlight CloudsearchDomain#highlight}.
         * @return {@code this}
         */
        public Builder highlight(java.lang.Boolean highlight) {
            this.highlight = highlight;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getHighlight}
         * @param highlight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#highlight CloudsearchDomain#highlight}.
         * @return {@code this}
         */
        public Builder highlight(com.hashicorp.cdktf.IResolvable highlight) {
            this.highlight = highlight;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getReturnValue}
         * @param returnValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#return CloudsearchDomain#return}.
         * @return {@code this}
         */
        public Builder returnValue(java.lang.Boolean returnValue) {
            this.returnValue = returnValue;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getReturnValue}
         * @param returnValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#return CloudsearchDomain#return}.
         * @return {@code this}
         */
        public Builder returnValue(com.hashicorp.cdktf.IResolvable returnValue) {
            this.returnValue = returnValue;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getSearch}
         * @param search Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#search CloudsearchDomain#search}.
         * @return {@code this}
         */
        public Builder search(java.lang.Boolean search) {
            this.search = search;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getSearch}
         * @param search Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#search CloudsearchDomain#search}.
         * @return {@code this}
         */
        public Builder search(com.hashicorp.cdktf.IResolvable search) {
            this.search = search;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getSort}
         * @param sort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#sort CloudsearchDomain#sort}.
         * @return {@code this}
         */
        public Builder sort(java.lang.Boolean sort) {
            this.sort = sort;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getSort}
         * @param sort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#sort CloudsearchDomain#sort}.
         * @return {@code this}
         */
        public Builder sort(com.hashicorp.cdktf.IResolvable sort) {
            this.sort = sort;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainIndexField#getSourceFields}
         * @param sourceFields Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#source_fields CloudsearchDomain#source_fields}.
         * @return {@code this}
         */
        public Builder sourceFields(java.lang.String sourceFields) {
            this.sourceFields = sourceFields;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudsearchDomainIndexField}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudsearchDomainIndexField build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudsearchDomainIndexField}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudsearchDomainIndexField {
        private final java.lang.String name;
        private final java.lang.String type;
        private final java.lang.String analysisScheme;
        private final java.lang.String defaultValue;
        private final java.lang.Object facet;
        private final java.lang.Object highlight;
        private final java.lang.Object returnValue;
        private final java.lang.Object search;
        private final java.lang.Object sort;
        private final java.lang.String sourceFields;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.analysisScheme = software.amazon.jsii.Kernel.get(this, "analysisScheme", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultValue = software.amazon.jsii.Kernel.get(this, "defaultValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.facet = software.amazon.jsii.Kernel.get(this, "facet", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.highlight = software.amazon.jsii.Kernel.get(this, "highlight", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.returnValue = software.amazon.jsii.Kernel.get(this, "return", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.search = software.amazon.jsii.Kernel.get(this, "search", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sort = software.amazon.jsii.Kernel.get(this, "sort", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceFields = software.amazon.jsii.Kernel.get(this, "sourceFields", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.analysisScheme = builder.analysisScheme;
            this.defaultValue = builder.defaultValue;
            this.facet = builder.facet;
            this.highlight = builder.highlight;
            this.returnValue = builder.returnValue;
            this.search = builder.search;
            this.sort = builder.sort;
            this.sourceFields = builder.sourceFields;
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
        public final java.lang.String getAnalysisScheme() {
            return this.analysisScheme;
        }

        @Override
        public final java.lang.String getDefaultValue() {
            return this.defaultValue;
        }

        @Override
        public final java.lang.Object getFacet() {
            return this.facet;
        }

        @Override
        public final java.lang.Object getHighlight() {
            return this.highlight;
        }

        @Override
        public final java.lang.Object getReturnValue() {
            return this.returnValue;
        }

        @Override
        public final java.lang.Object getSearch() {
            return this.search;
        }

        @Override
        public final java.lang.Object getSort() {
            return this.sort;
        }

        @Override
        public final java.lang.String getSourceFields() {
            return this.sourceFields;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getAnalysisScheme() != null) {
                data.set("analysisScheme", om.valueToTree(this.getAnalysisScheme()));
            }
            if (this.getDefaultValue() != null) {
                data.set("defaultValue", om.valueToTree(this.getDefaultValue()));
            }
            if (this.getFacet() != null) {
                data.set("facet", om.valueToTree(this.getFacet()));
            }
            if (this.getHighlight() != null) {
                data.set("highlight", om.valueToTree(this.getHighlight()));
            }
            if (this.getReturnValue() != null) {
                data.set("return", om.valueToTree(this.getReturnValue()));
            }
            if (this.getSearch() != null) {
                data.set("search", om.valueToTree(this.getSearch()));
            }
            if (this.getSort() != null) {
                data.set("sort", om.valueToTree(this.getSort()));
            }
            if (this.getSourceFields() != null) {
                data.set("sourceFields", om.valueToTree(this.getSourceFields()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudsearchDomain.CloudsearchDomainIndexField"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudsearchDomainIndexField.Jsii$Proxy that = (CloudsearchDomainIndexField.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!type.equals(that.type)) return false;
            if (this.analysisScheme != null ? !this.analysisScheme.equals(that.analysisScheme) : that.analysisScheme != null) return false;
            if (this.defaultValue != null ? !this.defaultValue.equals(that.defaultValue) : that.defaultValue != null) return false;
            if (this.facet != null ? !this.facet.equals(that.facet) : that.facet != null) return false;
            if (this.highlight != null ? !this.highlight.equals(that.highlight) : that.highlight != null) return false;
            if (this.returnValue != null ? !this.returnValue.equals(that.returnValue) : that.returnValue != null) return false;
            if (this.search != null ? !this.search.equals(that.search) : that.search != null) return false;
            if (this.sort != null ? !this.sort.equals(that.sort) : that.sort != null) return false;
            return this.sourceFields != null ? this.sourceFields.equals(that.sourceFields) : that.sourceFields == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.analysisScheme != null ? this.analysisScheme.hashCode() : 0);
            result = 31 * result + (this.defaultValue != null ? this.defaultValue.hashCode() : 0);
            result = 31 * result + (this.facet != null ? this.facet.hashCode() : 0);
            result = 31 * result + (this.highlight != null ? this.highlight.hashCode() : 0);
            result = 31 * result + (this.returnValue != null ? this.returnValue.hashCode() : 0);
            result = 31 * result + (this.search != null ? this.search.hashCode() : 0);
            result = 31 * result + (this.sort != null ? this.sort.hashCode() : 0);
            result = 31 * result + (this.sourceFields != null ? this.sourceFields.hashCode() : 0);
            return result;
        }
    }
}
