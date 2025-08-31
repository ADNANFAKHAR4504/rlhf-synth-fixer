package imports.aws.comprehend_entity_recognizer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.365Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.comprehendEntityRecognizer.ComprehendEntityRecognizerInputDataConfig")
@software.amazon.jsii.Jsii.Proxy(ComprehendEntityRecognizerInputDataConfig.Jsii$Proxy.class)
public interface ComprehendEntityRecognizerInputDataConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * entity_types block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#entity_types ComprehendEntityRecognizer#entity_types}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEntityTypes();

    /**
     * annotations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#annotations ComprehendEntityRecognizer#annotations}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotations getAnnotations() {
        return null;
    }

    /**
     * augmented_manifests block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#augmented_manifests ComprehendEntityRecognizer#augmented_manifests}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAugmentedManifests() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#data_format ComprehendEntityRecognizer#data_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataFormat() {
        return null;
    }

    /**
     * documents block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#documents ComprehendEntityRecognizer#documents}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigDocuments getDocuments() {
        return null;
    }

    /**
     * entity_list block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#entity_list ComprehendEntityRecognizer#entity_list}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityListStruct getEntityList() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ComprehendEntityRecognizerInputDataConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ComprehendEntityRecognizerInputDataConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ComprehendEntityRecognizerInputDataConfig> {
        java.lang.Object entityTypes;
        imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotations annotations;
        java.lang.Object augmentedManifests;
        java.lang.String dataFormat;
        imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigDocuments documents;
        imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityListStruct entityList;

        /**
         * Sets the value of {@link ComprehendEntityRecognizerInputDataConfig#getEntityTypes}
         * @param entityTypes entity_types block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#entity_types ComprehendEntityRecognizer#entity_types}
         * @return {@code this}
         */
        public Builder entityTypes(com.hashicorp.cdktf.IResolvable entityTypes) {
            this.entityTypes = entityTypes;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendEntityRecognizerInputDataConfig#getEntityTypes}
         * @param entityTypes entity_types block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#entity_types ComprehendEntityRecognizer#entity_types}
         * @return {@code this}
         */
        public Builder entityTypes(java.util.List<? extends imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityTypes> entityTypes) {
            this.entityTypes = entityTypes;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendEntityRecognizerInputDataConfig#getAnnotations}
         * @param annotations annotations block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#annotations ComprehendEntityRecognizer#annotations}
         * @return {@code this}
         */
        public Builder annotations(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotations annotations) {
            this.annotations = annotations;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendEntityRecognizerInputDataConfig#getAugmentedManifests}
         * @param augmentedManifests augmented_manifests block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#augmented_manifests ComprehendEntityRecognizer#augmented_manifests}
         * @return {@code this}
         */
        public Builder augmentedManifests(com.hashicorp.cdktf.IResolvable augmentedManifests) {
            this.augmentedManifests = augmentedManifests;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendEntityRecognizerInputDataConfig#getAugmentedManifests}
         * @param augmentedManifests augmented_manifests block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#augmented_manifests ComprehendEntityRecognizer#augmented_manifests}
         * @return {@code this}
         */
        public Builder augmentedManifests(java.util.List<? extends imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAugmentedManifests> augmentedManifests) {
            this.augmentedManifests = augmentedManifests;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendEntityRecognizerInputDataConfig#getDataFormat}
         * @param dataFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#data_format ComprehendEntityRecognizer#data_format}.
         * @return {@code this}
         */
        public Builder dataFormat(java.lang.String dataFormat) {
            this.dataFormat = dataFormat;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendEntityRecognizerInputDataConfig#getDocuments}
         * @param documents documents block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#documents ComprehendEntityRecognizer#documents}
         * @return {@code this}
         */
        public Builder documents(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigDocuments documents) {
            this.documents = documents;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendEntityRecognizerInputDataConfig#getEntityList}
         * @param entityList entity_list block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#entity_list ComprehendEntityRecognizer#entity_list}
         * @return {@code this}
         */
        public Builder entityList(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityListStruct entityList) {
            this.entityList = entityList;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ComprehendEntityRecognizerInputDataConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ComprehendEntityRecognizerInputDataConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ComprehendEntityRecognizerInputDataConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ComprehendEntityRecognizerInputDataConfig {
        private final java.lang.Object entityTypes;
        private final imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotations annotations;
        private final java.lang.Object augmentedManifests;
        private final java.lang.String dataFormat;
        private final imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigDocuments documents;
        private final imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityListStruct entityList;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.entityTypes = software.amazon.jsii.Kernel.get(this, "entityTypes", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.annotations = software.amazon.jsii.Kernel.get(this, "annotations", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotations.class));
            this.augmentedManifests = software.amazon.jsii.Kernel.get(this, "augmentedManifests", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dataFormat = software.amazon.jsii.Kernel.get(this, "dataFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.documents = software.amazon.jsii.Kernel.get(this, "documents", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigDocuments.class));
            this.entityList = software.amazon.jsii.Kernel.get(this, "entityList", software.amazon.jsii.NativeType.forClass(imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityListStruct.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.entityTypes = java.util.Objects.requireNonNull(builder.entityTypes, "entityTypes is required");
            this.annotations = builder.annotations;
            this.augmentedManifests = builder.augmentedManifests;
            this.dataFormat = builder.dataFormat;
            this.documents = builder.documents;
            this.entityList = builder.entityList;
        }

        @Override
        public final java.lang.Object getEntityTypes() {
            return this.entityTypes;
        }

        @Override
        public final imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigAnnotations getAnnotations() {
            return this.annotations;
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
        public final imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigDocuments getDocuments() {
            return this.documents;
        }

        @Override
        public final imports.aws.comprehend_entity_recognizer.ComprehendEntityRecognizerInputDataConfigEntityListStruct getEntityList() {
            return this.entityList;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("entityTypes", om.valueToTree(this.getEntityTypes()));
            if (this.getAnnotations() != null) {
                data.set("annotations", om.valueToTree(this.getAnnotations()));
            }
            if (this.getAugmentedManifests() != null) {
                data.set("augmentedManifests", om.valueToTree(this.getAugmentedManifests()));
            }
            if (this.getDataFormat() != null) {
                data.set("dataFormat", om.valueToTree(this.getDataFormat()));
            }
            if (this.getDocuments() != null) {
                data.set("documents", om.valueToTree(this.getDocuments()));
            }
            if (this.getEntityList() != null) {
                data.set("entityList", om.valueToTree(this.getEntityList()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.comprehendEntityRecognizer.ComprehendEntityRecognizerInputDataConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ComprehendEntityRecognizerInputDataConfig.Jsii$Proxy that = (ComprehendEntityRecognizerInputDataConfig.Jsii$Proxy) o;

            if (!entityTypes.equals(that.entityTypes)) return false;
            if (this.annotations != null ? !this.annotations.equals(that.annotations) : that.annotations != null) return false;
            if (this.augmentedManifests != null ? !this.augmentedManifests.equals(that.augmentedManifests) : that.augmentedManifests != null) return false;
            if (this.dataFormat != null ? !this.dataFormat.equals(that.dataFormat) : that.dataFormat != null) return false;
            if (this.documents != null ? !this.documents.equals(that.documents) : that.documents != null) return false;
            return this.entityList != null ? this.entityList.equals(that.entityList) : that.entityList == null;
        }

        @Override
        public final int hashCode() {
            int result = this.entityTypes.hashCode();
            result = 31 * result + (this.annotations != null ? this.annotations.hashCode() : 0);
            result = 31 * result + (this.augmentedManifests != null ? this.augmentedManifests.hashCode() : 0);
            result = 31 * result + (this.dataFormat != null ? this.dataFormat.hashCode() : 0);
            result = 31 * result + (this.documents != null ? this.documents.hashCode() : 0);
            result = 31 * result + (this.entityList != null ? this.entityList.hashCode() : 0);
            return result;
        }
    }
}
