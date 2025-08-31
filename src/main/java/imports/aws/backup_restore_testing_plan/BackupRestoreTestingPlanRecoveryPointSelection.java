package imports.aws.backup_restore_testing_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.119Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupRestoreTestingPlan.BackupRestoreTestingPlanRecoveryPointSelection")
@software.amazon.jsii.Jsii.Proxy(BackupRestoreTestingPlanRecoveryPointSelection.Jsii$Proxy.class)
public interface BackupRestoreTestingPlanRecoveryPointSelection extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#algorithm BackupRestoreTestingPlan#algorithm}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAlgorithm();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#include_vaults BackupRestoreTestingPlan#include_vaults}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIncludeVaults();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#recovery_point_types BackupRestoreTestingPlan#recovery_point_types}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRecoveryPointTypes();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#exclude_vaults BackupRestoreTestingPlan#exclude_vaults}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludeVaults() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#selection_window_days BackupRestoreTestingPlan#selection_window_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSelectionWindowDays() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BackupRestoreTestingPlanRecoveryPointSelection}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BackupRestoreTestingPlanRecoveryPointSelection}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BackupRestoreTestingPlanRecoveryPointSelection> {
        java.lang.String algorithm;
        java.util.List<java.lang.String> includeVaults;
        java.util.List<java.lang.String> recoveryPointTypes;
        java.util.List<java.lang.String> excludeVaults;
        java.lang.Number selectionWindowDays;

        /**
         * Sets the value of {@link BackupRestoreTestingPlanRecoveryPointSelection#getAlgorithm}
         * @param algorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#algorithm BackupRestoreTestingPlan#algorithm}. This parameter is required.
         * @return {@code this}
         */
        public Builder algorithm(java.lang.String algorithm) {
            this.algorithm = algorithm;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingPlanRecoveryPointSelection#getIncludeVaults}
         * @param includeVaults Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#include_vaults BackupRestoreTestingPlan#include_vaults}. This parameter is required.
         * @return {@code this}
         */
        public Builder includeVaults(java.util.List<java.lang.String> includeVaults) {
            this.includeVaults = includeVaults;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingPlanRecoveryPointSelection#getRecoveryPointTypes}
         * @param recoveryPointTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#recovery_point_types BackupRestoreTestingPlan#recovery_point_types}. This parameter is required.
         * @return {@code this}
         */
        public Builder recoveryPointTypes(java.util.List<java.lang.String> recoveryPointTypes) {
            this.recoveryPointTypes = recoveryPointTypes;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingPlanRecoveryPointSelection#getExcludeVaults}
         * @param excludeVaults Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#exclude_vaults BackupRestoreTestingPlan#exclude_vaults}.
         * @return {@code this}
         */
        public Builder excludeVaults(java.util.List<java.lang.String> excludeVaults) {
            this.excludeVaults = excludeVaults;
            return this;
        }

        /**
         * Sets the value of {@link BackupRestoreTestingPlanRecoveryPointSelection#getSelectionWindowDays}
         * @param selectionWindowDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#selection_window_days BackupRestoreTestingPlan#selection_window_days}.
         * @return {@code this}
         */
        public Builder selectionWindowDays(java.lang.Number selectionWindowDays) {
            this.selectionWindowDays = selectionWindowDays;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BackupRestoreTestingPlanRecoveryPointSelection}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BackupRestoreTestingPlanRecoveryPointSelection build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BackupRestoreTestingPlanRecoveryPointSelection}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BackupRestoreTestingPlanRecoveryPointSelection {
        private final java.lang.String algorithm;
        private final java.util.List<java.lang.String> includeVaults;
        private final java.util.List<java.lang.String> recoveryPointTypes;
        private final java.util.List<java.lang.String> excludeVaults;
        private final java.lang.Number selectionWindowDays;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.algorithm = software.amazon.jsii.Kernel.get(this, "algorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includeVaults = software.amazon.jsii.Kernel.get(this, "includeVaults", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.recoveryPointTypes = software.amazon.jsii.Kernel.get(this, "recoveryPointTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.excludeVaults = software.amazon.jsii.Kernel.get(this, "excludeVaults", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.selectionWindowDays = software.amazon.jsii.Kernel.get(this, "selectionWindowDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.algorithm = java.util.Objects.requireNonNull(builder.algorithm, "algorithm is required");
            this.includeVaults = java.util.Objects.requireNonNull(builder.includeVaults, "includeVaults is required");
            this.recoveryPointTypes = java.util.Objects.requireNonNull(builder.recoveryPointTypes, "recoveryPointTypes is required");
            this.excludeVaults = builder.excludeVaults;
            this.selectionWindowDays = builder.selectionWindowDays;
        }

        @Override
        public final java.lang.String getAlgorithm() {
            return this.algorithm;
        }

        @Override
        public final java.util.List<java.lang.String> getIncludeVaults() {
            return this.includeVaults;
        }

        @Override
        public final java.util.List<java.lang.String> getRecoveryPointTypes() {
            return this.recoveryPointTypes;
        }

        @Override
        public final java.util.List<java.lang.String> getExcludeVaults() {
            return this.excludeVaults;
        }

        @Override
        public final java.lang.Number getSelectionWindowDays() {
            return this.selectionWindowDays;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("algorithm", om.valueToTree(this.getAlgorithm()));
            data.set("includeVaults", om.valueToTree(this.getIncludeVaults()));
            data.set("recoveryPointTypes", om.valueToTree(this.getRecoveryPointTypes()));
            if (this.getExcludeVaults() != null) {
                data.set("excludeVaults", om.valueToTree(this.getExcludeVaults()));
            }
            if (this.getSelectionWindowDays() != null) {
                data.set("selectionWindowDays", om.valueToTree(this.getSelectionWindowDays()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.backupRestoreTestingPlan.BackupRestoreTestingPlanRecoveryPointSelection"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BackupRestoreTestingPlanRecoveryPointSelection.Jsii$Proxy that = (BackupRestoreTestingPlanRecoveryPointSelection.Jsii$Proxy) o;

            if (!algorithm.equals(that.algorithm)) return false;
            if (!includeVaults.equals(that.includeVaults)) return false;
            if (!recoveryPointTypes.equals(that.recoveryPointTypes)) return false;
            if (this.excludeVaults != null ? !this.excludeVaults.equals(that.excludeVaults) : that.excludeVaults != null) return false;
            return this.selectionWindowDays != null ? this.selectionWindowDays.equals(that.selectionWindowDays) : that.selectionWindowDays == null;
        }

        @Override
        public final int hashCode() {
            int result = this.algorithm.hashCode();
            result = 31 * result + (this.includeVaults.hashCode());
            result = 31 * result + (this.recoveryPointTypes.hashCode());
            result = 31 * result + (this.excludeVaults != null ? this.excludeVaults.hashCode() : 0);
            result = 31 * result + (this.selectionWindowDays != null ? this.selectionWindowDays.hashCode() : 0);
            return result;
        }
    }
}
