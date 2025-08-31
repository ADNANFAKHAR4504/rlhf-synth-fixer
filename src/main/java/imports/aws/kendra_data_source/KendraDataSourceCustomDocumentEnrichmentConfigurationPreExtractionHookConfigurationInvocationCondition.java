package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.432Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition.Jsii$Proxy.class)
public interface KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#condition_document_attribute_key KendraDataSource#condition_document_attribute_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConditionDocumentAttributeKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#operator KendraDataSource#operator}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOperator();

    /**
     * condition_on_value block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#condition_on_value KendraDataSource#condition_on_value}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationConditionConditionOnValue getConditionOnValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition> {
        java.lang.String conditionDocumentAttributeKey;
        java.lang.String operator;
        imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationConditionConditionOnValue conditionOnValue;

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition#getConditionDocumentAttributeKey}
         * @param conditionDocumentAttributeKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#condition_document_attribute_key KendraDataSource#condition_document_attribute_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder conditionDocumentAttributeKey(java.lang.String conditionDocumentAttributeKey) {
            this.conditionDocumentAttributeKey = conditionDocumentAttributeKey;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition#getOperator}
         * @param operator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#operator KendraDataSource#operator}. This parameter is required.
         * @return {@code this}
         */
        public Builder operator(java.lang.String operator) {
            this.operator = operator;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition#getConditionOnValue}
         * @param conditionOnValue condition_on_value block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#condition_on_value KendraDataSource#condition_on_value}
         * @return {@code this}
         */
        public Builder conditionOnValue(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationConditionConditionOnValue conditionOnValue) {
            this.conditionOnValue = conditionOnValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition {
        private final java.lang.String conditionDocumentAttributeKey;
        private final java.lang.String operator;
        private final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationConditionConditionOnValue conditionOnValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.conditionDocumentAttributeKey = software.amazon.jsii.Kernel.get(this, "conditionDocumentAttributeKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.operator = software.amazon.jsii.Kernel.get(this, "operator", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.conditionOnValue = software.amazon.jsii.Kernel.get(this, "conditionOnValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationConditionConditionOnValue.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.conditionDocumentAttributeKey = java.util.Objects.requireNonNull(builder.conditionDocumentAttributeKey, "conditionDocumentAttributeKey is required");
            this.operator = java.util.Objects.requireNonNull(builder.operator, "operator is required");
            this.conditionOnValue = builder.conditionOnValue;
        }

        @Override
        public final java.lang.String getConditionDocumentAttributeKey() {
            return this.conditionDocumentAttributeKey;
        }

        @Override
        public final java.lang.String getOperator() {
            return this.operator;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationConditionConditionOnValue getConditionOnValue() {
            return this.conditionOnValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("conditionDocumentAttributeKey", om.valueToTree(this.getConditionDocumentAttributeKey()));
            data.set("operator", om.valueToTree(this.getOperator()));
            if (this.getConditionOnValue() != null) {
                data.set("conditionOnValue", om.valueToTree(this.getConditionOnValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition.Jsii$Proxy that = (KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition.Jsii$Proxy) o;

            if (!conditionDocumentAttributeKey.equals(that.conditionDocumentAttributeKey)) return false;
            if (!operator.equals(that.operator)) return false;
            return this.conditionOnValue != null ? this.conditionOnValue.equals(that.conditionOnValue) : that.conditionOnValue == null;
        }

        @Override
        public final int hashCode() {
            int result = this.conditionDocumentAttributeKey.hashCode();
            result = 31 * result + (this.operator.hashCode());
            result = 31 * result + (this.conditionOnValue != null ? this.conditionOnValue.hashCode() : 0);
            return result;
        }
    }
}
