package imports.aws.secretsmanager_secret_rotation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.367Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.secretsmanagerSecretRotation.SecretsmanagerSecretRotationRotationRules")
@software.amazon.jsii.Jsii.Proxy(SecretsmanagerSecretRotationRotationRules.Jsii$Proxy.class)
public interface SecretsmanagerSecretRotationRotationRules extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_rotation#automatically_after_days SecretsmanagerSecretRotation#automatically_after_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAutomaticallyAfterDays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_rotation#duration SecretsmanagerSecretRotation#duration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDuration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_rotation#schedule_expression SecretsmanagerSecretRotation#schedule_expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScheduleExpression() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecretsmanagerSecretRotationRotationRules}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecretsmanagerSecretRotationRotationRules}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecretsmanagerSecretRotationRotationRules> {
        java.lang.Number automaticallyAfterDays;
        java.lang.String duration;
        java.lang.String scheduleExpression;

        /**
         * Sets the value of {@link SecretsmanagerSecretRotationRotationRules#getAutomaticallyAfterDays}
         * @param automaticallyAfterDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_rotation#automatically_after_days SecretsmanagerSecretRotation#automatically_after_days}.
         * @return {@code this}
         */
        public Builder automaticallyAfterDays(java.lang.Number automaticallyAfterDays) {
            this.automaticallyAfterDays = automaticallyAfterDays;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretRotationRotationRules#getDuration}
         * @param duration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_rotation#duration SecretsmanagerSecretRotation#duration}.
         * @return {@code this}
         */
        public Builder duration(java.lang.String duration) {
            this.duration = duration;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretRotationRotationRules#getScheduleExpression}
         * @param scheduleExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_rotation#schedule_expression SecretsmanagerSecretRotation#schedule_expression}.
         * @return {@code this}
         */
        public Builder scheduleExpression(java.lang.String scheduleExpression) {
            this.scheduleExpression = scheduleExpression;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecretsmanagerSecretRotationRotationRules}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecretsmanagerSecretRotationRotationRules build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecretsmanagerSecretRotationRotationRules}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecretsmanagerSecretRotationRotationRules {
        private final java.lang.Number automaticallyAfterDays;
        private final java.lang.String duration;
        private final java.lang.String scheduleExpression;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.automaticallyAfterDays = software.amazon.jsii.Kernel.get(this, "automaticallyAfterDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.duration = software.amazon.jsii.Kernel.get(this, "duration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scheduleExpression = software.amazon.jsii.Kernel.get(this, "scheduleExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.automaticallyAfterDays = builder.automaticallyAfterDays;
            this.duration = builder.duration;
            this.scheduleExpression = builder.scheduleExpression;
        }

        @Override
        public final java.lang.Number getAutomaticallyAfterDays() {
            return this.automaticallyAfterDays;
        }

        @Override
        public final java.lang.String getDuration() {
            return this.duration;
        }

        @Override
        public final java.lang.String getScheduleExpression() {
            return this.scheduleExpression;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAutomaticallyAfterDays() != null) {
                data.set("automaticallyAfterDays", om.valueToTree(this.getAutomaticallyAfterDays()));
            }
            if (this.getDuration() != null) {
                data.set("duration", om.valueToTree(this.getDuration()));
            }
            if (this.getScheduleExpression() != null) {
                data.set("scheduleExpression", om.valueToTree(this.getScheduleExpression()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.secretsmanagerSecretRotation.SecretsmanagerSecretRotationRotationRules"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecretsmanagerSecretRotationRotationRules.Jsii$Proxy that = (SecretsmanagerSecretRotationRotationRules.Jsii$Proxy) o;

            if (this.automaticallyAfterDays != null ? !this.automaticallyAfterDays.equals(that.automaticallyAfterDays) : that.automaticallyAfterDays != null) return false;
            if (this.duration != null ? !this.duration.equals(that.duration) : that.duration != null) return false;
            return this.scheduleExpression != null ? this.scheduleExpression.equals(that.scheduleExpression) : that.scheduleExpression == null;
        }

        @Override
        public final int hashCode() {
            int result = this.automaticallyAfterDays != null ? this.automaticallyAfterDays.hashCode() : 0;
            result = 31 * result + (this.duration != null ? this.duration.hashCode() : 0);
            result = 31 * result + (this.scheduleExpression != null ? this.scheduleExpression.hashCode() : 0);
            return result;
        }
    }
}
