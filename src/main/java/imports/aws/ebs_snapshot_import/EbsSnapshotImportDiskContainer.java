package imports.aws.ebs_snapshot_import;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.064Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ebsSnapshotImport.EbsSnapshotImportDiskContainer")
@software.amazon.jsii.Jsii.Proxy(EbsSnapshotImportDiskContainer.Jsii$Proxy.class)
public interface EbsSnapshotImportDiskContainer extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#format EbsSnapshotImport#format}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFormat();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#description EbsSnapshotImport#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#url EbsSnapshotImport#url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUrl() {
        return null;
    }

    /**
     * user_bucket block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#user_bucket EbsSnapshotImport#user_bucket}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucket getUserBucket() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EbsSnapshotImportDiskContainer}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EbsSnapshotImportDiskContainer}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EbsSnapshotImportDiskContainer> {
        java.lang.String format;
        java.lang.String description;
        java.lang.String url;
        imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucket userBucket;

        /**
         * Sets the value of {@link EbsSnapshotImportDiskContainer#getFormat}
         * @param format Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#format EbsSnapshotImport#format}. This parameter is required.
         * @return {@code this}
         */
        public Builder format(java.lang.String format) {
            this.format = format;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportDiskContainer#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#description EbsSnapshotImport#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportDiskContainer#getUrl}
         * @param url Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#url EbsSnapshotImport#url}.
         * @return {@code this}
         */
        public Builder url(java.lang.String url) {
            this.url = url;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportDiskContainer#getUserBucket}
         * @param userBucket user_bucket block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#user_bucket EbsSnapshotImport#user_bucket}
         * @return {@code this}
         */
        public Builder userBucket(imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucket userBucket) {
            this.userBucket = userBucket;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EbsSnapshotImportDiskContainer}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EbsSnapshotImportDiskContainer build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EbsSnapshotImportDiskContainer}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EbsSnapshotImportDiskContainer {
        private final java.lang.String format;
        private final java.lang.String description;
        private final java.lang.String url;
        private final imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucket userBucket;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.format = software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.url = software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userBucket = software.amazon.jsii.Kernel.get(this, "userBucket", software.amazon.jsii.NativeType.forClass(imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucket.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.format = java.util.Objects.requireNonNull(builder.format, "format is required");
            this.description = builder.description;
            this.url = builder.url;
            this.userBucket = builder.userBucket;
        }

        @Override
        public final java.lang.String getFormat() {
            return this.format;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getUrl() {
            return this.url;
        }

        @Override
        public final imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucket getUserBucket() {
            return this.userBucket;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("format", om.valueToTree(this.getFormat()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getUrl() != null) {
                data.set("url", om.valueToTree(this.getUrl()));
            }
            if (this.getUserBucket() != null) {
                data.set("userBucket", om.valueToTree(this.getUserBucket()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ebsSnapshotImport.EbsSnapshotImportDiskContainer"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EbsSnapshotImportDiskContainer.Jsii$Proxy that = (EbsSnapshotImportDiskContainer.Jsii$Proxy) o;

            if (!format.equals(that.format)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.url != null ? !this.url.equals(that.url) : that.url != null) return false;
            return this.userBucket != null ? this.userBucket.equals(that.userBucket) : that.userBucket == null;
        }

        @Override
        public final int hashCode() {
            int result = this.format.hashCode();
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.url != null ? this.url.hashCode() : 0);
            result = 31 * result + (this.userBucket != null ? this.userBucket.hashCode() : 0);
            return result;
        }
    }
}
