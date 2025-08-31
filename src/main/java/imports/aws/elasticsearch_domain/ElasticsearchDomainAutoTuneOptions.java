package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.179Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainAutoTuneOptions")
@software.amazon.jsii.Jsii.Proxy(ElasticsearchDomainAutoTuneOptions.Jsii$Proxy.class)
public interface ElasticsearchDomainAutoTuneOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#desired_state ElasticsearchDomain#desired_state}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDesiredState();

    /**
     * maintenance_schedule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#maintenance_schedule ElasticsearchDomain#maintenance_schedule}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMaintenanceSchedule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#rollback_on_disable ElasticsearchDomain#rollback_on_disable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRollbackOnDisable() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticsearchDomainAutoTuneOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticsearchDomainAutoTuneOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticsearchDomainAutoTuneOptions> {
        java.lang.String desiredState;
        java.lang.Object maintenanceSchedule;
        java.lang.String rollbackOnDisable;

        /**
         * Sets the value of {@link ElasticsearchDomainAutoTuneOptions#getDesiredState}
         * @param desiredState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#desired_state ElasticsearchDomain#desired_state}. This parameter is required.
         * @return {@code this}
         */
        public Builder desiredState(java.lang.String desiredState) {
            this.desiredState = desiredState;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainAutoTuneOptions#getMaintenanceSchedule}
         * @param maintenanceSchedule maintenance_schedule block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#maintenance_schedule ElasticsearchDomain#maintenance_schedule}
         * @return {@code this}
         */
        public Builder maintenanceSchedule(com.hashicorp.cdktf.IResolvable maintenanceSchedule) {
            this.maintenanceSchedule = maintenanceSchedule;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainAutoTuneOptions#getMaintenanceSchedule}
         * @param maintenanceSchedule maintenance_schedule block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#maintenance_schedule ElasticsearchDomain#maintenance_schedule}
         * @return {@code this}
         */
        public Builder maintenanceSchedule(java.util.List<? extends imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule> maintenanceSchedule) {
            this.maintenanceSchedule = maintenanceSchedule;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainAutoTuneOptions#getRollbackOnDisable}
         * @param rollbackOnDisable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#rollback_on_disable ElasticsearchDomain#rollback_on_disable}.
         * @return {@code this}
         */
        public Builder rollbackOnDisable(java.lang.String rollbackOnDisable) {
            this.rollbackOnDisable = rollbackOnDisable;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticsearchDomainAutoTuneOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticsearchDomainAutoTuneOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticsearchDomainAutoTuneOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticsearchDomainAutoTuneOptions {
        private final java.lang.String desiredState;
        private final java.lang.Object maintenanceSchedule;
        private final java.lang.String rollbackOnDisable;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.desiredState = software.amazon.jsii.Kernel.get(this, "desiredState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maintenanceSchedule = software.amazon.jsii.Kernel.get(this, "maintenanceSchedule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.rollbackOnDisable = software.amazon.jsii.Kernel.get(this, "rollbackOnDisable", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.desiredState = java.util.Objects.requireNonNull(builder.desiredState, "desiredState is required");
            this.maintenanceSchedule = builder.maintenanceSchedule;
            this.rollbackOnDisable = builder.rollbackOnDisable;
        }

        @Override
        public final java.lang.String getDesiredState() {
            return this.desiredState;
        }

        @Override
        public final java.lang.Object getMaintenanceSchedule() {
            return this.maintenanceSchedule;
        }

        @Override
        public final java.lang.String getRollbackOnDisable() {
            return this.rollbackOnDisable;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("desiredState", om.valueToTree(this.getDesiredState()));
            if (this.getMaintenanceSchedule() != null) {
                data.set("maintenanceSchedule", om.valueToTree(this.getMaintenanceSchedule()));
            }
            if (this.getRollbackOnDisable() != null) {
                data.set("rollbackOnDisable", om.valueToTree(this.getRollbackOnDisable()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticsearchDomain.ElasticsearchDomainAutoTuneOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticsearchDomainAutoTuneOptions.Jsii$Proxy that = (ElasticsearchDomainAutoTuneOptions.Jsii$Proxy) o;

            if (!desiredState.equals(that.desiredState)) return false;
            if (this.maintenanceSchedule != null ? !this.maintenanceSchedule.equals(that.maintenanceSchedule) : that.maintenanceSchedule != null) return false;
            return this.rollbackOnDisable != null ? this.rollbackOnDisable.equals(that.rollbackOnDisable) : that.rollbackOnDisable == null;
        }

        @Override
        public final int hashCode() {
            int result = this.desiredState.hashCode();
            result = 31 * result + (this.maintenanceSchedule != null ? this.maintenanceSchedule.hashCode() : 0);
            result = 31 * result + (this.rollbackOnDisable != null ? this.rollbackOnDisable.hashCode() : 0);
            return result;
        }
    }
}
