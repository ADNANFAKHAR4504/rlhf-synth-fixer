# Use Ubuntu 24.04 as base image
FROM ubuntu:24.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    libssl-dev \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    libncurses5-dev \
    libncursesw5-dev \
    xz-utils \
    tk-dev \
    libffi-dev \
    liblzma-dev \
    unzip \
    jq \
    bc \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Java 17 (Temurin distribution)
RUN wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor -o /usr/share/keyrings/adoptium-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/adoptium-keyring.gpg] https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | tee /etc/apt/sources.list.d/adoptium.list && \
    apt-get update && \
    apt-get install -y temurin-17-jdk && \
    rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME environment variable
ENV JAVA_HOME=/usr/lib/jvm/temurin-17-jdk-amd64
ENV PATH="$JAVA_HOME/bin:$PATH"

# Install Gradle
RUN wget https://services.gradle.org/distributions/gradle-8.5-bin.zip -O gradle.zip && \
    unzip gradle.zip && \
    mv gradle-8.5 /opt/gradle && \
    rm gradle.zip

# Set Gradle environment variables
ENV GRADLE_HOME=/opt/gradle
ENV PATH="$GRADLE_HOME/bin:$PATH"

# Install Go 1.23.12
RUN wget https://go.dev/dl/go1.23.12.linux-amd64.tar.gz -O go.tar.gz && \
    tar -C /usr/local -xzf go.tar.gz && \
    rm go.tar.gz

# Set Go environment variables
ENV GOROOT=/usr/local/go
ENV GOPATH=/root/go
ENV PATH="$GOROOT/bin:$GOPATH/bin:$PATH"

# Install AWS CLI (arch-aware)
RUN arch=$(uname -m) && \
    if [ "$arch" = "x86_64" ]; then \
      curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"; \
    elif [ "$arch" = "aarch64" ]; then \
      curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"; \
    else \
      echo "Unsupported architecture: $arch" && exit 1; \
    fi && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws/

# Install Terraform 1.12.2
RUN curl -fsSL https://releases.hashicorp.com/terraform/1.12.2/terraform_1.12.2_linux_amd64.zip -o terraform.zip && \
    unzip terraform.zip && \
    mv terraform /usr/local/bin/ && \
    chmod +x /usr/local/bin/terraform && \
    rm terraform.zip

# Install Pulumi 3.109.0
RUN curl -fsSL https://get.pulumi.com/releases/sdk/pulumi-v3.109.0-linux-x64.tar.gz -o pulumi.tar.gz && \
    tar -xzf pulumi.tar.gz && \
    mv pulumi/* /usr/local/bin/ && \
    rm -rf pulumi.tar.gz pulumi/

# Install pyenv
RUN curl https://pyenv.run | bash

# Add pyenv to PATH
ENV PATH="/root/.pyenv/bin:$PATH"
ENV PYENV_ROOT="/root/.pyenv"

# Install Python 3.13 using pyenv
RUN eval "$(pyenv init --path)" && \
    eval "$(pyenv init -)" && \
    pyenv install 3.13 && \
    pyenv global 3.13

# Set Python 3.13 as default
ENV PATH="/root/.pyenv/versions/3.13/bin:$PATH"

# Install nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Add nvm to PATH
ENV NVM_DIR="/root/.nvm"
ENV PATH="$NVM_DIR:$PATH"

# Install Node.js 22.17.0 using nvm
RUN . "$NVM_DIR/nvm.sh" && \
    nvm install 22.17.0 && \
    nvm use 22.17.0 && \
    nvm alias default 22.17.0

# Set Node.js 22.17.0 as default
ENV PATH="/root/.nvm/versions/node/v22.17.0/bin:$PATH"

# Install pipenv 2025.0.4
RUN python -m pip install --upgrade pip && \
    pip install pipenv==2025.0.4

# Initialize pyenv and nvm in shell profile for faster container startup
RUN echo 'export PATH="/root/.pyenv/bin:$PATH"' >> /root/.bashrc && \
    echo 'export PYENV_ROOT="/root/.pyenv"' >> /root/.bashrc && \
    echo 'export PATH="/root/.pyenv/versions/3.13/bin:$PATH"' >> /root/.bashrc && \
    echo 'export NVM_DIR="/root/.nvm"' >> /root/.bashrc && \
    echo 'export PATH="$NVM_DIR:$PATH"' >> /root/.bashrc && \
    echo 'export PATH="/root/.nvm/versions/node/v22.17.0/bin:$PATH"' >> /root/.bashrc && \
    echo 'eval "$(pyenv init --path)"' >> /root/.bashrc && \
    echo 'eval "$(pyenv init -)"' >> /root/.bashrc && \
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> /root/.bashrc

# Copy dockerEntryPoint.sh script
COPY dockerEntryPoint.sh /dockerEntryPoint.sh
RUN chmod +x /dockerEntryPoint.sh

# Set working directory
WORKDIR /app

# Copy application code
COPY . .
RUN chmod -R +x scripts

# Run setup.sh to prepare the environment
RUN ./scripts/setup.sh

# Set entrypoint    
ENTRYPOINT ["/dockerEntryPoint.sh"]
