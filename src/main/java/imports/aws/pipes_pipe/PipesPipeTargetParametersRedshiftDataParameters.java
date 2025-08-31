package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.075Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersRedshiftDataParameters")
@software.amazon.jsii.Jsii.Proxy(PipesPipeTargetParametersRedshiftDataParameters.Jsii$Proxy.class)
public interface PipesPipeTargetParametersRedshiftDataParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#database PipesPipe#database}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabase();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqls PipesPipe#sqls}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSqls();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#db_user PipesPipe#db_user}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbUser() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#secret_manager_arn PipesPipe#secret_manager_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretManagerArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#statement_name PipesPipe#statement_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatementName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#with_event PipesPipe#with_event}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWithEvent() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeTargetParametersRedshiftDataParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeTargetParametersRedshiftDataParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeTargetParametersRedshiftDataParameters> {
        java.lang.String database;
        java.util.List<java.lang.String> sqls;
        java.lang.String dbUser;
        java.lang.String secretManagerArn;
        java.lang.String statementName;
        java.lang.Object withEvent;

        /**
         * Sets the value of {@link PipesPipeTargetParametersRedshiftDataParameters#getDatabase}
         * @param database Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#database PipesPipe#database}. This parameter is required.
         * @return {@code this}
         */
        public Builder database(java.lang.String database) {
            this.database = database;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersRedshiftDataParameters#getSqls}
         * @param sqls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqls PipesPipe#sqls}. This parameter is required.
         * @return {@code this}
         */
        public Builder sqls(java.util.List<java.lang.String> sqls) {
            this.sqls = sqls;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersRedshiftDataParameters#getDbUser}
         * @param dbUser Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#db_user PipesPipe#db_user}.
         * @return {@code this}
         */
        public Builder dbUser(java.lang.String dbUser) {
            this.dbUser = dbUser;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersRedshiftDataParameters#getSecretManagerArn}
         * @param secretManagerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#secret_manager_arn PipesPipe#secret_manager_arn}.
         * @return {@code this}
         */
        public Builder secretManagerArn(java.lang.String secretManagerArn) {
            this.secretManagerArn = secretManagerArn;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersRedshiftDataParameters#getStatementName}
         * @param statementName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#statement_name PipesPipe#statement_name}.
         * @return {@code this}
         */
        public Builder statementName(java.lang.String statementName) {
            this.statementName = statementName;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersRedshiftDataParameters#getWithEvent}
         * @param withEvent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#with_event PipesPipe#with_event}.
         * @return {@code this}
         */
        public Builder withEvent(java.lang.Boolean withEvent) {
            this.withEvent = withEvent;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersRedshiftDataParameters#getWithEvent}
         * @param withEvent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#with_event PipesPipe#with_event}.
         * @return {@code this}
         */
        public Builder withEvent(com.hashicorp.cdktf.IResolvable withEvent) {
            this.withEvent = withEvent;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeTargetParametersRedshiftDataParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeTargetParametersRedshiftDataParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeTargetParametersRedshiftDataParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeTargetParametersRedshiftDataParameters {
        private final java.lang.String database;
        private final java.util.List<java.lang.String> sqls;
        private final java.lang.String dbUser;
        private final java.lang.String secretManagerArn;
        private final java.lang.String statementName;
        private final java.lang.Object withEvent;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.database = software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sqls = software.amazon.jsii.Kernel.get(this, "sqls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.dbUser = software.amazon.jsii.Kernel.get(this, "dbUser", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretManagerArn = software.amazon.jsii.Kernel.get(this, "secretManagerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.statementName = software.amazon.jsii.Kernel.get(this, "statementName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.withEvent = software.amazon.jsii.Kernel.get(this, "withEvent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.database = java.util.Objects.requireNonNull(builder.database, "database is required");
            this.sqls = java.util.Objects.requireNonNull(builder.sqls, "sqls is required");
            this.dbUser = builder.dbUser;
            this.secretManagerArn = builder.secretManagerArn;
            this.statementName = builder.statementName;
            this.withEvent = builder.withEvent;
        }

        @Override
        public final java.lang.String getDatabase() {
            return this.database;
        }

        @Override
        public final java.util.List<java.lang.String> getSqls() {
            return this.sqls;
        }

        @Override
        public final java.lang.String getDbUser() {
            return this.dbUser;
        }

        @Override
        public final java.lang.String getSecretManagerArn() {
            return this.secretManagerArn;
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
            data.set("sqls", om.valueToTree(this.getSqls()));
            if (this.getDbUser() != null) {
                data.set("dbUser", om.valueToTree(this.getDbUser()));
            }
            if (this.getSecretManagerArn() != null) {
                data.set("secretManagerArn", om.valueToTree(this.getSecretManagerArn()));
            }
            if (this.getStatementName() != null) {
                data.set("statementName", om.valueToTree(this.getStatementName()));
            }
            if (this.getWithEvent() != null) {
                data.set("withEvent", om.valueToTree(this.getWithEvent()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeTargetParametersRedshiftDataParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeTargetParametersRedshiftDataParameters.Jsii$Proxy that = (PipesPipeTargetParametersRedshiftDataParameters.Jsii$Proxy) o;

            if (!database.equals(that.database)) return false;
            if (!sqls.equals(that.sqls)) return false;
            if (this.dbUser != null ? !this.dbUser.equals(that.dbUser) : that.dbUser != null) return false;
            if (this.secretManagerArn != null ? !this.secretManagerArn.equals(that.secretManagerArn) : that.secretManagerArn != null) return false;
            if (this.statementName != null ? !this.statementName.equals(that.statementName) : that.statementName != null) return false;
            return this.withEvent != null ? this.withEvent.equals(that.withEvent) : that.withEvent == null;
        }

        @Override
        public final int hashCode() {
            int result = this.database.hashCode();
            result = 31 * result + (this.sqls.hashCode());
            result = 31 * result + (this.dbUser != null ? this.dbUser.hashCode() : 0);
            result = 31 * result + (this.secretManagerArn != null ? this.secretManagerArn.hashCode() : 0);
            result = 31 * result + (this.statementName != null ? this.statementName.hashCode() : 0);
            result = 31 * result + (this.withEvent != null ? this.withEvent.hashCode() : 0);
            return result;
        }
    }
}
