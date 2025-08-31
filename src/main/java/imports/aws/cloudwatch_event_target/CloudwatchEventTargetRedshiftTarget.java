package imports.aws.cloudwatch_event_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.280Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventTarget.CloudwatchEventTargetRedshiftTarget")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventTargetRedshiftTarget.Jsii$Proxy.class)
public interface CloudwatchEventTargetRedshiftTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#database CloudwatchEventTarget#database}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabase();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#db_user CloudwatchEventTarget#db_user}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbUser() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#secrets_manager_arn CloudwatchEventTarget#secrets_manager_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretsManagerArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#sql CloudwatchEventTarget#sql}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSql() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#statement_name CloudwatchEventTarget#statement_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatementName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#with_event CloudwatchEventTarget#with_event}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWithEvent() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventTargetRedshiftTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventTargetRedshiftTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventTargetRedshiftTarget> {
        java.lang.String database;
        java.lang.String dbUser;
        java.lang.String secretsManagerArn;
        java.lang.String sql;
        java.lang.String statementName;
        java.lang.Object withEvent;

        /**
         * Sets the value of {@link CloudwatchEventTargetRedshiftTarget#getDatabase}
         * @param database Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#database CloudwatchEventTarget#database}. This parameter is required.
         * @return {@code this}
         */
        public Builder database(java.lang.String database) {
            this.database = database;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetRedshiftTarget#getDbUser}
         * @param dbUser Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#db_user CloudwatchEventTarget#db_user}.
         * @return {@code this}
         */
        public Builder dbUser(java.lang.String dbUser) {
            this.dbUser = dbUser;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetRedshiftTarget#getSecretsManagerArn}
         * @param secretsManagerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#secrets_manager_arn CloudwatchEventTarget#secrets_manager_arn}.
         * @return {@code this}
         */
        public Builder secretsManagerArn(java.lang.String secretsManagerArn) {
            this.secretsManagerArn = secretsManagerArn;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetRedshiftTarget#getSql}
         * @param sql Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#sql CloudwatchEventTarget#sql}.
         * @return {@code this}
         */
        public Builder sql(java.lang.String sql) {
            this.sql = sql;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetRedshiftTarget#getStatementName}
         * @param statementName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#statement_name CloudwatchEventTarget#statement_name}.
         * @return {@code this}
         */
        public Builder statementName(java.lang.String statementName) {
            this.statementName = statementName;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetRedshiftTarget#getWithEvent}
         * @param withEvent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#with_event CloudwatchEventTarget#with_event}.
         * @return {@code this}
         */
        public Builder withEvent(java.lang.Boolean withEvent) {
            this.withEvent = withEvent;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetRedshiftTarget#getWithEvent}
         * @param withEvent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#with_event CloudwatchEventTarget#with_event}.
         * @return {@code this}
         */
        public Builder withEvent(com.hashicorp.cdktf.IResolvable withEvent) {
            this.withEvent = withEvent;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventTargetRedshiftTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventTargetRedshiftTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventTargetRedshiftTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventTargetRedshiftTarget {
        private final java.lang.String database;
        private final java.lang.String dbUser;
        private final java.lang.String secretsManagerArn;
        private final java.lang.String sql;
        private final java.lang.String statementName;
        private final java.lang.Object withEvent;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.database = software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbUser = software.amazon.jsii.Kernel.get(this, "dbUser", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretsManagerArn = software.amazon.jsii.Kernel.get(this, "secretsManagerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sql = software.amazon.jsii.Kernel.get(this, "sql", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.statementName = software.amazon.jsii.Kernel.get(this, "statementName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.withEvent = software.amazon.jsii.Kernel.get(this, "withEvent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.database = java.util.Objects.requireNonNull(builder.database, "database is required");
            this.dbUser = builder.dbUser;
            this.secretsManagerArn = builder.secretsManagerArn;
            this.sql = builder.sql;
            this.statementName = builder.statementName;
            this.withEvent = builder.withEvent;
        }

        @Override
        public final java.lang.String getDatabase() {
            return this.database;
        }

        @Override
        public final java.lang.String getDbUser() {
            return this.dbUser;
        }

        @Override
        public final java.lang.String getSecretsManagerArn() {
            return this.secretsManagerArn;
        }

        @Override
        public final java.lang.String getSql() {
            return this.sql;
        }

        @Override
        public final java.lang.String getStatementName() {
            return this.statementName;
        }

        @Override
        public final java.lang.Object getWithEvent() {
            return this.withEvent;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("database", om.valueToTree(this.getDatabase()));
            if (this.getDbUser() != null) {
                data.set("dbUser", om.valueToTree(this.getDbUser()));
            }
            if (this.getSecretsManagerArn() != null) {
                data.set("secretsManagerArn", om.valueToTree(this.getSecretsManagerArn()));
            }
            if (this.getSql() != null) {
                data.set("sql", om.valueToTree(this.getSql()));
            }
            if (this.getStatementName() != null) {
                data.set("statementName", om.valueToTree(this.getStatementName()));
            }
            if (this.getWithEvent() != null) {
                data.set("withEvent", om.valueToTree(this.getWithEvent()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventTarget.CloudwatchEventTargetRedshiftTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventTargetRedshiftTarget.Jsii$Proxy that = (CloudwatchEventTargetRedshiftTarget.Jsii$Proxy) o;

            if (!database.equals(that.database)) return false;
            if (this.dbUser != null ? !this.dbUser.equals(that.dbUser) : that.dbUser != null) return false;
            if (this.secretsManagerArn != null ? !this.secretsManagerArn.equals(that.secretsManagerArn) : that.secretsManagerArn != null) return false;
            if (this.sql != null ? !this.sql.equals(that.sql) : that.sql != null) return false;
            if (this.statementName != null ? !this.statementName.equals(that.statementName) : that.statementName != null) return false;
            return this.withEvent != null ? this.withEvent.equals(that.withEvent) : that.withEvent == null;
        }

        @Override
        public final int hashCode() {
            int result = this.database.hashCode();
            result = 31 * result + (this.dbUser != null ? this.dbUser.hashCode() : 0);
            result = 31 * result + (this.secretsManagerArn != null ? this.secretsManagerArn.hashCode() : 0);
            result = 31 * result + (this.sql != null ? this.sql.hashCode() : 0);
            result = 31 * result + (this.statementName != null ? this.statementName.hashCode() : 0);
            result = 31 * result + (this.withEvent != null ? this.withEvent.hashCode() : 0);
            return result;
        }
    }
}
