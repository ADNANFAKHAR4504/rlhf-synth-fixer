package imports.aws.backup_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.117Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupPlan.BackupPlanAdvancedBackupSetting")
@software.amazon.jsii.Jsii.Proxy(BackupPlanAdvancedBackupSetting.Jsii$Proxy.class)
public interface BackupPlanAdvancedBackupSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#backup_options BackupPlan#backup_options}.
     */
    @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getBackupOptions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#resource_type BackupPlan#resource_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceType();

    /**
     * @return a {@link Builder} of {@link BackupPlanAdvancedBackupSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BackupPlanAdvancedBackupSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BackupPlanAdvancedBackupSetting> {
        java.util.Map<java.lang.String, java.lang.String> backupOptions;
        java.lang.String resourceType;

        /**
         * Sets the value of {@link BackupPlanAdvancedBackupSetting#getBackupOptions}
         * @param backupOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#backup_options BackupPlan#backup_options}. This parameter is required.
         * @return {@code this}
         */
        public Builder backupOptions(java.util.Map<java.lang.String, java.lang.String> backupOptions) {
            this.backupOptions = backupOptions;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanAdvancedBackupSetting#getResourceType}
         * @param resourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#resource_type BackupPlan#resource_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceType(java.lang.String resourceType) {
            this.resourceType = resourceType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BackupPlanAdvancedBackupSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BackupPlanAdvancedBackupSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BackupPlanAdvancedBackupSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BackupPlanAdvancedBackupSetting {
        private final java.util.Map<java.lang.String, java.lang.String> backupOptions;
        private final java.lang.String resourceType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.backupOptions = software.amazon.jsii.Kernel.get(this, "backupOptions", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resourceType = software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.backupOptions = java.util.Objects.requireNonNull(builder.backupOptions, "backupOptions is required");
            this.resourceType = java.util.Objects.requireNonNull(builder.resourceType, "resourceType is required");
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getBackupOptions() {
            return this.backupOptions;
        }

        @Override
        public final java.lang.String getResourceType() {
            return this.resourceType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("backupOptions", om.valueToTree(this.getBackupOptions()));
            data.set("resourceType", om.valueToTree(this.getResourceType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.backupPlan.BackupPlanAdvancedBackupSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BackupPlanAdvancedBackupSetting.Jsii$Proxy that = (BackupPlanAdvancedBackupSetting.Jsii$Proxy) o;

            if (!backupOptions.equals(that.backupOptions)) return false;
            return this.resourceType.equals(that.resourceType);
        }

        @Override
        public final int hashCode() {
            int result = this.backupOptions.hashCode();
            result = 31 * result + (this.resourceType.hashCode());
            return result;
        }
    }
}
