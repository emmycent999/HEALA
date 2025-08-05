# Production Deployment Guide

This guide covers deploying the dockerized Node.js healthcare backend to various cloud platforms with Supabase integration.

## 🌐 Deployment Options

### Option 1: AWS ECS with Fargate

#### Task Definition

```json
{
  "family": "healthcare-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "healthcare-api",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/healthcare-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:healthcare/supabase-db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:healthcare/jwt-secret"
        },
        {
          "name": "SUPABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:healthcare/supabase-url"
        },
        {
          "name": "SUPABASE_SERVICE_ROLE_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:healthcare/supabase-service-key"
        },
        {
          "name": "PAYSTACK_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:healthcare/paystack-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/healthcare-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### ECS Service Configuration

```json
{
  "serviceName": "healthcare-backend-service",
  "cluster": "healthcare-cluster",
  "taskDefinition": "healthcare-backend:1",
  "desiredCount": 2,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": [
        "subnet-xxxxxxxxx",
        "subnet-yyyyyyyyy"
      ],
      "securityGroups": [
        "sg-xxxxxxxxx"
      ],
      "assignPublicIp": "ENABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:REGION:ACCOUNT:targetgroup/healthcare-tg/xxxxxxxxx",
      "containerName": "healthcare-api",
      "containerPort": 3000
    }
  ],
  "healthCheckGracePeriodSeconds": 300
}
```

### Option 2: Google Cloud Run

#### cloudbuild.yaml

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/healthcare-backend:$COMMIT_SHA', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/healthcare-backend:$COMMIT_SHA']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
    - 'run'
    - 'deploy'
    - 'healthcare-backend'
    - '--image'
    - 'gcr.io/$PROJECT_ID/healthcare-backend:$COMMIT_SHA'
    - '--region'
    - 'us-central1'
    - '--platform'
    - 'managed'
    - '--allow-unauthenticated'
    - '--set-env-vars'
    - 'NODE_ENV=production'
    - '--set-secrets'
    - 'DATABASE_URL=supabase-db-url:latest'
    - '--set-secrets'
    - 'JWT_SECRET=jwt-secret:latest'
    - '--memory'
    - '2Gi'
    - '--cpu'
    - '2'
    - '--max-instances'
    - '10'
    - '--concurrency'
    - '80'

options:
  logging: CLOUD_LOGGING_ONLY
```

#### Cloud Run Service YAML

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: healthcare-backend
  namespace: default
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/ingress-status: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '10'
        autoscaling.knative.dev/minScale: '1'
        run.googleapis.com/cpu-throttling: 'false'
        run.googleapis.com/execution-environment: gen2
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/PROJECT_ID/healthcare-backend:latest
        ports:
        - name: http1
          containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: '3000'
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              key: latest
              name: supabase-db-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              key: latest
              name: jwt-secret
        resources:
          limits:
            cpu: '2'
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Option 3: Azure Container Instances

#### ARM Template

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "containerName": {
      "type": "string",
      "defaultValue": "healthcare-backend"
    },
    "imageName": {
      "type": "string",
      "defaultValue": "youracr.azurecr.io/healthcare-backend:latest"
    }
  },
  "resources": [
    {
      "type": "Microsoft.ContainerInstance/containerGroups",
      "apiVersion": "2021-09-01",
      "name": "[parameters('containerName')]",
      "location": "[resourceGroup().location]",
      "properties": {
        "containers": [
          {
            "name": "[parameters('containerName')]",
            "properties": {
              "image": "[parameters('imageName')]",
              "ports": [
                {
                  "port": 3000,
                  "protocol": "TCP"
                }
              ],
              "environmentVariables": [
                {
                  "name": "NODE_ENV",
                  "value": "production"
                },
                {
                  "name": "PORT",
                  "value": "3000"
                }
              ],
              "resources": {
                "requests": {
                  "cpu": 1,
                  "memoryInGB": 2
                }
              },
              "livenessProbe": {
                "httpGet": {
                  "path": "/health",
                  "port": 3000
                },
                "initialDelaySeconds": 30,
                "periodSeconds": 10
              }
            }
          }
        ],
        "osType": "Linux",
        "ipAddress": {
          "type": "Public",
          "ports": [
            {
              "port": 3000,
              "protocol": "TCP"
            }
          ]
        },
        "restartPolicy": "Always"
      }
    }
  ]
}
```

## 🔄 CI/CD Pipelines

### GitHub Actions - AWS Deployment

```yaml
name: Deploy to AWS ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build, tag, and push image to Amazon ECR
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: healthcare-backend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

    - name: Update ECS service
      run: |
        aws ecs update-service \
          --cluster healthcare-cluster \
          --service healthcare-backend-service \
          --force-new-deployment
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  DOCKER_LATEST: $CI_REGISTRY_IMAGE:latest

build:
  stage: build
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker tag $DOCKER_IMAGE $DOCKER_LATEST
    - docker push $DOCKER_IMAGE
    - docker push $DOCKER_LATEST

test:
  stage: test
  script:
    - docker run --rm $DOCKER_IMAGE npm test

deploy:
  stage: deploy
  script:
    - kubectl set image deployment/healthcare-backend healthcare-api=$DOCKER_IMAGE
    - kubectl rollout status deployment/healthcare-backend
  only:
    - main
```

## 🔧 Infrastructure as Code

### Terraform - AWS Infrastructure

```hcl
# main.tf
provider "aws" {
  region = var.aws_region
}

# VPC and Networking
resource "aws_vpc" "healthcare_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "healthcare-vpc"
  }
}

resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.healthcare_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "healthcare-public-subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.healthcare_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "healthcare-public-subnet-2"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "healthcare_igw" {
  vpc_id = aws_vpc.healthcare_vpc.id

  tags = {
    Name = "healthcare-igw"
  }
}

# Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.healthcare_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.healthcare_igw.id
  }

  tags = {
    Name = "healthcare-public-rt"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "healthcare_cluster" {
  name = "healthcare-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "healthcare-cluster"
  }
}

# ECR Repository
resource "aws_ecr_repository" "healthcare_backend" {
  name = "healthcare-backend"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "healthcare-backend"
  }
}

# Application Load Balancer
resource "aws_lb" "healthcare_alb" {
  name               = "healthcare-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets           = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]

  enable_deletion_protection = false

  tags = {
    Name = "healthcare-alb"
  }
}

# Security Groups
resource "aws_security_group" "alb_sg" {
  name        = "healthcare-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.healthcare_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "healthcare-alb-sg"
  }
}

resource "aws_security_group" "ecs_sg" {
  name        = "healthcare-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.healthcare_vpc.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "healthcare-ecs-sg"
  }
}

# Target Group
resource "aws_lb_target_group" "healthcare_tg" {
  name        = "healthcare-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.healthcare_vpc.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = {
    Name = "healthcare-tg"
  }
}

# ALB Listener
resource "aws_lb_listener" "healthcare_listener" {
  load_balancer_arn = aws_lb.healthcare_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.healthcare_tg.arn
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "healthcare_task" {
  family                   = "healthcare-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "healthcare-api"
      image = "${aws_ecr_repository.healthcare_backend.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3000"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.supabase_db_url.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_secretsmanager_secret.jwt_secret.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.healthcare_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "healthcare-task"
  }
}

# ECS Service
resource "aws_ecs_service" "healthcare_service" {
  name            = "healthcare-backend-service"
  cluster         = aws_ecs_cluster.healthcare_cluster.id
  task_definition = aws_ecs_task_definition.healthcare_task.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.healthcare_tg.arn
    container_name   = "healthcare-api"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.healthcare_listener]

  tags = {
    Name = "healthcare-service"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "healthcare_logs" {
  name              = "/ecs/healthcare-backend"
  retention_in_days = 30

  tags = {
    Name = "healthcare-logs"
  }
}

# Secrets Manager
resource "aws_secretsmanager_secret" "supabase_db_url" {
  name = "healthcare/supabase-db-url"
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "healthcare/jwt-secret"
}
```

## 🚀 Deployment Scripts

### Build and Deploy Script

```bash
#!/bin/bash
# deploy.sh

set -e

# Configuration
PROJECT_NAME="healthcare-backend"
AWS_REGION="us-east-1"
ECR_REPOSITORY="healthcare-backend"
ECS_CLUSTER="healthcare-cluster"
ECS_SERVICE="healthcare-backend-service"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏥 Healthcare Backend Deployment Script${NC}"
echo "================================================"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure'${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t $PROJECT_NAME:latest .

echo -e "${YELLOW}🔑 Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo -e "${YELLOW}🏷️  Tagging image...${NC}"
docker tag $PROJECT_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
docker tag $PROJECT_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$(git rev-parse --short HEAD)

echo -e "${YELLOW}📤 Pushing to ECR...${NC}"
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$(git rev-parse --short HEAD)

echo -e "${YELLOW}🔄 Updating ECS service...${NC}"
aws ecs update-service \
    --cluster $ECS_CLUSTER \
    --service $ECS_SERVICE \
    --force-new-deployment \
    --region $AWS_REGION

echo -e "${YELLOW}⏳ Waiting for deployment to complete...${NC}"
aws ecs wait services-stable \
    --cluster $ECS_CLUSTER \
    --services $ECS_SERVICE \
    --region $AWS_REGION

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your API is now running on: https://your-domain.com${NC}"
```

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

ENDPOINT="https://your-api-domain.com/health"
MAX_RETRIES=5
RETRY_DELAY=10

echo "🏥 Healthcare Backend Health Check"
echo "=================================="

for i in $(seq 1 $MAX_RETRIES); do
    echo "Attempt $i/$MAX_RETRIES..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT)
    
    if [ $response -eq 200 ]; then
        echo "✅ Health check passed!"
        curl -s $ENDPOINT | jq .
        exit 0
    else
        echo "❌ Health check failed with status code: $response"
        if [ $i -lt $MAX_RETRIES ]; then
            echo "Retrying in $RETRY_DELAY seconds..."
            sleep $RETRY_DELAY
        fi
    fi
done

echo "❌ Health check failed after $MAX_RETRIES attempts"
exit 1
```

## 📊 Monitoring and Logging

### CloudWatch Dashboard

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "healthcare-backend-service"],
          [".", "MemoryUtilization", ".", "."]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "us-east-1",
        "title": "ECS Service Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "healthcare-alb"],
          [".", "ResponseTime", ".", "."],
          [".", "HTTPCode_Target_2XX_Count", ".", "."],
          [".", "HTTPCode_Target_5XX_Count", ".", "."]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "us-east-1",
        "title": "Load Balancer Metrics"
      }
    }
  ]
}
```

## 🔐 Security Best Practices

### Production Security Checklist

- [ ] Enable AWS GuardDuty for threat detection
- [ ] Configure AWS WAF for web application protection
- [ ] Set up VPC Flow Logs for network monitoring
- [ ] Enable CloudTrail for API logging
- [ ] Configure AWS Config for compliance monitoring
- [ ] Set up AWS Secrets Manager rotation
- [ ] Enable container image scanning in ECR
- [ ] Configure security groups with least privilege
- [ ] Set up SSL/TLS certificates with ACM
- [ ] Enable ECS service auto-scaling
- [ ] Configure backup strategies for critical data
- [ ] Set up disaster recovery procedures

This comprehensive deployment guide provides production-ready infrastructure for your healthcare backend with robust security, monitoring, and scalability features.