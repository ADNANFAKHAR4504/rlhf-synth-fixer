package imports.aws.fsx_windows_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.258Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxWindowsFileSystem.FsxWindowsFileSystemAuditLogConfiguration")
@software.amazon.jsii.Jsii.Proxy(FsxWindowsFileSystemAuditLogConfiguration.Jsii$Proxy.class)
public interface FsxWindowsFileSystemAuditLogConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#audit_log_destination FsxWindowsFileSystem#audit_log_destination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuditLogDestination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#file_access_audit_log_level FsxWindowsFileSystem#file_access_audit_log_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileAccessAuditLogLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#file_share_access_audit_log_level FsxWindowsFileSystem#file_share_access_audit_log_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileShareAccessAuditLogLevel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxWindowsFileSystemAuditLogConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxWindowsFileSystemAuditLogConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxWindowsFileSystemAuditLogConfiguration> {
        java.lang.String auditLogDestination;
        java.lang.String fileAccessAuditLogLevel;
        java.lang.String fileShareAccessAuditLogLevel;

        /**
         * Sets the value of {@link FsxWindowsFileSystemAuditLogConfiguration#getAuditLogDestination}
         * @param auditLogDestination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#audit_log_destination FsxWindowsFileSystem#audit_log_destination}.
         * @return {@code this}
         */
        public Builder auditLogDestination(java.lang.String auditLogDestination) {
            this.auditLogDestination = auditLogDestination;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemAuditLogConfiguration#getFileAccessAuditLogLevel}
         * @param fileAccessAuditLogLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#file_access_audit_log_level FsxWindowsFileSystem#file_access_audit_log_level}.
         * @return {@code this}
         */
        public Builder fileAccessAuditLogLevel(java.lang.String fileAccessAuditLogLevel) {
            this.fileAccessAuditLogLevel = fileAccessAuditLogLevel;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemAuditLogConfiguration#getFileShareAccessAuditLogLevel}
         * @param fileShareAccessAuditLogLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#file_share_access_audit_log_level FsxWindowsFileSystem#file_share_access_audit_log_level}.
         * @return {@code this}
         */
        public Builder fileShareAccessAuditLogLevel(java.lang.String fileShareAccessAuditLogLevel) {
            this.fileShareAccessAuditLogLevel = fileShareAccessAuditLogLevel;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxWindowsFileSystemAuditLogConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxWindowsFileSystemAuditLogConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxWindowsFileSystemAuditLogConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxWindowsFileSystemAuditLogConfiguration {
        private final java.lang.String auditLogDestination;
        private final java.lang.String fileAccessAuditLogLevel;
        private final java.lang.String fileShareAccessAuditLogLevel;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.auditLogDestination = software.amazon.jsii.Kernel.get(this, "auditLogDestination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileAccessAuditLogLevel = software.amazon.jsii.Kernel.get(this, "fileAccessAuditLogLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileShareAccessAuditLogLevel = software.amazon.jsii.Kernel.get(this, "fileShareAccessAuditLogLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.auditLogDestination = builder.auditLogDestination;
            this.fileAccessAuditLogLevel = builder.fileAccessAuditLogLevel;
            this.fileShareAccessAuditLogLevel = builder.fileShareAccessAuditLogLevel;
        }

        @Override
        public final java.lang.String getAuditLogDestination() {
            return this.auditLogDestination;
        }

        @Override
        public final java.lang.String getFileAccessAuditLogLevel() {
            return this.fileAccessAuditLogLevel;
        }

        @Override
        public final java.lang.String getFileShareAccessAuditLogLevel() {
            return this.fileShareAccessAuditLogLevel;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAuditLogDestination() != null) {
                data.set("auditLogDestination", om.valueToTree(this.getAuditLogDestination()));
            }
            if (this.getFileAccessAuditLogLevel() != null) {
                data.set("fileAccessAuditLogLevel", om.valueToTree(this.getFileAccessAuditLogLevel()));
            }
            if (this.getFileShareAccessAuditLogLevel() != null) {
                data.set("fileShareAccessAuditLogLevel", om.valueToTree(this.getFileShareAccessAuditLogLevel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxWindowsFileSystem.FsxWindowsFileSystemAuditLogConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxWindowsFileSystemAuditLogConfiguration.Jsii$Proxy that = (FsxWindowsFileSystemAuditLogConfiguration.Jsii$Proxy) o;

            if (this.auditLogDestination != null ? !this.auditLogDestination.equals(that.auditLogDestination) : that.auditLogDestination != null) return false;
            if (this.fileAccessAuditLogLevel != null ? !this.fileAccessAuditLogLevel.equals(that.fileAccessAuditLogLevel) : that.fileAccessAuditLogLevel != null) return false;
            return this.fileShareAccessAuditLogLevel != null ? this.fileShareAccessAuditLogLevel.equals(that.fileShareAccessAuditLogLevel) : that.fileShareAccessAuditLogLevel == null;
        }

        @Override
        public final int hashCode() {
            int result = this.auditLogDestination != null ? this.auditLogDestination.hashCode() : 0;
            result = 31 * result + (this.fileAccessAuditLogLevel != null ? this.fileAccessAuditLogLevel.hashCode() : 0);
            result = 31 * result + (this.fileShareAccessAuditLogLevel != null ? this.fileShareAccessAuditLogLevel.hashCode() : 0);
            return result;
        }
    }
}
