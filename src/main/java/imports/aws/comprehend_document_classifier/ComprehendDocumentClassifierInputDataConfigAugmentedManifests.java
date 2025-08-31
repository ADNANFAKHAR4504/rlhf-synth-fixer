package imports.aws.comprehend_document_classifier;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.comprehendDocumentClassifier.ComprehendDocumentClassifierInputDataConfigAugmentedManifests")
@software.amazon.jsii.Jsii.Proxy(ComprehendDocumentClassifierInputDataConfigAugmentedManifests.Jsii$Proxy.class)
public interface ComprehendDocumentClassifierInputDataConfigAugmentedManifests extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#attribute_names ComprehendDocumentClassifier#attribute_names}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAttributeNames();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#s3_uri ComprehendDocumentClassifier#s3_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Uri();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#annotation_data_s3_uri ComprehendDocumentClassifier#annotation_data_s3_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAnnotationDataS3Uri() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#document_type ComprehendDocumentClassifier#document_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDocumentType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#source_documents_s3_uri ComprehendDocumentClassifier#source_documents_s3_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceDocumentsS3Uri() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#split ComprehendDocumentClassifier#split}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSplit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ComprehendDocumentClassifierInputDataConfigAugmentedManifests}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ComprehendDocumentClassifierInputDataConfigAugmentedManifests}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ComprehendDocumentClassifierInputDataConfigAugmentedManifests> {
        java.util.List<java.lang.String> attributeNames;
        java.lang.String s3Uri;
        java.lang.String annotationDataS3Uri;
        java.lang.String documentType;
        java.lang.String sourceDocumentsS3Uri;
        java.lang.String split;

        /**
         * Sets the value of {@link ComprehendDocumentClassifierInputDataConfigAugmentedManifests#getAttributeNames}
         * @param attributeNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#attribute_names ComprehendDocumentClassifier#attribute_names}. This parameter is required.
         * @return {@code this}
         */
        public Builder attributeNames(java.util.List<java.lang.String> attributeNames) {
            this.attributeNames = attributeNames;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierInputDataConfigAugmentedManifests#getS3Uri}
         * @param s3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#s3_uri ComprehendDocumentClassifier#s3_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Uri(java.lang.String s3Uri) {
            this.s3Uri = s3Uri;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierInputDataConfigAugmentedManifests#getAnnotationDataS3Uri}
         * @param annotationDataS3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#annotation_data_s3_uri ComprehendDocumentClassifier#annotation_data_s3_uri}.
         * @return {@code this}
         */
        public Builder annotationDataS3Uri(java.lang.String annotationDataS3Uri) {
            this.annotationDataS3Uri = annotationDataS3Uri;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierInputDataConfigAugmentedManifests#getDocumentType}
         * @param documentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#document_type ComprehendDocumentClassifier#document_type}.
         * @return {@code this}
         */
        public Builder documentType(java.lang.String documentType) {
            this.documentType = documentType;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierInputDataConfigAugmentedManifests#getSourceDocumentsS3Uri}
         * @param sourceDocumentsS3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#source_documents_s3_uri ComprehendDocumentClassifier#source_documents_s3_uri}.
         * @return {@code this}
         */
        public Builder sourceDocumentsS3Uri(java.lang.String sourceDocumentsS3Uri) {
            this.sourceDocumentsS3Uri = sourceDocumentsS3Uri;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierInputDataConfigAugmentedManifests#getSplit}
         * @param split Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#split ComprehendDocumentClassifier#split}.
         * @return {@code this}
         */
        public Builder split(java.lang.String split) {
            this.split = split;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ComprehendDocumentClassifierInputDataConfigAugmentedManifests}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ComprehendDocumentClassifierInputDataConfigAugmentedManifests build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ComprehendDocumentClassifierInputDataConfigAugmentedManifests}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ComprehendDocumentClassifierInputDataConfigAugmentedManifests {
        private final java.util.List<java.lang.String> attributeNames;
        private final java.lang.String s3Uri;
        private final java.lang.String annotationDataS3Uri;
        private final java.lang.String documentType;
        private final java.lang.String sourceDocumentsS3Uri;
        private final java.lang.String split;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.attributeNames = software.amazon.jsii.Kernel.get(this, "attributeNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.s3Uri = software.amazon.jsii.Kernel.get(this, "s3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.annotationDataS3Uri = software.amazon.jsii.Kernel.get(this, "annotationDataS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.documentType = software.amazon.jsii.Kernel.get(this, "documentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceDocumentsS3Uri = software.amazon.jsii.Kernel.get(this, "sourceDocumentsS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.split = software.amazon.jsii.Kernel.get(this, "split", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.attributeNames = java.util.Objects.requireNonNull(builder.attributeNames, "attributeNames is required");
            this.s3Uri = java.util.Objects.requireNonNull(builder.s3Uri, "s3Uri is required");
            this.annotationDataS3Uri = builder.annotationDataS3Uri;
            this.documentType = builder.documentType;
            this.sourceDocumentsS3Uri = builder.sourceDocumentsS3Uri;
            this.split = builder.split;
        }

        @Override
        public final java.util.List<java.lang.String> getAttributeNames() {
            return this.attributeNames;
        }

        @Override
        public final java.lang.String getS3Uri() {
            return this.s3Uri;
        }

        @Override
        public final java.lang.String getAnnotationDataS3Uri() {
            return this.annotationDataS3Uri;
        }

        @Override
        public final java.lang.String getDocumentType() {
            return this.documentType;
        }

        @Override
        public final java.lang.String getSourceDocumentsS3Uri() {
            return this.sourceDocumentsS3Uri;
        }

        @Override
        public final java.lang.String getSplit() {
            return this.split;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("attributeNames", om.valueToTree(this.getAttributeNames()));
            data.set("s3Uri", om.valueToTree(this.getS3Uri()));
            if (this.getAnnotationDataS3Uri() != null) {
                data.set("annotationDataS3Uri", om.valueToTree(this.getAnnotationDataS3Uri()));
            }
            if (this.getDocumentType() != null) {
                data.set("documentType", om.valueToTree(this.getDocumentType()));
            }
            if (this.getSourceDocumentsS3Uri() != null) {
                data.set("sourceDocumentsS3Uri", om.valueToTree(this.getSourceDocumentsS3Uri()));
            }
            if (this.getSplit() != null) {
                data.set("split", om.valueToTree(this.getSplit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.comprehendDocumentClassifier.ComprehendDocumentClassifierInputDataConfigAugmentedManifests"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ComprehendDocumentClassifierInputDataConfigAugmentedManifests.Jsii$Proxy that = (ComprehendDocumentClassifierInputDataConfigAugmentedManifests.Jsii$Proxy) o;

            if (!attributeNames.equals(that.attributeNames)) return false;
            if (!s3Uri.equals(that.s3Uri)) return false;
            if (this.annotationDataS3Uri != null ? !this.annotationDataS3Uri.equals(that.annotationDataS3Uri) : that.annotationDataS3Uri != null) return false;
            if (this.documentType != null ? !this.documentType.equals(that.documentType) : that.documentType != null) return false;
            if (this.sourceDocumentsS3Uri != null ? !this.sourceDocumentsS3Uri.equals(that.sourceDocumentsS3Uri) : that.sourceDocumentsS3Uri != null) return false;
            return this.split != null ? this.split.equals(that.split) : that.split == null;
        }

        @Override
        public final int hashCode() {
            int result = this.attributeNames.hashCode();
            result = 31 * result + (this.s3Uri.hashCode());
            result = 31 * result + (this.annotationDataS3Uri != null ? this.annotationDataS3Uri.hashCode() : 0);
            result = 31 * result + (this.documentType != null ? this.documentType.hashCode() : 0);
            result = 31 * result + (this.sourceDocumentsS3Uri != null ? this.sourceDocumentsS3Uri.hashCode() : 0);
            result = 31 * result + (this.split != null ? this.split.hashCode() : 0);
            return result;
        }
    }
}
