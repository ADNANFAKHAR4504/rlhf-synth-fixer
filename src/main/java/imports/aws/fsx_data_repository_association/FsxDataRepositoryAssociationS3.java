package imports.aws.fsx_data_repository_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.243Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxDataRepositoryAssociation.FsxDataRepositoryAssociationS3")
@software.amazon.jsii.Jsii.Proxy(FsxDataRepositoryAssociationS3.Jsii$Proxy.class)
public interface FsxDataRepositoryAssociationS3 extends software.amazon.jsii.JsiiSerializable {

    /**
     * auto_export_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#auto_export_policy FsxDataRepositoryAssociation#auto_export_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoExportPolicy getAutoExportPolicy() {
        return null;
    }

    /**
     * auto_import_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#auto_import_policy FsxDataRepositoryAssociation#auto_import_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoImportPolicy getAutoImportPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxDataRepositoryAssociationS3}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxDataRepositoryAssociationS3}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxDataRepositoryAssociationS3> {
        imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoExportPolicy autoExportPolicy;
        imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoImportPolicy autoImportPolicy;

        /**
         * Sets the value of {@link FsxDataRepositoryAssociationS3#getAutoExportPolicy}
         * @param autoExportPolicy auto_export_policy block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#auto_export_policy FsxDataRepositoryAssociation#auto_export_policy}
         * @return {@code this}
         */
        public Builder autoExportPolicy(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoExportPolicy autoExportPolicy) {
            this.autoExportPolicy = autoExportPolicy;
            return this;
        }

        /**
         * Sets the value of {@link FsxDataRepositoryAssociationS3#getAutoImportPolicy}
         * @param autoImportPolicy auto_import_policy block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#auto_import_policy FsxDataRepositoryAssociation#auto_import_policy}
         * @return {@code this}
         */
        public Builder autoImportPolicy(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoImportPolicy autoImportPolicy) {
            this.autoImportPolicy = autoImportPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxDataRepositoryAssociationS3}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxDataRepositoryAssociationS3 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxDataRepositoryAssociationS3}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxDataRepositoryAssociationS3 {
        private final imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoExportPolicy autoExportPolicy;
        private final imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoImportPolicy autoImportPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.autoExportPolicy = software.amazon.jsii.Kernel.get(this, "autoExportPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoExportPolicy.class));
            this.autoImportPolicy = software.amazon.jsii.Kernel.get(this, "autoImportPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoImportPolicy.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.autoExportPolicy = builder.autoExportPolicy;
            this.autoImportPolicy = builder.autoImportPolicy;
        }

        @Override
        public final imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoExportPolicy getAutoExportPolicy() {
            return this.autoExportPolicy;
        }

        @Override
        public final imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoImportPolicy getAutoImportPolicy() {
            return this.autoImportPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAutoExportPolicy() != null) {
                data.set("autoExportPolicy", om.valueToTree(this.getAutoExportPolicy()));
            }
            if (this.getAutoImportPolicy() != null) {
                data.set("autoImportPolicy", om.valueToTree(this.getAutoImportPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxDataRepositoryAssociation.FsxDataRepositoryAssociationS3"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxDataRepositoryAssociationS3.Jsii$Proxy that = (FsxDataRepositoryAssociationS3.Jsii$Proxy) o;

            if (this.autoExportPolicy != null ? !this.autoExportPolicy.equals(that.autoExportPolicy) : that.autoExportPolicy != null) return false;
            return this.autoImportPolicy != null ? this.autoImportPolicy.equals(that.autoImportPolicy) : that.autoImportPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.autoExportPolicy != null ? this.autoExportPolicy.hashCode() : 0;
            result = 31 * result + (this.autoImportPolicy != null ? this.autoImportPolicy.hashCode() : 0);
            return result;
        }
    }
}
