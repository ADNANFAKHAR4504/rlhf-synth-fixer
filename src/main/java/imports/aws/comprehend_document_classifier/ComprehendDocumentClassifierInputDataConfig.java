package imports.aws.comprehend_document_classifier;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.comprehendDocumentClassifier.ComprehendDocumentClassifierInputDataConfig")
@software.amazon.jsii.Jsii.Proxy(ComprehendDocumentClassifierInputDataConfig.Jsii$Proxy.class)
public interface ComprehendDocumentClassifierInputDataConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * augmented_manifests block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#augmented_manifests ComprehendDocumentClassifier#augmented_manifests}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAugmentedManifests() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#data_format ComprehendDocumentClassifier#data_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#label_delimiter ComprehendDocumentClassifier#label_delimiter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLabelDelimiter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#s3_uri ComprehendDocumentClassifier#s3_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Uri() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#test_s3_uri ComprehendDocumentClassifier#test_s3_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTestS3Uri() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ComprehendDocumentClassifierInputDataConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ComprehendDocumentClassifierInputDataConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ComprehendDocumentClassifierInputDataConfig> {
        java.lang.Object augmentedManifests;
        java.lang.String dataFormat;
        java.lang.String labelDelimiter;
        java.lang.String s3Uri;
        java.lang.String testS3Uri;

        /**
         * Sets the value of {@link ComprehendDocumentClassifierInputDataConfig#getAugmentedManifests}
         * @param augmentedManifests augmented_manifests block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#augmented_manifests ComprehendDocumentClassifier#augmented_manifests}
         * @return {@code this}
         */
        public Builder augmentedManifests(com.hashicorp.cdktf.IResolvable augmentedManifests) {
            this.augmentedManifests = augmentedManifests;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierInputDataConfig#getAugmentedManifests}
         * @param augmentedManifests augmented_manifests block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#augmented_manifests ComprehendDocumentClassifier#augmented_manifests}
         * @return {@code this}
         */
        public Builder augmentedManifests(java.util.List<? extends imports.aws.comprehend_document_classifier.ComprehendDocumentClassifierInputDataConfigAugmentedManifests> augmentedManifests) {
            this.augmentedManifests = augmentedManifests;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierInputDataConfig#getDataFormat}
         * @param dataFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#data_format ComprehendDocumentClassifier#data_format}.
         * @return {@code this}
         */
        public Builder dataFormat(java.lang.String dataFormat) {
            this.dataFormat = dataFormat;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierInputDataConfig#getLabelDelimiter}
         * @param labelDelimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#label_delimiter ComprehendDocumentClassifier#label_delimiter}.
         * @return {@code this}
         */
        public Builder labelDelimiter(java.lang.String labelDelimiter) {
            this.labelDelimiter = labelDelimiter;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierInputDataConfig#getS3Uri}
         * @param s3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#s3_uri ComprehendDocumentClassifier#s3_uri}.
         * @return {@code this}
         */
        public Builder s3Uri(java.lang.String s3Uri) {
            this.s3Uri = s3Uri;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendDocumentClassifierInputDataConfig#getTestS3Uri}
         * @param testS3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_document_classifier#test_s3_uri ComprehendDocumentClassifier#test_s3_uri}.
         * @return {@code this}
         */
        public Builder testS3Uri(java.lang.String testS3Uri) {
            this.testS3Uri = testS3Uri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ComprehendDocumentClassifierInputDataConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ComprehendDocumentClassifierInputDataConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ComprehendDocumentClassifierInputDataConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ComprehendDocumentClassifierInputDataConfig {
        private final java.lang.Object augmentedManifests;
        private final java.lang.String dataFormat;
        private final java.lang.String labelDelimiter;
        private final java.lang.String s3Uri;
        private final java.lang.String testS3Uri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.augmentedManifests = software.amazon.jsii.Kernel.get(this, "augmentedManifests", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dataFormat = software.amazon.jsii.Kernel.get(this, "dataFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.labelDelimiter = software.amazon.jsii.Kernel.get(this, "labelDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Uri = software.amazon.jsii.Kernel.get(this, "s3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.testS3Uri = software.amazon.jsii.Kernel.get(this, "testS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.augmentedManifests = builder.augmentedManifests;
            this.dataFormat = builder.dataFormat;
            this.labelDelimiter = builder.labelDelimiter;
            this.s3Uri = builder.s3Uri;
            this.testS3Uri = builder.testS3Uri;
        }

        @Override
        public final java.lang.Object getAugmentedManifests() {
            return this.augmentedManifests;
        }

        @Override
        public final java.lang.String getDataFormat() {
            return this.dataFormat;
        }

        @Override
        public final java.lang.String getLabelDelimiter() {
            return this.labelDelimiter;
        }

        @Override
        public final java.lang.String getS3Uri() {
            return this.s3Uri;
        }

        @Override
        public final java.lang.String getTestS3Uri() {
            return this.testS3Uri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAugmentedManifests() != null) {
                data.set("augmentedManifests", om.valueToTree(this.getAugmentedManifests()));
            }
            if (this.getDataFormat() != null) {
                data.set("dataFormat", om.valueToTree(this.getDataFormat()));
            }
            if (this.getLabelDelimiter() != null) {
                data.set("labelDelimiter", om.valueToTree(this.getLabelDelimiter()));
            }
            if (this.getS3Uri() != null) {
                data.set("s3Uri", om.valueToTree(this.getS3Uri()));
            }
            if (this.getTestS3Uri() != null) {
                data.set("testS3Uri", om.valueToTree(this.getTestS3Uri()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.comprehendDocumentClassifier.ComprehendDocumentClassifierInputDataConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ComprehendDocumentClassifierInputDataConfig.Jsii$Proxy that = (ComprehendDocumentClassifierInputDataConfig.Jsii$Proxy) o;

            if (this.augmentedManifests != null ? !this.augmentedManifests.equals(that.augmentedManifests) : that.augmentedManifests != null) return false;
            if (this.dataFormat != null ? !this.dataFormat.equals(that.dataFormat) : that.dataFormat != null) return false;
            if (this.labelDelimiter != null ? !this.labelDelimiter.equals(that.labelDelimiter) : that.labelDelimiter != null) return false;
            if (this.s3Uri != null ? !this.s3Uri.equals(that.s3Uri) : that.s3Uri != null) return false;
            return this.testS3Uri != null ? this.testS3Uri.equals(that.testS3Uri) : that.testS3Uri == null;
        }

        @Override
        public final int hashCode() {
            int result = this.augmentedManifests != null ? this.augmentedManifests.hashCode() : 0;
            result = 31 * result + (this.dataFormat != null ? this.dataFormat.hashCode() : 0);
            result = 31 * result + (this.labelDelimiter != null ? this.labelDelimiter.hashCode() : 0);
            result = 31 * result + (this.s3Uri != null ? this.s3Uri.hashCode() : 0);
            result = 31 * result + (this.testS3Uri != null ? this.testS3Uri.hashCode() : 0);
            return result;
        }
    }
}
