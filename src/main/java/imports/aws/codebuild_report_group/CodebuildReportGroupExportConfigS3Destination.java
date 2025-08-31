package imports.aws.codebuild_report_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.306Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildReportGroup.CodebuildReportGroupExportConfigS3Destination")
@software.amazon.jsii.Jsii.Proxy(CodebuildReportGroupExportConfigS3Destination.Jsii$Proxy.class)
public interface CodebuildReportGroupExportConfigS3Destination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_report_group#bucket CodebuildReportGroup#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_report_group#encryption_key CodebuildReportGroup#encryption_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEncryptionKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_report_group#encryption_disabled CodebuildReportGroup#encryption_disabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncryptionDisabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_report_group#packaging CodebuildReportGroup#packaging}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPackaging() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_report_group#path CodebuildReportGroup#path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPath() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildReportGroupExportConfigS3Destination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildReportGroupExportConfigS3Destination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildReportGroupExportConfigS3Destination> {
        java.lang.String bucket;
        java.lang.String encryptionKey;
        java.lang.Object encryptionDisabled;
        java.lang.String packaging;
        java.lang.String path;

        /**
         * Sets the value of {@link CodebuildReportGroupExportConfigS3Destination#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_report_group#bucket CodebuildReportGroup#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildReportGroupExportConfigS3Destination#getEncryptionKey}
         * @param encryptionKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_report_group#encryption_key CodebuildReportGroup#encryption_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder encryptionKey(java.lang.String encryptionKey) {
            this.encryptionKey = encryptionKey;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildReportGroupExportConfigS3Destination#getEncryptionDisabled}
         * @param encryptionDisabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_report_group#encryption_disabled CodebuildReportGroup#encryption_disabled}.
         * @return {@code this}
         */
        public Builder encryptionDisabled(java.lang.Boolean encryptionDisabled) {
            this.encryptionDisabled = encryptionDisabled;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildReportGroupExportConfigS3Destination#getEncryptionDisabled}
         * @param encryptionDisabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_report_group#encryption_disabled CodebuildReportGroup#encryption_disabled}.
         * @return {@code this}
         */
        public Builder encryptionDisabled(com.hashicorp.cdktf.IResolvable encryptionDisabled) {
            this.encryptionDisabled = encryptionDisabled;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildReportGroupExportConfigS3Destination#getPackaging}
         * @param packaging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_report_group#packaging CodebuildReportGroup#packaging}.
         * @return {@code this}
         */
        public Builder packaging(java.lang.String packaging) {
            this.packaging = packaging;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildReportGroupExportConfigS3Destination#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_report_group#path CodebuildReportGroup#path}.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildReportGroupExportConfigS3Destination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildReportGroupExportConfigS3Destination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildReportGroupExportConfigS3Destination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildReportGroupExportConfigS3Destination {
        private final java.lang.String bucket;
        private final java.lang.String encryptionKey;
        private final java.lang.Object encryptionDisabled;
        private final java.lang.String packaging;
        private final java.lang.String path;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionKey = software.amazon.jsii.Kernel.get(this, "encryptionKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionDisabled = software.amazon.jsii.Kernel.get(this, "encryptionDisabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.packaging = software.amazon.jsii.Kernel.get(this, "packaging", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
            this.encryptionKey = java.util.Objects.requireNonNull(builder.encryptionKey, "encryptionKey is required");
            this.encryptionDisabled = builder.encryptionDisabled;
            this.packaging = builder.packaging;
            this.path = builder.path;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.String getEncryptionKey() {
            return this.encryptionKey;
        }

        @Override
        public final java.lang.Object getEncryptionDisabled() {
            return this.encryptionDisabled;
        }

        @Override
        public final java.lang.String getPackaging() {
            return this.packaging;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucket", om.valueToTree(this.getBucket()));
            data.set("encryptionKey", om.valueToTree(this.getEncryptionKey()));
            if (this.getEncryptionDisabled() != null) {
                data.set("encryptionDisabled", om.valueToTree(this.getEncryptionDisabled()));
            }
            if (this.getPackaging() != null) {
                data.set("packaging", om.valueToTree(this.getPackaging()));
            }
            if (this.getPath() != null) {
                data.set("path", om.valueToTree(this.getPath()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildReportGroup.CodebuildReportGroupExportConfigS3Destination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildReportGroupExportConfigS3Destination.Jsii$Proxy that = (CodebuildReportGroupExportConfigS3Destination.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            if (!encryptionKey.equals(that.encryptionKey)) return false;
            if (this.encryptionDisabled != null ? !this.encryptionDisabled.equals(that.encryptionDisabled) : that.encryptionDisabled != null) return false;
            if (this.packaging != null ? !this.packaging.equals(that.packaging) : that.packaging != null) return false;
            return this.path != null ? this.path.equals(that.path) : that.path == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket.hashCode();
            result = 31 * result + (this.encryptionKey.hashCode());
            result = 31 * result + (this.encryptionDisabled != null ? this.encryptionDisabled.hashCode() : 0);
            result = 31 * result + (this.packaging != null ? this.packaging.hashCode() : 0);
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            return result;
        }
    }
}
