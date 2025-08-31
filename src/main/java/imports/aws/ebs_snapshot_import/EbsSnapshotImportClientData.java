package imports.aws.ebs_snapshot_import;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.064Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ebsSnapshotImport.EbsSnapshotImportClientData")
@software.amazon.jsii.Jsii.Proxy(EbsSnapshotImportClientData.Jsii$Proxy.class)
public interface EbsSnapshotImportClientData extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#comment EbsSnapshotImport#comment}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getComment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#upload_end EbsSnapshotImport#upload_end}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUploadEnd() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#upload_size EbsSnapshotImport#upload_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUploadSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#upload_start EbsSnapshotImport#upload_start}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUploadStart() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EbsSnapshotImportClientData}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EbsSnapshotImportClientData}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EbsSnapshotImportClientData> {
        java.lang.String comment;
        java.lang.String uploadEnd;
        java.lang.Number uploadSize;
        java.lang.String uploadStart;

        /**
         * Sets the value of {@link EbsSnapshotImportClientData#getComment}
         * @param comment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#comment EbsSnapshotImport#comment}.
         * @return {@code this}
         */
        public Builder comment(java.lang.String comment) {
            this.comment = comment;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportClientData#getUploadEnd}
         * @param uploadEnd Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#upload_end EbsSnapshotImport#upload_end}.
         * @return {@code this}
         */
        public Builder uploadEnd(java.lang.String uploadEnd) {
            this.uploadEnd = uploadEnd;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportClientData#getUploadSize}
         * @param uploadSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#upload_size EbsSnapshotImport#upload_size}.
         * @return {@code this}
         */
        public Builder uploadSize(java.lang.Number uploadSize) {
            this.uploadSize = uploadSize;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportClientData#getUploadStart}
         * @param uploadStart Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#upload_start EbsSnapshotImport#upload_start}.
         * @return {@code this}
         */
        public Builder uploadStart(java.lang.String uploadStart) {
            this.uploadStart = uploadStart;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EbsSnapshotImportClientData}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EbsSnapshotImportClientData build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EbsSnapshotImportClientData}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EbsSnapshotImportClientData {
        private final java.lang.String comment;
        private final java.lang.String uploadEnd;
        private final java.lang.Number uploadSize;
        private final java.lang.String uploadStart;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.comment = software.amazon.jsii.Kernel.get(this, "comment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.uploadEnd = software.amazon.jsii.Kernel.get(this, "uploadEnd", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.uploadSize = software.amazon.jsii.Kernel.get(this, "uploadSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.uploadStart = software.amazon.jsii.Kernel.get(this, "uploadStart", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.comment = builder.comment;
            this.uploadEnd = builder.uploadEnd;
            this.uploadSize = builder.uploadSize;
            this.uploadStart = builder.uploadStart;
        }

        @Override
        public final java.lang.String getComment() {
            return this.comment;
        }

        @Override
        public final java.lang.String getUploadEnd() {
            return this.uploadEnd;
        }

        @Override
        public final java.lang.Number getUploadSize() {
            return this.uploadSize;
        }

        @Override
        public final java.lang.String getUploadStart() {
            return this.uploadStart;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getComment() != null) {
                data.set("comment", om.valueToTree(this.getComment()));
            }
            if (this.getUploadEnd() != null) {
                data.set("uploadEnd", om.valueToTree(this.getUploadEnd()));
            }
            if (this.getUploadSize() != null) {
                data.set("uploadSize", om.valueToTree(this.getUploadSize()));
            }
            if (this.getUploadStart() != null) {
                data.set("uploadStart", om.valueToTree(this.getUploadStart()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ebsSnapshotImport.EbsSnapshotImportClientData"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EbsSnapshotImportClientData.Jsii$Proxy that = (EbsSnapshotImportClientData.Jsii$Proxy) o;

            if (this.comment != null ? !this.comment.equals(that.comment) : that.comment != null) return false;
            if (this.uploadEnd != null ? !this.uploadEnd.equals(that.uploadEnd) : that.uploadEnd != null) return false;
            if (this.uploadSize != null ? !this.uploadSize.equals(that.uploadSize) : that.uploadSize != null) return false;
            return this.uploadStart != null ? this.uploadStart.equals(that.uploadStart) : that.uploadStart == null;
        }

        @Override
        public final int hashCode() {
            int result = this.comment != null ? this.comment.hashCode() : 0;
            result = 31 * result + (this.uploadEnd != null ? this.uploadEnd.hashCode() : 0);
            result = 31 * result + (this.uploadSize != null ? this.uploadSize.hashCode() : 0);
            result = 31 * result + (this.uploadStart != null ? this.uploadStart.hashCode() : 0);
            return result;
        }
    }
}
