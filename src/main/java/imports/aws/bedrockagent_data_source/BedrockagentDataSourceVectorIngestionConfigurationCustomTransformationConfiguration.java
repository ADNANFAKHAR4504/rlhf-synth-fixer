package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.167Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * intermediate_storage block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#intermediate_storage BedrockagentDataSource#intermediate_storage}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIntermediateStorage() {
        return null;
    }

    /**
     * transformation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#transformation BedrockagentDataSource#transformation}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTransformation() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration> {
        java.lang.Object intermediateStorage;
        java.lang.Object transformation;

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration#getIntermediateStorage}
         * @param intermediateStorage intermediate_storage block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#intermediate_storage BedrockagentDataSource#intermediate_storage}
         * @return {@code this}
         */
        public Builder intermediateStorage(com.hashicorp.cdktf.IResolvable intermediateStorage) {
            this.intermediateStorage = intermediateStorage;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration#getIntermediateStorage}
         * @param intermediateStorage intermediate_storage block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#intermediate_storage BedrockagentDataSource#intermediate_storage}
         * @return {@code this}
         */
        public Builder intermediateStorage(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorage> intermediateStorage) {
            this.intermediateStorage = intermediateStorage;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration#getTransformation}
         * @param transformation transformation block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#transformation BedrockagentDataSource#transformation}
         * @return {@code this}
         */
        public Builder transformation(com.hashicorp.cdktf.IResolvable transformation) {
            this.transformation = transformation;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration#getTransformation}
         * @param transformation transformation block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#transformation BedrockagentDataSource#transformation}
         * @return {@code this}
         */
        public Builder transformation(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation> transformation) {
            this.transformation = transformation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration {
        private final java.lang.Object intermediateStorage;
        private final java.lang.Object transformation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.intermediateStorage = software.amazon.jsii.Kernel.get(this, "intermediateStorage", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.transformation = software.amazon.jsii.Kernel.get(this, "transformation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.intermediateStorage = builder.intermediateStorage;
            this.transformation = builder.transformation;
        }

        @Override
        public final java.lang.Object getIntermediateStorage() {
            return this.intermediateStorage;
        }

        @Override
        public final java.lang.Object getTransformation() {
            return this.transformation;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIntermediateStorage() != null) {
                data.set("intermediateStorage", om.valueToTree(this.getIntermediateStorage()));
            }
            if (this.getTransformation() != null) {
                data.set("transformation", om.valueToTree(this.getTransformation()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration.Jsii$Proxy that = (BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration.Jsii$Proxy) o;

            if (this.intermediateStorage != null ? !this.intermediateStorage.equals(that.intermediateStorage) : that.intermediateStorage != null) return false;
            return this.transformation != null ? this.transformation.equals(that.transformation) : that.transformation == null;
        }

        @Override
        public final int hashCode() {
            int result = this.intermediateStorage != null ? this.intermediateStorage.hashCode() : 0;
            result = 31 * result + (this.transformation != null ? this.transformation.hashCode() : 0);
            return result;
        }
    }
}
