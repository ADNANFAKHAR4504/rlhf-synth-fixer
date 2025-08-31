package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.106Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransforms")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetLogicalTableMapDataTransforms.Jsii$Proxy.class)
public interface QuicksightDataSetLogicalTableMapDataTransforms extends software.amazon.jsii.JsiiSerializable {

    /**
     * cast_column_type_operation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#cast_column_type_operation QuicksightDataSet#cast_column_type_operation}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation getCastColumnTypeOperation() {
        return null;
    }

    /**
     * create_columns_operation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#create_columns_operation QuicksightDataSet#create_columns_operation}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation getCreateColumnsOperation() {
        return null;
    }

    /**
     * filter_operation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#filter_operation QuicksightDataSet#filter_operation}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsFilterOperation getFilterOperation() {
        return null;
    }

    /**
     * project_operation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#project_operation QuicksightDataSet#project_operation}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsProjectOperation getProjectOperation() {
        return null;
    }

    /**
     * rename_column_operation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#rename_column_operation QuicksightDataSet#rename_column_operation}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation getRenameColumnOperation() {
        return null;
    }

    /**
     * tag_column_operation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_column_operation QuicksightDataSet#tag_column_operation}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation getTagColumnOperation() {
        return null;
    }

    /**
     * untag_column_operation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#untag_column_operation QuicksightDataSet#untag_column_operation}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation getUntagColumnOperation() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetLogicalTableMapDataTransforms}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetLogicalTableMapDataTransforms}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetLogicalTableMapDataTransforms> {
        imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation castColumnTypeOperation;
        imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation createColumnsOperation;
        imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsFilterOperation filterOperation;
        imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsProjectOperation projectOperation;
        imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation renameColumnOperation;
        imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation tagColumnOperation;
        imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation untagColumnOperation;

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransforms#getCastColumnTypeOperation}
         * @param castColumnTypeOperation cast_column_type_operation block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#cast_column_type_operation QuicksightDataSet#cast_column_type_operation}
         * @return {@code this}
         */
        public Builder castColumnTypeOperation(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation castColumnTypeOperation) {
            this.castColumnTypeOperation = castColumnTypeOperation;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransforms#getCreateColumnsOperation}
         * @param createColumnsOperation create_columns_operation block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#create_columns_operation QuicksightDataSet#create_columns_operation}
         * @return {@code this}
         */
        public Builder createColumnsOperation(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation createColumnsOperation) {
            this.createColumnsOperation = createColumnsOperation;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransforms#getFilterOperation}
         * @param filterOperation filter_operation block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#filter_operation QuicksightDataSet#filter_operation}
         * @return {@code this}
         */
        public Builder filterOperation(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsFilterOperation filterOperation) {
            this.filterOperation = filterOperation;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransforms#getProjectOperation}
         * @param projectOperation project_operation block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#project_operation QuicksightDataSet#project_operation}
         * @return {@code this}
         */
        public Builder projectOperation(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsProjectOperation projectOperation) {
            this.projectOperation = projectOperation;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransforms#getRenameColumnOperation}
         * @param renameColumnOperation rename_column_operation block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#rename_column_operation QuicksightDataSet#rename_column_operation}
         * @return {@code this}
         */
        public Builder renameColumnOperation(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation renameColumnOperation) {
            this.renameColumnOperation = renameColumnOperation;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransforms#getTagColumnOperation}
         * @param tagColumnOperation tag_column_operation block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tag_column_operation QuicksightDataSet#tag_column_operation}
         * @return {@code this}
         */
        public Builder tagColumnOperation(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation tagColumnOperation) {
            this.tagColumnOperation = tagColumnOperation;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetLogicalTableMapDataTransforms#getUntagColumnOperation}
         * @param untagColumnOperation untag_column_operation block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#untag_column_operation QuicksightDataSet#untag_column_operation}
         * @return {@code this}
         */
        public Builder untagColumnOperation(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation untagColumnOperation) {
            this.untagColumnOperation = untagColumnOperation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetLogicalTableMapDataTransforms}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetLogicalTableMapDataTransforms build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetLogicalTableMapDataTransforms}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetLogicalTableMapDataTransforms {
        private final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation castColumnTypeOperation;
        private final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation createColumnsOperation;
        private final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsFilterOperation filterOperation;
        private final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsProjectOperation projectOperation;
        private final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation renameColumnOperation;
        private final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation tagColumnOperation;
        private final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation untagColumnOperation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.castColumnTypeOperation = software.amazon.jsii.Kernel.get(this, "castColumnTypeOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation.class));
            this.createColumnsOperation = software.amazon.jsii.Kernel.get(this, "createColumnsOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation.class));
            this.filterOperation = software.amazon.jsii.Kernel.get(this, "filterOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsFilterOperation.class));
            this.projectOperation = software.amazon.jsii.Kernel.get(this, "projectOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsProjectOperation.class));
            this.renameColumnOperation = software.amazon.jsii.Kernel.get(this, "renameColumnOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation.class));
            this.tagColumnOperation = software.amazon.jsii.Kernel.get(this, "tagColumnOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation.class));
            this.untagColumnOperation = software.amazon.jsii.Kernel.get(this, "untagColumnOperation", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.castColumnTypeOperation = builder.castColumnTypeOperation;
            this.createColumnsOperation = builder.createColumnsOperation;
            this.filterOperation = builder.filterOperation;
            this.projectOperation = builder.projectOperation;
            this.renameColumnOperation = builder.renameColumnOperation;
            this.tagColumnOperation = builder.tagColumnOperation;
            this.untagColumnOperation = builder.untagColumnOperation;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCastColumnTypeOperation getCastColumnTypeOperation() {
            return this.castColumnTypeOperation;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsCreateColumnsOperation getCreateColumnsOperation() {
            return this.createColumnsOperation;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsFilterOperation getFilterOperation() {
            return this.filterOperation;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsProjectOperation getProjectOperation() {
            return this.projectOperation;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsRenameColumnOperation getRenameColumnOperation() {
            return this.renameColumnOperation;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsTagColumnOperation getTagColumnOperation() {
            return this.tagColumnOperation;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapDataTransformsUntagColumnOperation getUntagColumnOperation() {
            return this.untagColumnOperation;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCastColumnTypeOperation() != null) {
                data.set("castColumnTypeOperation", om.valueToTree(this.getCastColumnTypeOperation()));
            }
            if (this.getCreateColumnsOperation() != null) {
                data.set("createColumnsOperation", om.valueToTree(this.getCreateColumnsOperation()));
            }
            if (this.getFilterOperation() != null) {
                data.set("filterOperation", om.valueToTree(this.getFilterOperation()));
            }
            if (this.getProjectOperation() != null) {
                data.set("projectOperation", om.valueToTree(this.getProjectOperation()));
            }
            if (this.getRenameColumnOperation() != null) {
                data.set("renameColumnOperation", om.valueToTree(this.getRenameColumnOperation()));
            }
            if (this.getTagColumnOperation() != null) {
                data.set("tagColumnOperation", om.valueToTree(this.getTagColumnOperation()));
            }
            if (this.getUntagColumnOperation() != null) {
                data.set("untagColumnOperation", om.valueToTree(this.getUntagColumnOperation()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetLogicalTableMapDataTransforms"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetLogicalTableMapDataTransforms.Jsii$Proxy that = (QuicksightDataSetLogicalTableMapDataTransforms.Jsii$Proxy) o;

            if (this.castColumnTypeOperation != null ? !this.castColumnTypeOperation.equals(that.castColumnTypeOperation) : that.castColumnTypeOperation != null) return false;
            if (this.createColumnsOperation != null ? !this.createColumnsOperation.equals(that.createColumnsOperation) : that.createColumnsOperation != null) return false;
            if (this.filterOperation != null ? !this.filterOperation.equals(that.filterOperation) : that.filterOperation != null) return false;
            if (this.projectOperation != null ? !this.projectOperation.equals(that.projectOperation) : that.projectOperation != null) return false;
            if (this.renameColumnOperation != null ? !this.renameColumnOperation.equals(that.renameColumnOperation) : that.renameColumnOperation != null) return false;
            if (this.tagColumnOperation != null ? !this.tagColumnOperation.equals(that.tagColumnOperation) : that.tagColumnOperation != null) return false;
            return this.untagColumnOperation != null ? this.untagColumnOperation.equals(that.untagColumnOperation) : that.untagColumnOperation == null;
        }

        @Override
        public final int hashCode() {
            int result = this.castColumnTypeOperation != null ? this.castColumnTypeOperation.hashCode() : 0;
            result = 31 * result + (this.createColumnsOperation != null ? this.createColumnsOperation.hashCode() : 0);
            result = 31 * result + (this.filterOperation != null ? this.filterOperation.hashCode() : 0);
            result = 31 * result + (this.projectOperation != null ? this.projectOperation.hashCode() : 0);
            result = 31 * result + (this.renameColumnOperation != null ? this.renameColumnOperation.hashCode() : 0);
            result = 31 * result + (this.tagColumnOperation != null ? this.tagColumnOperation.hashCode() : 0);
            result = 31 * result + (this.untagColumnOperation != null ? this.untagColumnOperation.hashCode() : 0);
            return result;
        }
    }
}
