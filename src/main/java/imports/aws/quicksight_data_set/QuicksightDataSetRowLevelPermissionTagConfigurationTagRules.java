package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionTagConfigurationTagRules")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetRowLevelPermissionTagConfigurationTagRules.Jsii$Proxy.class)
public interface QuicksightDataSetRowLevelPermissionTagConfigurationTagRules extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getColumnName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_key QuicksightDataSet#tag_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTagKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#match_all_value QuicksightDataSet#match_all_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMatchAllValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_multi_value_delimiter QuicksightDataSet#tag_multi_value_delimiter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTagMultiValueDelimiter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetRowLevelPermissionTagConfigurationTagRules}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetRowLevelPermissionTagConfigurationTagRules}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetRowLevelPermissionTagConfigurationTagRules> {
        java.lang.String columnName;
        java.lang.String tagKey;
        java.lang.String matchAllValue;
        java.lang.String tagMultiValueDelimiter;

        /**
         * Sets the value of {@link QuicksightDataSetRowLevelPermissionTagConfigurationTagRules#getColumnName}
         * @param columnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder columnName(java.lang.String columnName) {
            this.columnName = columnName;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetRowLevelPermissionTagConfigurationTagRules#getTagKey}
         * @param tagKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_key QuicksightDataSet#tag_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder tagKey(java.lang.String tagKey) {
            this.tagKey = tagKey;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetRowLevelPermissionTagConfigurationTagRules#getMatchAllValue}
         * @param matchAllValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#match_all_value QuicksightDataSet#match_all_value}.
         * @return {@code this}
         */
        public Builder matchAllValue(java.lang.String matchAllValue) {
            this.matchAllValue = matchAllValue;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetRowLevelPermissionTagConfigurationTagRules#getTagMultiValueDelimiter}
         * @param tagMultiValueDelimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_multi_value_delimiter QuicksightDataSet#tag_multi_value_delimiter}.
         * @return {@code this}
         */
        public Builder tagMultiValueDelimiter(java.lang.String tagMultiValueDelimiter) {
            this.tagMultiValueDelimiter = tagMultiValueDelimiter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetRowLevelPermissionTagConfigurationTagRules}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetRowLevelPermissionTagConfigurationTagRules build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetRowLevelPermissionTagConfigurationTagRules}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetRowLevelPermissionTagConfigurationTagRules {
        private final java.lang.String columnName;
        private final java.lang.String tagKey;
        private final java.lang.String matchAllValue;
        private final java.lang.String tagMultiValueDelimiter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.columnName = software.amazon.jsii.Kernel.get(this, "columnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tagKey = software.amazon.jsii.Kernel.get(this, "tagKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.matchAllValue = software.amazon.jsii.Kernel.get(this, "matchAllValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tagMultiValueDelimiter = software.amazon.jsii.Kernel.get(this, "tagMultiValueDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.columnName = java.util.Objects.requireNonNull(builder.columnName, "columnName is required");
            this.tagKey = java.util.Objects.requireNonNull(builder.tagKey, "tagKey is required");
            this.matchAllValue = builder.matchAllValue;
            this.tagMultiValueDelimiter = builder.tagMultiValueDelimiter;
        }

        @Override
        public final java.lang.String getColumnName() {
            return this.columnName;
        }

        @Override
        public final java.lang.String getTagKey() {
            return this.tagKey;
        }

        @Override
        public final java.lang.String getMatchAllValue() {
            return this.matchAllValue;
        }

        @Override
        public final java.lang.String getTagMultiValueDelimiter() {
            return this.tagMultiValueDelimiter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("columnName", om.valueToTree(this.getColumnName()));
            data.set("tagKey", om.valueToTree(this.getTagKey()));
            if (this.getMatchAllValue() != null) {
                data.set("matchAllValue", om.valueToTree(this.getMatchAllValue()));
            }
            if (this.getTagMultiValueDelimiter() != null) {
                data.set("tagMultiValueDelimiter", om.valueToTree(this.getTagMultiValueDelimiter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionTagConfigurationTagRules"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetRowLevelPermissionTagConfigurationTagRules.Jsii$Proxy that = (QuicksightDataSetRowLevelPermissionTagConfigurationTagRules.Jsii$Proxy) o;

            if (!columnName.equals(that.columnName)) return false;
            if (!tagKey.equals(that.tagKey)) return false;
            if (this.matchAllValue != null ? !this.matchAllValue.equals(that.matchAllValue) : that.matchAllValue != null) return false;
            return this.tagMultiValueDelimiter != null ? this.tagMultiValueDelimiter.equals(that.tagMultiValueDelimiter) : that.tagMultiValueDelimiter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.columnName.hashCode();
            result = 31 * result + (this.tagKey.hashCode());
            result = 31 * result + (this.matchAllValue != null ? this.matchAllValue.hashCode() : 0);
            result = 31 * result + (this.tagMultiValueDelimiter != null ? this.tagMultiValueDelimiter.hashCode() : 0);
            return result;
        }
    }
}
