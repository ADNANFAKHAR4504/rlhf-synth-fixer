package imports.aws.db_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.971Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dbInstance.DbInstanceRestoreToPointInTime")
@software.amazon.jsii.Jsii.Proxy(DbInstanceRestoreToPointInTime.Jsii$Proxy.class)
public interface DbInstanceRestoreToPointInTime extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#restore_time DbInstance#restore_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRestoreTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#source_db_instance_automated_backups_arn DbInstance#source_db_instance_automated_backups_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceDbInstanceAutomatedBackupsArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#source_db_instance_identifier DbInstance#source_db_instance_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceDbInstanceIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#source_dbi_resource_id DbInstance#source_dbi_resource_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceDbiResourceId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#use_latest_restorable_time DbInstance#use_latest_restorable_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUseLatestRestorableTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DbInstanceRestoreToPointInTime}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DbInstanceRestoreToPointInTime}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DbInstanceRestoreToPointInTime> {
        java.lang.String restoreTime;
        java.lang.String sourceDbInstanceAutomatedBackupsArn;
        java.lang.String sourceDbInstanceIdentifier;
        java.lang.String sourceDbiResourceId;
        java.lang.Object useLatestRestorableTime;

        /**
         * Sets the value of {@link DbInstanceRestoreToPointInTime#getRestoreTime}
         * @param restoreTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#restore_time DbInstance#restore_time}.
         * @return {@code this}
         */
        public Builder restoreTime(java.lang.String restoreTime) {
            this.restoreTime = restoreTime;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceRestoreToPointInTime#getSourceDbInstanceAutomatedBackupsArn}
         * @param sourceDbInstanceAutomatedBackupsArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#source_db_instance_automated_backups_arn DbInstance#source_db_instance_automated_backups_arn}.
         * @return {@code this}
         */
        public Builder sourceDbInstanceAutomatedBackupsArn(java.lang.String sourceDbInstanceAutomatedBackupsArn) {
            this.sourceDbInstanceAutomatedBackupsArn = sourceDbInstanceAutomatedBackupsArn;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceRestoreToPointInTime#getSourceDbInstanceIdentifier}
         * @param sourceDbInstanceIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#source_db_instance_identifier DbInstance#source_db_instance_identifier}.
         * @return {@code this}
         */
        public Builder sourceDbInstanceIdentifier(java.lang.String sourceDbInstanceIdentifier) {
            this.sourceDbInstanceIdentifier = sourceDbInstanceIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceRestoreToPointInTime#getSourceDbiResourceId}
         * @param sourceDbiResourceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#source_dbi_resource_id DbInstance#source_dbi_resource_id}.
         * @return {@code this}
         */
        public Builder sourceDbiResourceId(java.lang.String sourceDbiResourceId) {
            this.sourceDbiResourceId = sourceDbiResourceId;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceRestoreToPointInTime#getUseLatestRestorableTime}
         * @param useLatestRestorableTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#use_latest_restorable_time DbInstance#use_latest_restorable_time}.
         * @return {@code this}
         */
        public Builder useLatestRestorableTime(java.lang.Boolean useLatestRestorableTime) {
            this.useLatestRestorableTime = useLatestRestorableTime;
            return this;
        }

        /**
         * Sets the value of {@link DbInstanceRestoreToPointInTime#getUseLatestRestorableTime}
         * @param useLatestRestorableTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_instance#use_latest_restorable_time DbInstance#use_latest_restorable_time}.
         * @return {@code this}
         */
        public Builder useLatestRestorableTime(com.hashicorp.cdktf.IResolvable useLatestRestorableTime) {
            this.useLatestRestorableTime = useLatestRestorableTime;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DbInstanceRestoreToPointInTime}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DbInstanceRestoreToPointInTime build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DbInstanceRestoreToPointInTime}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DbInstanceRestoreToPointInTime {
        private final java.lang.String restoreTime;
        private final java.lang.String sourceDbInstanceAutomatedBackupsArn;
        private final java.lang.String sourceDbInstanceIdentifier;
        private final java.lang.String sourceDbiResourceId;
        private final java.lang.Object useLatestRestorableTime;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.restoreTime = software.amazon.jsii.Kernel.get(this, "restoreTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceDbInstanceAutomatedBackupsArn = software.amazon.jsii.Kernel.get(this, "sourceDbInstanceAutomatedBackupsArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceDbInstanceIdentifier = software.amazon.jsii.Kernel.get(this, "sourceDbInstanceIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceDbiResourceId = software.amazon.jsii.Kernel.get(this, "sourceDbiResourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.useLatestRestorableTime = software.amazon.jsii.Kernel.get(this, "useLatestRestorableTime", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.restoreTime = builder.restoreTime;
            this.sourceDbInstanceAutomatedBackupsArn = builder.sourceDbInstanceAutomatedBackupsArn;
            this.sourceDbInstanceIdentifier = builder.sourceDbInstanceIdentifier;
            this.sourceDbiResourceId = builder.sourceDbiResourceId;
            this.useLatestRestorableTime = builder.useLatestRestorableTime;
        }

        @Override
        public final java.lang.String getRestoreTime() {
            return this.restoreTime;
        }

        @Override
        public final java.lang.String getSourceDbInstanceAutomatedBackupsArn() {
            return this.sourceDbInstanceAutomatedBackupsArn;
        }

        @Override
        public final java.lang.String getSourceDbInstanceIdentifier() {
            return this.sourceDbInstanceIdentifier;
        }

        @Override
        public final java.lang.String getSourceDbiResourceId() {
            return this.sourceDbiResourceId;
        }

        @Override
        public final java.lang.Object getUseLatestRestorableTime() {
            return this.useLatestRestorableTime;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRestoreTime() != null) {
                data.set("restoreTime", om.valueToTree(this.getRestoreTime()));
            }
            if (this.getSourceDbInstanceAutomatedBackupsArn() != null) {
                data.set("sourceDbInstanceAutomatedBackupsArn", om.valueToTree(this.getSourceDbInstanceAutomatedBackupsArn()));
            }
            if (this.getSourceDbInstanceIdentifier() != null) {
                data.set("sourceDbInstanceIdentifier", om.valueToTree(this.getSourceDbInstanceIdentifier()));
            }
            if (this.getSourceDbiResourceId() != null) {
                data.set("sourceDbiResourceId", om.valueToTree(this.getSourceDbiResourceId()));
            }
            if (this.getUseLatestRestorableTime() != null) {
                data.set("useLatestRestorableTime", om.valueToTree(this.getUseLatestRestorableTime()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dbInstance.DbInstanceRestoreToPointInTime"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DbInstanceRestoreToPointInTime.Jsii$Proxy that = (DbInstanceRestoreToPointInTime.Jsii$Proxy) o;

            if (this.restoreTime != null ? !this.restoreTime.equals(that.restoreTime) : that.restoreTime != null) return false;
            if (this.sourceDbInstanceAutomatedBackupsArn != null ? !this.sourceDbInstanceAutomatedBackupsArn.equals(that.sourceDbInstanceAutomatedBackupsArn) : that.sourceDbInstanceAutomatedBackupsArn != null) return false;
            if (this.sourceDbInstanceIdentifier != null ? !this.sourceDbInstanceIdentifier.equals(that.sourceDbInstanceIdentifier) : that.sourceDbInstanceIdentifier != null) return false;
            if (this.sourceDbiResourceId != null ? !this.sourceDbiResourceId.equals(that.sourceDbiResourceId) : that.sourceDbiResourceId != null) return false;
            return this.useLatestRestorableTime != null ? this.useLatestRestorableTime.equals(that.useLatestRestorableTime) : that.useLatestRestorableTime == null;
        }

        @Override
        public final int hashCode() {
            int result = this.restoreTime != null ? this.restoreTime.hashCode() : 0;
            result = 31 * result + (this.sourceDbInstanceAutomatedBackupsArn != null ? this.sourceDbInstanceAutomatedBackupsArn.hashCode() : 0);
            result = 31 * result + (this.sourceDbInstanceIdentifier != null ? this.sourceDbInstanceIdentifier.hashCode() : 0);
            result = 31 * result + (this.sourceDbiResourceId != null ? this.sourceDbiResourceId.hashCode() : 0);
            result = 31 * result + (this.useLatestRestorableTime != null ? this.useLatestRestorableTime.hashCode() : 0);
            return result;
        }
    }
}
