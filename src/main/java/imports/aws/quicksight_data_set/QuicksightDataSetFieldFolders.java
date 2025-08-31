package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.106Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetFieldFolders")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetFieldFolders.Jsii$Proxy.class)
public interface QuicksightDataSetFieldFolders extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#field_folders_id QuicksightDataSet#field_folders_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFieldFoldersId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getColumns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#description QuicksightDataSet#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetFieldFolders}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetFieldFolders}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetFieldFolders> {
        java.lang.String fieldFoldersId;
        java.util.List<java.lang.String> columns;
        java.lang.String description;

        /**
         * Sets the value of {@link QuicksightDataSetFieldFolders#getFieldFoldersId}
         * @param fieldFoldersId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#field_folders_id QuicksightDataSet#field_folders_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder fieldFoldersId(java.lang.String fieldFoldersId) {
            this.fieldFoldersId = fieldFoldersId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetFieldFolders#getColumns}
         * @param columns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#columns QuicksightDataSet#columns}.
         * @return {@code this}
         */
        public Builder columns(java.util.List<java.lang.String> columns) {
            this.columns = columns;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetFieldFolders#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#description QuicksightDataSet#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetFieldFolders}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetFieldFolders build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetFieldFolders}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetFieldFolders {
        private final java.lang.String fieldFoldersId;
        private final java.util.List<java.lang.String> columns;
        private final java.lang.String description;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fieldFoldersId = software.amazon.jsii.Kernel.get(this, "fieldFoldersId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.columns = software.amazon.jsii.Kernel.get(this, "columns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fieldFoldersId = java.util.Objects.requireNonNull(builder.fieldFoldersId, "fieldFoldersId is required");
            this.columns = builder.columns;
            this.description = builder.description;
        }

        @Override
        public final java.lang.String getFieldFoldersId() {
            return this.fieldFoldersId;
        }

        @Override
        public final java.util.List<java.lang.String> getColumns() {
            return this.columns;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("fieldFoldersId", om.valueToTree(this.getFieldFoldersId()));
            if (this.getColumns() != null) {
                data.set("columns", om.valueToTree(this.getColumns()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetFieldFolders"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetFieldFolders.Jsii$Proxy that = (QuicksightDataSetFieldFolders.Jsii$Proxy) o;

            if (!fieldFoldersId.equals(that.fieldFoldersId)) return false;
            if (this.columns != null ? !this.columns.equals(that.columns) : that.columns != null) return false;
            return this.description != null ? this.description.equals(that.description) : that.description == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fieldFoldersId.hashCode();
            result = 31 * result + (this.columns != null ? this.columns.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            return result;
        }
    }
}
