# FeedbackHQ — Three-Tier DevOps Portfolio Project

A cloud-native customer feedback and review platform deployed on AWS using ECS Fargate, showcasing a complete three-tier architecture with full DevOps automation.

## Architecture Overview

```
                        ┌─────────────────────────────────────┐
                        │           AWS Cloud (us-east-1)      │
                        │                                       │
  Users ──► CloudFront ─┤─► ALB ──► ECS Fargate (Frontend)    │
                        │            │                          │
                        │            ▼                          │
                        │          ALB ──► ECS Fargate (API)   │
                        │            │                          │
                        │     ┌──────┴──────┐                  │
                        │     ▼             ▼                   │
                        │   RDS          ElastiCache            │
                        │ (MySQL)         (Redis)               │
                        └─────────────────────────────────────-┘
```

## Tech Stack

| Tier | Technology |
|------|-----------|
| Frontend | React 18 + Vite, Nginx |
| Backend | Node.js + Express, JWT auth |
| Database | Amazon RDS (MySQL 8) |
| Cache | ElastiCache (Redis) |
| Containers | Docker + Amazon ECR |
| Orchestration | Amazon ECS Fargate |
| Networking | VPC, ALB, Security Groups |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Monitoring | CloudWatch + AWS X-Ray |
| Secrets | AWS Secrets Manager |

## Project Structure

```
feedbackhq/
├── frontend/               # React SPA (Tier 1)
│   ├── src/
│   │   ├── api/            # Axios API calls
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth context
│   │   └── pages/          # Page components
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                # Node.js REST API (Tier 2)
│   ├── src/
│   │   ├── config/         # DB and Redis config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, error handling
│   │   ├── models/         # Sequelize models
│   │   └── routes/         # Express routes
│   └── Dockerfile
├── terraform/              # Infrastructure as Code (Tier 3 + infra)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── modules/
│       ├── vpc/
│       ├── ecr/
│       ├── ecs/
│       ├── rds/
│       ├── elasticache/
│       ├── alb/
│       └── iam/
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD pipeline
├── docker-compose.yml      # Local development
└── README.md
```

## Prerequisites

- AWS Account with CLI configured (`aws configure`)
- Terraform >= 1.6
- Docker + Docker Compose
- Node.js >= 18

## Quick Start (Local Dev)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/feedbackhq.git
cd feedbackhq

# Start all services locally
docker-compose up --build

# App running at:
# Frontend: http://localhost:3000
# API:      http://localhost:5000
# MySQL:    localhost:3306
# Redis:    localhost:6379
```

## Deploy to AWS

```bash
# 1. Bootstrap Terraform state bucket
aws s3 mb s3://feedbackhq-terraform-state --region us-east-1

# 2. Initialize and apply Terraform
cd terraform
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"

# 3. Push to main branch — GitHub Actions handles the rest
git push origin main
```

## CI/CD Pipeline

Every push to `main` triggers:

1. **Test** — Jest unit tests + ESLint
2. **Build** — Docker images for frontend and backend
3. **Scan** — Trivy vulnerability scan on images
4. **Push** — Images pushed to Amazon ECR
5. **Deploy** — ECS service updated via `aws ecs update-service`
6. **Verify** — Health check on ALB endpoint

## Environment Variables

Set these in AWS Secrets Manager under `/feedbackhq/prod/`:

```
DB_HOST        # RDS endpoint
DB_NAME        # feedbackhq
DB_USER        # feedbackhq_user
DB_PASSWORD    # (strong password)
REDIS_HOST     # ElastiCache endpoint
JWT_SECRET     # (random 64-char string)
```

## Monitoring

- **CloudWatch Dashboards** — ECS CPU/memory, ALB request count, RDS connections
- **CloudWatch Alarms** — High CPU (>80%), error rate (>5%), RDS storage (<20%)
- **AWS X-Ray** — Distributed tracing on API requests
- **CloudWatch Logs** — Centralized logs from all ECS tasks

## Demo Credentials

After deployment, seed data is auto-loaded:

```
Admin:  admin@feedbackhq.com  / Admin@123
User:   john@example.com      / User@123
```

## Cost Estimate (AWS)

| Service | Estimated Monthly Cost |
|---------|----------------------|
| ECS Fargate (2 tasks) | ~$15 |
| RDS MySQL (db.t3.micro) | ~$15 |
| ElastiCache (cache.t3.micro) | ~$12 |
| ALB | ~$18 |
| ECR | ~$1 |
| **Total** | **~$61/month** |

> Tip: Run `terraform destroy` when not showcasing to avoid charges.
