package imports.aws.backup_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.117Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupPlan.BackupPlanRuleCopyAction")
@software.amazon.jsii.Jsii.Proxy(BackupPlanRuleCopyAction.Jsii$Proxy.class)
public interface BackupPlanRuleCopyAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#destination_vault_arn BackupPlan#destination_vault_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestinationVaultArn();

    /**
     * lifecycle block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#lifecycle BackupPlan#lifecycle}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.backup_plan.BackupPlanRuleCopyActionLifecycle getLifecycle() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BackupPlanRuleCopyAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BackupPlanRuleCopyAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BackupPlanRuleCopyAction> {
        java.lang.String destinationVaultArn;
        imports.aws.backup_plan.BackupPlanRuleCopyActionLifecycle lifecycle;

        /**
         * Sets the value of {@link BackupPlanRuleCopyAction#getDestinationVaultArn}
         * @param destinationVaultArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#destination_vault_arn BackupPlan#destination_vault_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder destinationVaultArn(java.lang.String destinationVaultArn) {
            this.destinationVaultArn = destinationVaultArn;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanRuleCopyAction#getLifecycle}
         * @param lifecycle lifecycle block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#lifecycle BackupPlan#lifecycle}
         * @return {@code this}
         */
        public Builder lifecycle(imports.aws.backup_plan.BackupPlanRuleCopyActionLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BackupPlanRuleCopyAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BackupPlanRuleCopyAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BackupPlanRuleCopyAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BackupPlanRuleCopyAction {
        private final java.lang.String destinationVaultArn;
        private final imports.aws.backup_plan.BackupPlanRuleCopyActionLifecycle lifecycle;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destinationVaultArn = software.amazon.jsii.Kernel.get(this, "destinationVaultArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(imports.aws.backup_plan.BackupPlanRuleCopyActionLifecycle.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destinationVaultArn = java.util.Objects.requireNonNull(builder.destinationVaultArn, "destinationVaultArn is required");
            this.lifecycle = builder.lifecycle;
        }

        @Override
        public final java.lang.String getDestinationVaultArn() {
            return this.destinationVaultArn;
        }

        @Override
        public final imports.aws.backup_plan.BackupPlanRuleCopyActionLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destinationVaultArn", om.valueToTree(this.getDestinationVaultArn()));
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.backupPlan.BackupPlanRuleCopyAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BackupPlanRuleCopyAction.Jsii$Proxy that = (BackupPlanRuleCopyAction.Jsii$Proxy) o;

            if (!destinationVaultArn.equals(that.destinationVaultArn)) return false;
            return this.lifecycle != null ? this.lifecycle.equals(that.lifecycle) : that.lifecycle == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destinationVaultArn.hashCode();
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            return result;
        }
    }
}
