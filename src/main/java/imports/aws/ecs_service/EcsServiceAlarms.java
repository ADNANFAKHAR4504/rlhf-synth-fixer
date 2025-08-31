package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.130Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceAlarms")
@software.amazon.jsii.Jsii.Proxy(EcsServiceAlarms.Jsii$Proxy.class)
public interface EcsServiceAlarms extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#alarm_names EcsService#alarm_names}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAlarmNames();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#enable EcsService#enable}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnable();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#rollback EcsService#rollback}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getRollback();

    /**
     * @return a {@link Builder} of {@link EcsServiceAlarms}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsServiceAlarms}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsServiceAlarms> {
        java.util.List<java.lang.String> alarmNames;
        java.lang.Object enable;
        java.lang.Object rollback;

        /**
         * Sets the value of {@link EcsServiceAlarms#getAlarmNames}
         * @param alarmNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#alarm_names EcsService#alarm_names}. This parameter is required.
         * @return {@code this}
         */
        public Builder alarmNames(java.util.List<java.lang.String> alarmNames) {
            this.alarmNames = alarmNames;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceAlarms#getEnable}
         * @param enable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#enable EcsService#enable}. This parameter is required.
         * @return {@code this}
         */
        public Builder enable(java.lang.Boolean enable) {
            this.enable = enable;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceAlarms#getEnable}
         * @param enable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#enable EcsService#enable}. This parameter is required.
         * @return {@code this}
         */
        public Builder enable(com.hashicorp.cdktf.IResolvable enable) {
            this.enable = enable;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceAlarms#getRollback}
         * @param rollback Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#rollback EcsService#rollback}. This parameter is required.
         * @return {@code this}
         */
        public Builder rollback(java.lang.Boolean rollback) {
            this.rollback = rollback;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceAlarms#getRollback}
         * @param rollback Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#rollback EcsService#rollback}. This parameter is required.
         * @return {@code this}
         */
        public Builder rollback(com.hashicorp.cdktf.IResolvable rollback) {
            this.rollback = rollback;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsServiceAlarms}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsServiceAlarms build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsServiceAlarms}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsServiceAlarms {
        private final java.util.List<java.lang.String> alarmNames;
        private final java.lang.Object enable;
        private final java.lang.Object rollback;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.alarmNames = software.amazon.jsii.Kernel.get(this, "alarmNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.enable = software.amazon.jsii.Kernel.get(this, "enable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.rollback = software.amazon.jsii.Kernel.get(this, "rollback", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.alarmNames = java.util.Objects.requireNonNull(builder.alarmNames, "alarmNames is required");
            this.enable = java.util.Objects.requireNonNull(builder.enable, "enable is required");
            this.rollback = java.util.Objects.requireNonNull(builder.rollback, "rollback is required");
        }

        @Override
        public final java.util.List<java.lang.String> getAlarmNames() {
            return this.alarmNames;
        }

        @Override
        public final java.lang.Object getEnable() {
            return this.enable;
        }

        @Override
        public final java.lang.Object getRollback() {
            return this.rollback;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("alarmNames", om.valueToTree(this.getAlarmNames()));
            data.set("enable", om.valueToTree(this.getEnable()));
            data.set("rollback", om.valueToTree(this.getRollback()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsService.EcsServiceAlarms"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsServiceAlarms.Jsii$Proxy that = (EcsServiceAlarms.Jsii$Proxy) o;

            if (!alarmNames.equals(that.alarmNames)) return false;
            if (!enable.equals(that.enable)) return false;
            return this.rollback.equals(that.rollback);
        }

        @Override
        public final int hashCode() {
            int result = this.alarmNames.hashCode();
            result = 31 * result + (this.enable.hashCode());
            result = 31 * result + (this.rollback.hashCode());
            return result;
        }
    }
}
