package imports.aws.drs_replication_configuration_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.032Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.drsReplicationConfigurationTemplate.DrsReplicationConfigurationTemplatePitPolicy")
@software.amazon.jsii.Jsii.Proxy(DrsReplicationConfigurationTemplatePitPolicy.Jsii$Proxy.class)
public interface DrsReplicationConfigurationTemplatePitPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#interval DrsReplicationConfigurationTemplate#interval}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getInterval();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#retention_duration DrsReplicationConfigurationTemplate#retention_duration}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getRetentionDuration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#units DrsReplicationConfigurationTemplate#units}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUnits();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#enabled DrsReplicationConfigurationTemplate#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#rule_id DrsReplicationConfigurationTemplate#rule_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRuleId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DrsReplicationConfigurationTemplatePitPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DrsReplicationConfigurationTemplatePitPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DrsReplicationConfigurationTemplatePitPolicy> {
        java.lang.Number interval;
        java.lang.Number retentionDuration;
        java.lang.String units;
        java.lang.Object enabled;
        java.lang.Number ruleId;

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplatePitPolicy#getInterval}
         * @param interval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#interval DrsReplicationConfigurationTemplate#interval}. This parameter is required.
         * @return {@code this}
         */
        public Builder interval(java.lang.Number interval) {
            this.interval = interval;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplatePitPolicy#getRetentionDuration}
         * @param retentionDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#retention_duration DrsReplicationConfigurationTemplate#retention_duration}. This parameter is required.
         * @return {@code this}
         */
        public Builder retentionDuration(java.lang.Number retentionDuration) {
            this.retentionDuration = retentionDuration;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplatePitPolicy#getUnits}
         * @param units Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#units DrsReplicationConfigurationTemplate#units}. This parameter is required.
         * @return {@code this}
         */
        public Builder units(java.lang.String units) {
            this.units = units;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplatePitPolicy#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#enabled DrsReplicationConfigurationTemplate#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplatePitPolicy#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#enabled DrsReplicationConfigurationTemplate#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplatePitPolicy#getRuleId}
         * @param ruleId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#rule_id DrsReplicationConfigurationTemplate#rule_id}.
         * @return {@code this}
         */
        public Builder ruleId(java.lang.Number ruleId) {
            this.ruleId = ruleId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DrsReplicationConfigurationTemplatePitPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DrsReplicationConfigurationTemplatePitPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DrsReplicationConfigurationTemplatePitPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DrsReplicationConfigurationTemplatePitPolicy {
        private final java.lang.Number interval;
        private final java.lang.Number retentionDuration;
        private final java.lang.String units;
        private final java.lang.Object enabled;
        private final java.lang.Number ruleId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.interval = software.amazon.jsii.Kernel.get(this, "interval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.retentionDuration = software.amazon.jsii.Kernel.get(this, "retentionDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.units = software.amazon.jsii.Kernel.get(this, "units", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ruleId = software.amazon.jsii.Kernel.get(this, "ruleId", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.interval = java.util.Objects.requireNonNull(builder.interval, "interval is required");
            this.retentionDuration = java.util.Objects.requireNonNull(builder.retentionDuration, "retentionDuration is required");
            this.units = java.util.Objects.requireNonNull(builder.units, "units is required");
            this.enabled = builder.enabled;
            this.ruleId = builder.ruleId;
        }

        @Override
        public final java.lang.Number getInterval() {
            return this.interval;
        }

        @Override
        public final java.lang.Number getRetentionDuration() {
            return this.retentionDuration;
        }

        @Override
        public final java.lang.String getUnits() {
            return this.units;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Number getRuleId() {
            return this.ruleId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("interval", om.valueToTree(this.getInterval()));
            data.set("retentionDuration", om.valueToTree(this.getRetentionDuration()));
            data.set("units", om.valueToTree(this.getUnits()));
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getRuleId() != null) {
                data.set("ruleId", om.valueToTree(this.getRuleId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.drsReplicationConfigurationTemplate.DrsReplicationConfigurationTemplatePitPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DrsReplicationConfigurationTemplatePitPolicy.Jsii$Proxy that = (DrsReplicationConfigurationTemplatePitPolicy.Jsii$Proxy) o;

            if (!interval.equals(that.interval)) return false;
            if (!retentionDuration.equals(that.retentionDuration)) return false;
            if (!units.equals(that.units)) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            return this.ruleId != null ? this.ruleId.equals(that.ruleId) : that.ruleId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.interval.hashCode();
            result = 31 * result + (this.retentionDuration.hashCode());
            result = 31 * result + (this.units.hashCode());
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.ruleId != null ? this.ruleId.hashCode() : 0);
            return result;
        }
    }
}
