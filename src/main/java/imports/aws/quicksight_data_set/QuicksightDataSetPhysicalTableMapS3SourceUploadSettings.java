package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.112Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3SourceUploadSettings")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetPhysicalTableMapS3SourceUploadSettings.Jsii$Proxy.class)
public interface QuicksightDataSetPhysicalTableMapS3SourceUploadSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#contains_header QuicksightDataSet#contains_header}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContainsHeader() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#delimiter QuicksightDataSet#delimiter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDelimiter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format QuicksightDataSet#format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#start_from_row QuicksightDataSet#start_from_row}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getStartFromRow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#text_qualifier QuicksightDataSet#text_qualifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTextQualifier() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetPhysicalTableMapS3SourceUploadSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetPhysicalTableMapS3SourceUploadSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetPhysicalTableMapS3SourceUploadSettings> {
        java.lang.Object containsHeader;
        java.lang.String delimiter;
        java.lang.String format;
        java.lang.Number startFromRow;
        java.lang.String textQualifier;

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapS3SourceUploadSettings#getContainsHeader}
         * @param containsHeader Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#contains_header QuicksightDataSet#contains_header}.
         * @return {@code this}
         */
        public Builder containsHeader(java.lang.Boolean containsHeader) {
            this.containsHeader = containsHeader;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapS3SourceUploadSettings#getContainsHeader}
         * @param containsHeader Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#contains_header QuicksightDataSet#contains_header}.
         * @return {@code this}
         */
        public Builder containsHeader(com.hashicorp.cdktf.IResolvable containsHeader) {
            this.containsHeader = containsHeader;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapS3SourceUploadSettings#getDelimiter}
         * @param delimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#delimiter QuicksightDataSet#delimiter}.
         * @return {@code this}
         */
        public Builder delimiter(java.lang.String delimiter) {
            this.delimiter = delimiter;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapS3SourceUploadSettings#getFormat}
         * @param format Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#format QuicksightDataSet#format}.
         * @return {@code this}
         */
        public Builder format(java.lang.String format) {
            this.format = format;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapS3SourceUploadSettings#getStartFromRow}
         * @param startFromRow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#start_from_row QuicksightDataSet#start_from_row}.
         * @return {@code this}
         */
        public Builder startFromRow(java.lang.Number startFromRow) {
            this.startFromRow = startFromRow;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapS3SourceUploadSettings#getTextQualifier}
         * @param textQualifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#text_qualifier QuicksightDataSet#text_qualifier}.
         * @return {@code this}
         */
        public Builder textQualifier(java.lang.String textQualifier) {
            this.textQualifier = textQualifier;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetPhysicalTableMapS3SourceUploadSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetPhysicalTableMapS3SourceUploadSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetPhysicalTableMapS3SourceUploadSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetPhysicalTableMapS3SourceUploadSettings {
        private final java.lang.Object containsHeader;
        private final java.lang.String delimiter;
        private final java.lang.String format;
        private final java.lang.Number startFromRow;
        private final java.lang.String textQualifier;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containsHeader = software.amazon.jsii.Kernel.get(this, "containsHeader", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.delimiter = software.amazon.jsii.Kernel.get(this, "delimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.format = software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startFromRow = software.amazon.jsii.Kernel.get(this, "startFromRow", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.textQualifier = software.amazon.jsii.Kernel.get(this, "textQualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containsHeader = builder.containsHeader;
            this.delimiter = builder.delimiter;
            this.format = builder.format;
            this.startFromRow = builder.startFromRow;
            this.textQualifier = builder.textQualifier;
        }

        @Override
        public final java.lang.Object getContainsHeader() {
            return this.containsHeader;
        }

        @Override
        public final java.lang.String getDelimiter() {
            return this.delimiter;
        }

        @Override
        public final java.lang.String getFormat() {
            return this.format;
        }

        @Override
        public final java.lang.Number getStartFromRow() {
            return this.startFromRow;
        }

        @Override
        public final java.lang.String getTextQualifier() {
            return this.textQualifier;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContainsHeader() != null) {
                data.set("containsHeader", om.valueToTree(this.getContainsHeader()));
            }
            if (this.getDelimiter() != null) {
                data.set("delimiter", om.valueToTree(this.getDelimiter()));
            }
            if (this.getFormat() != null) {
                data.set("format", om.valueToTree(this.getFormat()));
            }
            if (this.getStartFromRow() != null) {
                data.set("startFromRow", om.valueToTree(this.getStartFromRow()));
            }
            if (this.getTextQualifier() != null) {
                data.set("textQualifier", om.valueToTree(this.getTextQualifier()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3SourceUploadSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetPhysicalTableMapS3SourceUploadSettings.Jsii$Proxy that = (QuicksightDataSetPhysicalTableMapS3SourceUploadSettings.Jsii$Proxy) o;

            if (this.containsHeader != null ? !this.containsHeader.equals(that.containsHeader) : that.containsHeader != null) return false;
            if (this.delimiter != null ? !this.delimiter.equals(that.delimiter) : that.delimiter != null) return false;
            if (this.format != null ? !this.format.equals(that.format) : that.format != null) return false;
            if (this.startFromRow != null ? !this.startFromRow.equals(that.startFromRow) : that.startFromRow != null) return false;
            return this.textQualifier != null ? this.textQualifier.equals(that.textQualifier) : that.textQualifier == null;
        }

        @Override
        public final int hashCode() {
            int result = this.containsHeader != null ? this.containsHeader.hashCode() : 0;
            result = 31 * result + (this.delimiter != null ? this.delimiter.hashCode() : 0);
            result = 31 * result + (this.format != null ? this.format.hashCode() : 0);
            result = 31 * result + (this.startFromRow != null ? this.startFromRow.hashCode() : 0);
            result = 31 * result + (this.textQualifier != null ? this.textQualifier.hashCode() : 0);
            return result;
        }
    }
}
