package imports.aws.ssm_maintenance_window_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.498Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParameters")
@software.amazon.jsii.Jsii.Proxy(SsmMaintenanceWindowTaskTaskInvocationParameters.Jsii$Proxy.class)
public interface SsmMaintenanceWindowTaskTaskInvocationParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * automation_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#automation_parameters SsmMaintenanceWindowTask#automation_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters getAutomationParameters() {
        return null;
    }

    /**
     * lambda_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#lambda_parameters SsmMaintenanceWindowTask#lambda_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters getLambdaParameters() {
        return null;
    }

    /**
     * run_command_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#run_command_parameters SsmMaintenanceWindowTask#run_command_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters getRunCommandParameters() {
        return null;
    }

    /**
     * step_functions_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#step_functions_parameters SsmMaintenanceWindowTask#step_functions_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersStepFunctionsParameters getStepFunctionsParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmMaintenanceWindowTaskTaskInvocationParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmMaintenanceWindowTaskTaskInvocationParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmMaintenanceWindowTaskTaskInvocationParameters> {
        imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters automationParameters;
        imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters lambdaParameters;
        imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters runCommandParameters;
        imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersStepFunctionsParameters stepFunctionsParameters;

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParameters#getAutomationParameters}
         * @param automationParameters automation_parameters block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#automation_parameters SsmMaintenanceWindowTask#automation_parameters}
         * @return {@code this}
         */
        public Builder automationParameters(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters automationParameters) {
            this.automationParameters = automationParameters;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParameters#getLambdaParameters}
         * @param lambdaParameters lambda_parameters block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#lambda_parameters SsmMaintenanceWindowTask#lambda_parameters}
         * @return {@code this}
         */
        public Builder lambdaParameters(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters lambdaParameters) {
            this.lambdaParameters = lambdaParameters;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParameters#getRunCommandParameters}
         * @param runCommandParameters run_command_parameters block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#run_command_parameters SsmMaintenanceWindowTask#run_command_parameters}
         * @return {@code this}
         */
        public Builder runCommandParameters(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters runCommandParameters) {
            this.runCommandParameters = runCommandParameters;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParameters#getStepFunctionsParameters}
         * @param stepFunctionsParameters step_functions_parameters block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#step_functions_parameters SsmMaintenanceWindowTask#step_functions_parameters}
         * @return {@code this}
         */
        public Builder stepFunctionsParameters(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersStepFunctionsParameters stepFunctionsParameters) {
            this.stepFunctionsParameters = stepFunctionsParameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmMaintenanceWindowTaskTaskInvocationParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmMaintenanceWindowTaskTaskInvocationParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmMaintenanceWindowTaskTaskInvocationParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmMaintenanceWindowTaskTaskInvocationParameters {
        private final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters automationParameters;
        private final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters lambdaParameters;
        private final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters runCommandParameters;
        private final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersStepFunctionsParameters stepFunctionsParameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.automationParameters = software.amazon.jsii.Kernel.get(this, "automationParameters", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters.class));
            this.lambdaParameters = software.amazon.jsii.Kernel.get(this, "lambdaParameters", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters.class));
            this.runCommandParameters = software.amazon.jsii.Kernel.get(this, "runCommandParameters", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters.class));
            this.stepFunctionsParameters = software.amazon.jsii.Kernel.get(this, "stepFunctionsParameters", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersStepFunctionsParameters.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.automationParameters = builder.automationParameters;
            this.lambdaParameters = builder.lambdaParameters;
            this.runCommandParameters = builder.runCommandParameters;
            this.stepFunctionsParameters = builder.stepFunctionsParameters;
        }

        @Override
        public final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters getAutomationParameters() {
            return this.automationParameters;
        }

        @Override
        public final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters getLambdaParameters() {
            return this.lambdaParameters;
        }

        @Override
        public final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters getRunCommandParameters() {
            return this.runCommandParameters;
        }

        @Override
        public final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersStepFunctionsParameters getStepFunctionsParameters() {
            return this.stepFunctionsParameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAutomationParameters() != null) {
                data.set("automationParameters", om.valueToTree(this.getAutomationParameters()));
            }
            if (this.getLambdaParameters() != null) {
                data.set("lambdaParameters", om.valueToTree(this.getLambdaParameters()));
            }
            if (this.getRunCommandParameters() != null) {
                data.set("runCommandParameters", om.valueToTree(this.getRunCommandParameters()));
            }
            if (this.getStepFunctionsParameters() != null) {
                data.set("stepFunctionsParameters", om.valueToTree(this.getStepFunctionsParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmMaintenanceWindowTaskTaskInvocationParameters.Jsii$Proxy that = (SsmMaintenanceWindowTaskTaskInvocationParameters.Jsii$Proxy) o;

            if (this.automationParameters != null ? !this.automationParameters.equals(that.automationParameters) : that.automationParameters != null) return false;
            if (this.lambdaParameters != null ? !this.lambdaParameters.equals(that.lambdaParameters) : that.lambdaParameters != null) return false;
            if (this.runCommandParameters != null ? !this.runCommandParameters.equals(that.runCommandParameters) : that.runCommandParameters != null) return false;
            return this.stepFunctionsParameters != null ? this.stepFunctionsParameters.equals(that.stepFunctionsParameters) : that.stepFunctionsParameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.automationParameters != null ? this.automationParameters.hashCode() : 0;
            result = 31 * result + (this.lambdaParameters != null ? this.lambdaParameters.hashCode() : 0);
            result = 31 * result + (this.runCommandParameters != null ? this.runCommandParameters.hashCode() : 0);
            result = 31 * result + (this.stepFunctionsParameters != null ? this.stepFunctionsParameters.hashCode() : 0);
            return result;
        }
    }
}
