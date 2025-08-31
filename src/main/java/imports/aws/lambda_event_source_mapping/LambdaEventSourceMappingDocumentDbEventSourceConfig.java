package imports.aws.lambda_event_source_mapping;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.502Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaEventSourceMapping.LambdaEventSourceMappingDocumentDbEventSourceConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaEventSourceMappingDocumentDbEventSourceConfig.Jsii$Proxy.class)
public interface LambdaEventSourceMappingDocumentDbEventSourceConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#database_name LambdaEventSourceMapping#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#collection_name LambdaEventSourceMapping#collection_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCollectionName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#full_document LambdaEventSourceMapping#full_document}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFullDocument() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaEventSourceMappingDocumentDbEventSourceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaEventSourceMappingDocumentDbEventSourceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaEventSourceMappingDocumentDbEventSourceConfig> {
        java.lang.String databaseName;
        java.lang.String collectionName;
        java.lang.String fullDocument;

        /**
         * Sets the value of {@link LambdaEventSourceMappingDocumentDbEventSourceConfig#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#database_name LambdaEventSourceMapping#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link LambdaEventSourceMappingDocumentDbEventSourceConfig#getCollectionName}
         * @param collectionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#collection_name LambdaEventSourceMapping#collection_name}.
         * @return {@code this}
         */
        public Builder collectionName(java.lang.String collectionName) {
            this.collectionName = collectionName;
            return this;
        }

        /**
         * Sets the value of {@link LambdaEventSourceMappingDocumentDbEventSourceConfig#getFullDocument}
         * @param fullDocument Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#full_document LambdaEventSourceMapping#full_document}.
         * @return {@code this}
         */
        public Builder fullDocument(java.lang.String fullDocument) {
            this.fullDocument = fullDocument;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaEventSourceMappingDocumentDbEventSourceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaEventSourceMappingDocumentDbEventSourceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaEventSourceMappingDocumentDbEventSourceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaEventSourceMappingDocumentDbEventSourceConfig {
        private final java.lang.String databaseName;
        private final java.lang.String collectionName;
        private final java.lang.String fullDocument;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.collectionName = software.amazon.jsii.Kernel.get(this, "collectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fullDocument = software.amazon.jsii.Kernel.get(this, "fullDocument", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.collectionName = builder.collectionName;
            this.fullDocument = builder.fullDocument;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getCollectionName() {
            return this.collectionName;
        }

        @Override
        public final java.lang.String getFullDocument() {
            return this.fullDocument;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            if (this.getCollectionName() != null) {
                data.set("collectionName", om.valueToTree(this.getCollectionName()));
            }
            if (this.getFullDocument() != null) {
                data.set("fullDocument", om.valueToTree(this.getFullDocument()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaEventSourceMapping.LambdaEventSourceMappingDocumentDbEventSourceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaEventSourceMappingDocumentDbEventSourceConfig.Jsii$Proxy that = (LambdaEventSourceMappingDocumentDbEventSourceConfig.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (this.collectionName != null ? !this.collectionName.equals(that.collectionName) : that.collectionName != null) return false;
            return this.fullDocument != null ? this.fullDocument.equals(that.fullDocument) : that.fullDocument == null;
        }

        @Override
        public final int hashCode() {
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.collectionName != null ? this.collectionName.hashCode() : 0);
            result = 31 * result + (this.fullDocument != null ? this.fullDocument.hashCode() : 0);
            return result;
        }
    }
}
