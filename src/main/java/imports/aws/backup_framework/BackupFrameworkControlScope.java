package imports.aws.backup_framework;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupFramework.BackupFrameworkControlScope")
@software.amazon.jsii.Jsii.Proxy(BackupFrameworkControlScope.Jsii$Proxy.class)
public interface BackupFrameworkControlScope extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#compliance_resource_ids BackupFramework#compliance_resource_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getComplianceResourceIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#compliance_resource_types BackupFramework#compliance_resource_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getComplianceResourceTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#tags BackupFramework#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BackupFrameworkControlScope}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BackupFrameworkControlScope}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BackupFrameworkControlScope> {
        java.util.List<java.lang.String> complianceResourceIds;
        java.util.List<java.lang.String> complianceResourceTypes;
        java.util.Map<java.lang.String, java.lang.String> tags;

        /**
         * Sets the value of {@link BackupFrameworkControlScope#getComplianceResourceIds}
         * @param complianceResourceIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#compliance_resource_ids BackupFramework#compliance_resource_ids}.
         * @return {@code this}
         */
        public Builder complianceResourceIds(java.util.List<java.lang.String> complianceResourceIds) {
            this.complianceResourceIds = complianceResourceIds;
            return this;
        }

        /**
         * Sets the value of {@link BackupFrameworkControlScope#getComplianceResourceTypes}
         * @param complianceResourceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#compliance_resource_types BackupFramework#compliance_resource_types}.
         * @return {@code this}
         */
        public Builder complianceResourceTypes(java.util.List<java.lang.String> complianceResourceTypes) {
            this.complianceResourceTypes = complianceResourceTypes;
            return this;
        }

        /**
         * Sets the value of {@link BackupFrameworkControlScope#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_framework#tags BackupFramework#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BackupFrameworkControlScope}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BackupFrameworkControlScope build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BackupFrameworkControlScope}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BackupFrameworkControlScope {
        private final java.util.List<java.lang.String> complianceResourceIds;
        private final java.util.List<java.lang.String> complianceResourceTypes;
        private final java.util.Map<java.lang.String, java.lang.String> tags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.complianceResourceIds = software.amazon.jsii.Kernel.get(this, "complianceResourceIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.complianceResourceTypes = software.amazon.jsii.Kernel.get(this, "complianceResourceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.complianceResourceIds = builder.complianceResourceIds;
            this.complianceResourceTypes = builder.complianceResourceTypes;
            this.tags = builder.tags;
        }

        @Override
        public final java.util.List<java.lang.String> getComplianceResourceIds() {
            return this.complianceResourceIds;
        }

        @Override
        public final java.util.List<java.lang.String> getComplianceResourceTypes() {
            return this.complianceResourceTypes;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getComplianceResourceIds() != null) {
                data.set("complianceResourceIds", om.valueToTree(this.getComplianceResourceIds()));
            }
            if (this.getComplianceResourceTypes() != null) {
                data.set("complianceResourceTypes", om.valueToTree(this.getComplianceResourceTypes()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.backupFramework.BackupFrameworkControlScope"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BackupFrameworkControlScope.Jsii$Proxy that = (BackupFrameworkControlScope.Jsii$Proxy) o;

            if (this.complianceResourceIds != null ? !this.complianceResourceIds.equals(that.complianceResourceIds) : that.complianceResourceIds != null) return false;
            if (this.complianceResourceTypes != null ? !this.complianceResourceTypes.equals(that.complianceResourceTypes) : that.complianceResourceTypes != null) return false;
            return this.tags != null ? this.tags.equals(that.tags) : that.tags == null;
        }

        @Override
        public final int hashCode() {
            int result = this.complianceResourceIds != null ? this.complianceResourceIds.hashCode() : 0;
            result = 31 * result + (this.complianceResourceTypes != null ? this.complianceResourceTypes.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            return result;
        }
    }
}
