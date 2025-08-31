package imports.aws.datasync_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.954Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncTask.DatasyncTaskOptions")
@software.amazon.jsii.Jsii.Proxy(DatasyncTaskOptions.Jsii$Proxy.class)
public interface DatasyncTaskOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#atime DatasyncTask#atime}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAtime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#bytes_per_second DatasyncTask#bytes_per_second}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBytesPerSecond() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#gid DatasyncTask#gid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGid() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#log_level DatasyncTask#log_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#mtime DatasyncTask#mtime}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMtime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#object_tags DatasyncTask#object_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObjectTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#overwrite_mode DatasyncTask#overwrite_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOverwriteMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#posix_permissions DatasyncTask#posix_permissions}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPosixPermissions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#preserve_deleted_files DatasyncTask#preserve_deleted_files}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreserveDeletedFiles() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#preserve_devices DatasyncTask#preserve_devices}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreserveDevices() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#security_descriptor_copy_flags DatasyncTask#security_descriptor_copy_flags}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecurityDescriptorCopyFlags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_queueing DatasyncTask#task_queueing}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTaskQueueing() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#transfer_mode DatasyncTask#transfer_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransferMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#uid DatasyncTask#uid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUid() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#verify_mode DatasyncTask#verify_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVerifyMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncTaskOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncTaskOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncTaskOptions> {
        java.lang.String atime;
        java.lang.Number bytesPerSecond;
        java.lang.String gid;
        java.lang.String logLevel;
        java.lang.String mtime;
        java.lang.String objectTags;
        java.lang.String overwriteMode;
        java.lang.String posixPermissions;
        java.lang.String preserveDeletedFiles;
        java.lang.String preserveDevices;
        java.lang.String securityDescriptorCopyFlags;
        java.lang.String taskQueueing;
        java.lang.String transferMode;
        java.lang.String uid;
        java.lang.String verifyMode;

        /**
         * Sets the value of {@link DatasyncTaskOptions#getAtime}
         * @param atime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#atime DatasyncTask#atime}.
         * @return {@code this}
         */
        public Builder atime(java.lang.String atime) {
            this.atime = atime;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getBytesPerSecond}
         * @param bytesPerSecond Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#bytes_per_second DatasyncTask#bytes_per_second}.
         * @return {@code this}
         */
        public Builder bytesPerSecond(java.lang.Number bytesPerSecond) {
            this.bytesPerSecond = bytesPerSecond;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getGid}
         * @param gid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#gid DatasyncTask#gid}.
         * @return {@code this}
         */
        public Builder gid(java.lang.String gid) {
            this.gid = gid;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getLogLevel}
         * @param logLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#log_level DatasyncTask#log_level}.
         * @return {@code this}
         */
        public Builder logLevel(java.lang.String logLevel) {
            this.logLevel = logLevel;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getMtime}
         * @param mtime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#mtime DatasyncTask#mtime}.
         * @return {@code this}
         */
        public Builder mtime(java.lang.String mtime) {
            this.mtime = mtime;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getObjectTags}
         * @param objectTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#object_tags DatasyncTask#object_tags}.
         * @return {@code this}
         */
        public Builder objectTags(java.lang.String objectTags) {
            this.objectTags = objectTags;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getOverwriteMode}
         * @param overwriteMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#overwrite_mode DatasyncTask#overwrite_mode}.
         * @return {@code this}
         */
        public Builder overwriteMode(java.lang.String overwriteMode) {
            this.overwriteMode = overwriteMode;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getPosixPermissions}
         * @param posixPermissions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#posix_permissions DatasyncTask#posix_permissions}.
         * @return {@code this}
         */
        public Builder posixPermissions(java.lang.String posixPermissions) {
            this.posixPermissions = posixPermissions;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getPreserveDeletedFiles}
         * @param preserveDeletedFiles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#preserve_deleted_files DatasyncTask#preserve_deleted_files}.
         * @return {@code this}
         */
        public Builder preserveDeletedFiles(java.lang.String preserveDeletedFiles) {
            this.preserveDeletedFiles = preserveDeletedFiles;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getPreserveDevices}
         * @param preserveDevices Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#preserve_devices DatasyncTask#preserve_devices}.
         * @return {@code this}
         */
        public Builder preserveDevices(java.lang.String preserveDevices) {
            this.preserveDevices = preserveDevices;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getSecurityDescriptorCopyFlags}
         * @param securityDescriptorCopyFlags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#security_descriptor_copy_flags DatasyncTask#security_descriptor_copy_flags}.
         * @return {@code this}
         */
        public Builder securityDescriptorCopyFlags(java.lang.String securityDescriptorCopyFlags) {
            this.securityDescriptorCopyFlags = securityDescriptorCopyFlags;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getTaskQueueing}
         * @param taskQueueing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_queueing DatasyncTask#task_queueing}.
         * @return {@code this}
         */
        public Builder taskQueueing(java.lang.String taskQueueing) {
            this.taskQueueing = taskQueueing;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getTransferMode}
         * @param transferMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#transfer_mode DatasyncTask#transfer_mode}.
         * @return {@code this}
         */
        public Builder transferMode(java.lang.String transferMode) {
            this.transferMode = transferMode;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getUid}
         * @param uid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#uid DatasyncTask#uid}.
         * @return {@code this}
         */
        public Builder uid(java.lang.String uid) {
            this.uid = uid;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskOptions#getVerifyMode}
         * @param verifyMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#verify_mode DatasyncTask#verify_mode}.
         * @return {@code this}
         */
        public Builder verifyMode(java.lang.String verifyMode) {
            this.verifyMode = verifyMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncTaskOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncTaskOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncTaskOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncTaskOptions {
        private final java.lang.String atime;
        private final java.lang.Number bytesPerSecond;
        private final java.lang.String gid;
        private final java.lang.String logLevel;
        private final java.lang.String mtime;
        private final java.lang.String objectTags;
        private final java.lang.String overwriteMode;
        private final java.lang.String posixPermissions;
        private final java.lang.String preserveDeletedFiles;
        private final java.lang.String preserveDevices;
        private final java.lang.String securityDescriptorCopyFlags;
        private final java.lang.String taskQueueing;
        private final java.lang.String transferMode;
        private final java.lang.String uid;
        private final java.lang.String verifyMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.atime = software.amazon.jsii.Kernel.get(this, "atime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bytesPerSecond = software.amazon.jsii.Kernel.get(this, "bytesPerSecond", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.gid = software.amazon.jsii.Kernel.get(this, "gid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logLevel = software.amazon.jsii.Kernel.get(this, "logLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mtime = software.amazon.jsii.Kernel.get(this, "mtime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.objectTags = software.amazon.jsii.Kernel.get(this, "objectTags", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.overwriteMode = software.amazon.jsii.Kernel.get(this, "overwriteMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.posixPermissions = software.amazon.jsii.Kernel.get(this, "posixPermissions", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preserveDeletedFiles = software.amazon.jsii.Kernel.get(this, "preserveDeletedFiles", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preserveDevices = software.amazon.jsii.Kernel.get(this, "preserveDevices", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityDescriptorCopyFlags = software.amazon.jsii.Kernel.get(this, "securityDescriptorCopyFlags", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.taskQueueing = software.amazon.jsii.Kernel.get(this, "taskQueueing", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transferMode = software.amazon.jsii.Kernel.get(this, "transferMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.uid = software.amazon.jsii.Kernel.get(this, "uid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.verifyMode = software.amazon.jsii.Kernel.get(this, "verifyMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.atime = builder.atime;
            this.bytesPerSecond = builder.bytesPerSecond;
            this.gid = builder.gid;
            this.logLevel = builder.logLevel;
            this.mtime = builder.mtime;
            this.objectTags = builder.objectTags;
            this.overwriteMode = builder.overwriteMode;
            this.posixPermissions = builder.posixPermissions;
            this.preserveDeletedFiles = builder.preserveDeletedFiles;
            this.preserveDevices = builder.preserveDevices;
            this.securityDescriptorCopyFlags = builder.securityDescriptorCopyFlags;
            this.taskQueueing = builder.taskQueueing;
            this.transferMode = builder.transferMode;
            this.uid = builder.uid;
            this.verifyMode = builder.verifyMode;
        }

        @Override
        public final java.lang.String getAtime() {
            return this.atime;
        }

        @Override
        public final java.lang.Number getBytesPerSecond() {
            return this.bytesPerSecond;
        }

        @Override
        public final java.lang.String getGid() {
            return this.gid;
        }

        @Override
        public final java.lang.String getLogLevel() {
            return this.logLevel;
        }

        @Override
        public final java.lang.String getMtime() {
            return this.mtime;
        }

        @Override
        public final java.lang.String getObjectTags() {
            return this.objectTags;
        }

        @Override
        public final java.lang.String getOverwriteMode() {
            return this.overwriteMode;
        }

        @Override
        public final java.lang.String getPosixPermissions() {
            return this.posixPermissions;
        }

        @Override
        public final java.lang.String getPreserveDeletedFiles() {
            return this.preserveDeletedFiles;
        }

        @Override
        public final java.lang.String getPreserveDevices() {
            return this.preserveDevices;
        }

        @Override
        public final java.lang.String getSecurityDescriptorCopyFlags() {
            return this.securityDescriptorCopyFlags;
        }

        @Override
        public final java.lang.String getTaskQueueing() {
            return this.taskQueueing;
        }

        @Override
        public final java.lang.String getTransferMode() {
            return this.transferMode;
        }

        @Override
        public final java.lang.String getUid() {
            return this.uid;
        }

        @Override
        public final java.lang.String getVerifyMode() {
            return this.verifyMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAtime() != null) {
                data.set("atime", om.valueToTree(this.getAtime()));
            }
            if (this.getBytesPerSecond() != null) {
                data.set("bytesPerSecond", om.valueToTree(this.getBytesPerSecond()));
            }
            if (this.getGid() != null) {
                data.set("gid", om.valueToTree(this.getGid()));
            }
            if (this.getLogLevel() != null) {
                data.set("logLevel", om.valueToTree(this.getLogLevel()));
            }
            if (this.getMtime() != null) {
                data.set("mtime", om.valueToTree(this.getMtime()));
            }
            if (this.getObjectTags() != null) {
                data.set("objectTags", om.valueToTree(this.getObjectTags()));
            }
            if (this.getOverwriteMode() != null) {
                data.set("overwriteMode", om.valueToTree(this.getOverwriteMode()));
            }
            if (this.getPosixPermissions() != null) {
                data.set("posixPermissions", om.valueToTree(this.getPosixPermissions()));
            }
            if (this.getPreserveDeletedFiles() != null) {
                data.set("preserveDeletedFiles", om.valueToTree(this.getPreserveDeletedFiles()));
            }
            if (this.getPreserveDevices() != null) {
                data.set("preserveDevices", om.valueToTree(this.getPreserveDevices()));
            }
            if (this.getSecurityDescriptorCopyFlags() != null) {
                data.set("securityDescriptorCopyFlags", om.valueToTree(this.getSecurityDescriptorCopyFlags()));
            }
            if (this.getTaskQueueing() != null) {
                data.set("taskQueueing", om.valueToTree(this.getTaskQueueing()));
            }
            if (this.getTransferMode() != null) {
                data.set("transferMode", om.valueToTree(this.getTransferMode()));
            }
            if (this.getUid() != null) {
                data.set("uid", om.valueToTree(this.getUid()));
            }
            if (this.getVerifyMode() != null) {
                data.set("verifyMode", om.valueToTree(this.getVerifyMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncTask.DatasyncTaskOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncTaskOptions.Jsii$Proxy that = (DatasyncTaskOptions.Jsii$Proxy) o;

            if (this.atime != null ? !this.atime.equals(that.atime) : that.atime != null) return false;
            if (this.bytesPerSecond != null ? !this.bytesPerSecond.equals(that.bytesPerSecond) : that.bytesPerSecond != null) return false;
            if (this.gid != null ? !this.gid.equals(that.gid) : that.gid != null) return false;
            if (this.logLevel != null ? !this.logLevel.equals(that.logLevel) : that.logLevel != null) return false;
            if (this.mtime != null ? !this.mtime.equals(that.mtime) : that.mtime != null) return false;
            if (this.objectTags != null ? !this.objectTags.equals(that.objectTags) : that.objectTags != null) return false;
            if (this.overwriteMode != null ? !this.overwriteMode.equals(that.overwriteMode) : that.overwriteMode != null) return false;
            if (this.posixPermissions != null ? !this.posixPermissions.equals(that.posixPermissions) : that.posixPermissions != null) return false;
            if (this.preserveDeletedFiles != null ? !this.preserveDeletedFiles.equals(that.preserveDeletedFiles) : that.preserveDeletedFiles != null) return false;
            if (this.preserveDevices != null ? !this.preserveDevices.equals(that.preserveDevices) : that.preserveDevices != null) return false;
            if (this.securityDescriptorCopyFlags != null ? !this.securityDescriptorCopyFlags.equals(that.securityDescriptorCopyFlags) : that.securityDescriptorCopyFlags != null) return false;
            if (this.taskQueueing != null ? !this.taskQueueing.equals(that.taskQueueing) : that.taskQueueing != null) return false;
            if (this.transferMode != null ? !this.transferMode.equals(that.transferMode) : that.transferMode != null) return false;
            if (this.uid != null ? !this.uid.equals(that.uid) : that.uid != null) return false;
            return this.verifyMode != null ? this.verifyMode.equals(that.verifyMode) : that.verifyMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.atime != null ? this.atime.hashCode() : 0;
            result = 31 * result + (this.bytesPerSecond != null ? this.bytesPerSecond.hashCode() : 0);
            result = 31 * result + (this.gid != null ? this.gid.hashCode() : 0);
            result = 31 * result + (this.logLevel != null ? this.logLevel.hashCode() : 0);
            result = 31 * result + (this.mtime != null ? this.mtime.hashCode() : 0);
            result = 31 * result + (this.objectTags != null ? this.objectTags.hashCode() : 0);
            result = 31 * result + (this.overwriteMode != null ? this.overwriteMode.hashCode() : 0);
            result = 31 * result + (this.posixPermissions != null ? this.posixPermissions.hashCode() : 0);
            result = 31 * result + (this.preserveDeletedFiles != null ? this.preserveDeletedFiles.hashCode() : 0);
            result = 31 * result + (this.preserveDevices != null ? this.preserveDevices.hashCode() : 0);
            result = 31 * result + (this.securityDescriptorCopyFlags != null ? this.securityDescriptorCopyFlags.hashCode() : 0);
            result = 31 * result + (this.taskQueueing != null ? this.taskQueueing.hashCode() : 0);
            result = 31 * result + (this.transferMode != null ? this.transferMode.hashCode() : 0);
            result = 31 * result + (this.uid != null ? this.uid.hashCode() : 0);
            result = 31 * result + (this.verifyMode != null ? this.verifyMode.hashCode() : 0);
            return result;
        }
    }
}
