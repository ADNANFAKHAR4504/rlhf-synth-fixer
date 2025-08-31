package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.183Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorConfig")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorConfig.Jsii$Proxy.class)
public interface RekognitionStreamProcessorConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * An identifier you assign to the stream processor.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#name RekognitionStreamProcessor#name}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * The Amazon Resource Number (ARN) of the IAM role that allows access to the stream processor.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#role_arn RekognitionStreamProcessor#role_arn}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * data_sharing_preference block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#data_sharing_preference RekognitionStreamProcessor#data_sharing_preference}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataSharingPreference() {
        return null;
    }

    /**
     * input block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#input RekognitionStreamProcessor#input}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInput() {
        return null;
    }

    /**
     * The identifier for your AWS Key Management Service key (AWS KMS key).
     * <p>
     * You can supply the Amazon Resource Name (ARN) of your KMS key, the ID of your KMS key, an alias for your KMS key, or an alias ARN.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kms_key_id RekognitionStreamProcessor#kms_key_id}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * notification_channel block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#notification_channel RekognitionStreamProcessor#notification_channel}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNotificationChannel() {
        return null;
    }

    /**
     * output block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#output RekognitionStreamProcessor#output}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOutput() {
        return null;
    }

    /**
     * regions_of_interest block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#regions_of_interest RekognitionStreamProcessor#regions_of_interest}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRegionsOfInterest() {
        return null;
    }

    /**
     * settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#settings RekognitionStreamProcessor#settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#tags RekognitionStreamProcessor#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#timeouts RekognitionStreamProcessor#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.rekognition_stream_processor.RekognitionStreamProcessorTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorConfig> {
        java.lang.String name;
        java.lang.String roleArn;
        java.lang.Object dataSharingPreference;
        java.lang.Object input;
        java.lang.String kmsKeyId;
        java.lang.Object notificationChannel;
        java.lang.Object output;
        java.lang.Object regionsOfInterest;
        java.lang.Object settings;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.rekognition_stream_processor.RekognitionStreamProcessorTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getName}
         * @param name An identifier you assign to the stream processor. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#name RekognitionStreamProcessor#name}
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getRoleArn}
         * @param roleArn The Amazon Resource Number (ARN) of the IAM role that allows access to the stream processor. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#role_arn RekognitionStreamProcessor#role_arn}
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getDataSharingPreference}
         * @param dataSharingPreference data_sharing_preference block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#data_sharing_preference RekognitionStreamProcessor#data_sharing_preference}
         * @return {@code this}
         */
        public Builder dataSharingPreference(com.hashicorp.cdktf.IResolvable dataSharingPreference) {
            this.dataSharingPreference = dataSharingPreference;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getDataSharingPreference}
         * @param dataSharingPreference data_sharing_preference block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#data_sharing_preference RekognitionStreamProcessor#data_sharing_preference}
         * @return {@code this}
         */
        public Builder dataSharingPreference(java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorDataSharingPreference> dataSharingPreference) {
            this.dataSharingPreference = dataSharingPreference;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getInput}
         * @param input input block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#input RekognitionStreamProcessor#input}
         * @return {@code this}
         */
        public Builder input(com.hashicorp.cdktf.IResolvable input) {
            this.input = input;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getInput}
         * @param input input block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#input RekognitionStreamProcessor#input}
         * @return {@code this}
         */
        public Builder input(java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorInput> input) {
            this.input = input;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getKmsKeyId}
         * @param kmsKeyId The identifier for your AWS Key Management Service key (AWS KMS key).
         *                 You can supply the Amazon Resource Name (ARN) of your KMS key, the ID of your KMS key, an alias for your KMS key, or an alias ARN.
         *                 
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kms_key_id RekognitionStreamProcessor#kms_key_id}
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getNotificationChannel}
         * @param notificationChannel notification_channel block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#notification_channel RekognitionStreamProcessor#notification_channel}
         * @return {@code this}
         */
        public Builder notificationChannel(com.hashicorp.cdktf.IResolvable notificationChannel) {
            this.notificationChannel = notificationChannel;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getNotificationChannel}
         * @param notificationChannel notification_channel block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#notification_channel RekognitionStreamProcessor#notification_channel}
         * @return {@code this}
         */
        public Builder notificationChannel(java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorNotificationChannel> notificationChannel) {
            this.notificationChannel = notificationChannel;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getOutput}
         * @param output output block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#output RekognitionStreamProcessor#output}
         * @return {@code this}
         */
        public Builder output(com.hashicorp.cdktf.IResolvable output) {
            this.output = output;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getOutput}
         * @param output output block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#output RekognitionStreamProcessor#output}
         * @return {@code this}
         */
        public Builder output(java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorOutput> output) {
            this.output = output;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getRegionsOfInterest}
         * @param regionsOfInterest regions_of_interest block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#regions_of_interest RekognitionStreamProcessor#regions_of_interest}
         * @return {@code this}
         */
        public Builder regionsOfInterest(com.hashicorp.cdktf.IResolvable regionsOfInterest) {
            this.regionsOfInterest = regionsOfInterest;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getRegionsOfInterest}
         * @param regionsOfInterest regions_of_interest block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#regions_of_interest RekognitionStreamProcessor#regions_of_interest}
         * @return {@code this}
         */
        public Builder regionsOfInterest(java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterest> regionsOfInterest) {
            this.regionsOfInterest = regionsOfInterest;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getSettings}
         * @param settings settings block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#settings RekognitionStreamProcessor#settings}
         * @return {@code this}
         */
        public Builder settings(com.hashicorp.cdktf.IResolvable settings) {
            this.settings = settings;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getSettings}
         * @param settings settings block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#settings RekognitionStreamProcessor#settings}
         * @return {@code this}
         */
        public Builder settings(java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorSettings> settings) {
            this.settings = settings;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#tags RekognitionStreamProcessor#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#timeouts RekognitionStreamProcessor#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorConfig {
        private final java.lang.String name;
        private final java.lang.String roleArn;
        private final java.lang.Object dataSharingPreference;
        private final java.lang.Object input;
        private final java.lang.String kmsKeyId;
        private final java.lang.Object notificationChannel;
        private final java.lang.Object output;
        private final java.lang.Object regionsOfInterest;
        private final java.lang.Object settings;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorTimeouts timeouts;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataSharingPreference = software.amazon.jsii.Kernel.get(this, "dataSharingPreference", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.input = software.amazon.jsii.Kernel.get(this, "input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notificationChannel = software.amazon.jsii.Kernel.get(this, "notificationChannel", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.output = software.amazon.jsii.Kernel.get(this, "output", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.regionsOfInterest = software.amazon.jsii.Kernel.get(this, "regionsOfInterest", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.settings = software.amazon.jsii.Kernel.get(this, "settings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorTimeouts.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.dataSharingPreference = builder.dataSharingPreference;
            this.input = builder.input;
            this.kmsKeyId = builder.kmsKeyId;
            this.notificationChannel = builder.notificationChannel;
            this.output = builder.output;
            this.regionsOfInterest = builder.regionsOfInterest;
            this.settings = builder.settings;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Object getDataSharingPreference() {
            return this.dataSharingPreference;
        }

        @Override
        public final java.lang.Object getInput() {
            return this.input;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.Object getNotificationChannel() {
            return this.notificationChannel;
        }

        @Override
        public final java.lang.Object getOutput() {
            return this.output;
        }

        @Override
        public final java.lang.Object getRegionsOfInterest() {
            return this.regionsOfInterest;
        }

        @Override
        public final java.lang.Object getSettings() {
            return this.settings;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getDataSharingPreference() != null) {
                data.set("dataSharingPreference", om.valueToTree(this.getDataSharingPreference()));
            }
            if (this.getInput() != null) {
                data.set("input", om.valueToTree(this.getInput()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getNotificationChannel() != null) {
                data.set("notificationChannel", om.valueToTree(this.getNotificationChannel()));
            }
            if (this.getOutput() != null) {
                data.set("output", om.valueToTree(this.getOutput()));
            }
            if (this.getRegionsOfInterest() != null) {
                data.set("regionsOfInterest", om.valueToTree(this.getRegionsOfInterest()));
            }
            if (this.getSettings() != null) {
                data.set("settings", om.valueToTree(this.getSettings()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorConfig.Jsii$Proxy that = (RekognitionStreamProcessorConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.dataSharingPreference != null ? !this.dataSharingPreference.equals(that.dataSharingPreference) : that.dataSharingPreference != null) return false;
            if (this.input != null ? !this.input.equals(that.input) : that.input != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.notificationChannel != null ? !this.notificationChannel.equals(that.notificationChannel) : that.notificationChannel != null) return false;
            if (this.output != null ? !this.output.equals(that.output) : that.output != null) return false;
            if (this.regionsOfInterest != null ? !this.regionsOfInterest.equals(that.regionsOfInterest) : that.regionsOfInterest != null) return false;
            if (this.settings != null ? !this.settings.equals(that.settings) : that.settings != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.dataSharingPreference != null ? this.dataSharingPreference.hashCode() : 0);
            result = 31 * result + (this.input != null ? this.input.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.notificationChannel != null ? this.notificationChannel.hashCode() : 0);
            result = 31 * result + (this.output != null ? this.output.hashCode() : 0);
            result = 31 * result + (this.regionsOfInterest != null ? this.regionsOfInterest.hashCode() : 0);
            result = 31 * result + (this.settings != null ? this.settings.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
