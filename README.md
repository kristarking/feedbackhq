# FeedbackHQ
<img width="1702" height="903" alt="h1" src="https://github.com/user-attachments/assets/fab689f5-3eae-44c3-a7e6-9478a6ce2c8c" />

<img width="1696" height="898" alt="h2" src="https://github.com/user-attachments/assets/812c116f-5777-4be5-abf0-89f9ff68d174" />

A production-grade, full-stack customer feedback and review platform deployed on AWS using modern DevOps practices. Built to demonstrate end-to-end cloud engineering: infrastructure as code, containerised workloads, zero-downtime CI/CD, secrets management, and observability.

**Live URL:** https://app.heros.com.ng
<img width="1702" height="895" alt="h3" src="https://github.com/user-attachments/assets/d86ca1f0-5f06-4d9a-aef3-4a80cf036623" />

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Zero Downtime Deployments](#zero-downtime-deployments)
6. [Infrastructure](#infrastructure)
7. [Security Design](#security-design)
8. [Observability](#observability)
9. [Repository Structure](#repository-structure)
10. [Local Development](#local-development)
11. [Rebuilding the Infrastructure](#rebuilding-the-infrastructure)
12. [Key Engineering Decisions](#key-engineering-decisions)

---

## Project Overview

FeedbackHQ is a three-tier web application that allows users to browse software products, read customer reviews, and submit their own feedback. It includes role-based access control with standard user and admin roles.

The application itself is intentionally straightforward. The engineering focus of this project is the infrastructure and deployment pipeline: how the application is containerised, provisioned, secured, deployed, and monitored on AWS in a way that mirrors production patterns used at scale.

### What the Application Does

Users can register and log in to the platform. They can browse a catalogue of software products and read reviews left by other users. Authenticated users can submit their own reviews with star ratings. Admin users have access to a moderation panel where they can manage products and remove inappropriate content.

<img width="1702" height="903" alt="h1" src="https://github.com/user-attachments/assets/633baf9d-9f0a-4456-b0fa-75802cd69f30" />
---

## Architecture

The architecture follows a standard three-tier pattern with strict network isolation. No application resource is directly reachable from the internet. All traffic enters through the Application Load Balancer, which routes requests to the appropriate container service inside a private VPC.

### Architecture Diagram

<img width="1536" height="1024" alt="archi for review hq" src="https://github.com/user-attachments/assets/e6ef96b9-7e1c-4149-98b9-d24ef72df219" />

### Traffic Flow

All inbound traffic arrives at Cloudflare, which proxies it to the AWS Application Load Balancer over HTTPS. The ALB terminates SSL using an ACM certificate and applies routing rules: requests matching `/api/*` are forwarded to the backend ECS service on port 5000, and all other requests go to the frontend ECS service on port 80. Neither the frontend nor the backend containers have public IP addresses. They live in private subnets and can only be reached through the ALB.

The backend communicates with MySQL on Amazon RDS and Redis on ElastiCache, both of which also live in private subnets. Security groups restrict database access to traffic originating from the ECS tasks security group only. No database or cache resource is accessible from outside the VPC.

Outbound internet access for the private containers (needed to pull ECR images and send CloudWatch logs) is handled by a NAT Gateway sitting in the public subnet.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18, Vite, Nginx | Multi-stage Docker build, served as static files |
| Backend | Node.js, Express, Sequelize | JWT authentication, rate limiting, X-Ray tracing |
| Database | MySQL 8 on Amazon RDS | Multi-AZ with automated failover |
| Cache | Redis 7 on ElastiCache | Session caching, connection pooling |
| Containers | Amazon ECS Fargate | Serverless, no EC2 node management |
| Container Registry | Amazon ECR | Images tagged by git commit SHA |
| Load Balancer | AWS Application Load Balancer | HTTPS termination, path-based routing |
| Infrastructure | Terraform 1.6 with modules | Modular design, remote state in S3 |
| CI/CD | GitHub Actions | 4-stage pipeline on every push to main |
| Secrets | AWS Secrets Manager | DB password and JWT secret auto-generated |
| DNS and Proxy | Cloudflare | Proxied CNAME to ALB, Full SSL mode |
| SSL Certificate | AWS ACM | Issued for app.heros.com.ng, DNS validated |
| Monitoring | CloudWatch Container Insights | Metrics, logs, and alarms |

### Comparison to Azure

This project was built with deliberate awareness of Azure equivalents, since the same patterns exist on both clouds.

| AWS | Azure Equivalent |
|---|---|
| ECS Fargate | Azure Container Instances / ACI |
| ECR | Azure Container Registry |
| ALB | Azure Application Gateway |
| RDS | Azure Database for MySQL |
| ElastiCache | Azure Cache for Redis |
| Secrets Manager | Azure Key Vault |
| CloudWatch | Azure Monitor |
| VPC with public and private subnets | Azure VNet with subnet tiers |
| IAM roles and policies | Azure Entra ID, RBAC, Managed Identities |
| ACM | Azure App Service Certificates |

---

## CI/CD Pipeline

Every push to the `main` branch triggers a four-stage automated pipeline. No manual steps are required to deploy a code change to production.

### Screenshot: GitHub Actions Pipeline

<img width="1687" height="799" alt="h14 zero cicd" src="https://github.com/user-attachments/assets/6c420f1c-1ae7-4fbe-936b-5cb4ffc5ff86" />

### Stage 1: Test

The test runner spins up real MySQL 8 and Redis 7 service containers alongside the GitHub Actions runner. The backend dependencies are installed with `npm ci` using the committed `package-lock.json` for deterministic installs. Jest runs with `--forceExit` to prevent the runner hanging on open database connections. The health endpoint is tested against a live Express server connected to the real test database.

This approach means the test suite validates actual database connectivity, not mocked interfaces.

### Stage 2: Build and Push to ECR

If tests pass and the push is to `main`, Docker builds both the frontend and backend images using the `production` stage of their respective multi-stage Dockerfiles. Each image is tagged with two tags: the full git commit SHA for immutability and traceability, and `latest` for convenience. Both tags are pushed to ECR. The commit SHA tag is passed as an output to the deploy stage.

### Stage 3: Security Scan

Trivy scans both images for HIGH and CRITICAL CVEs immediately after they are pushed to ECR. The scan result is reported in the pipeline summary. The exit code is set to `0` so a vulnerability finding blocks visibility but not the deployment, which is appropriate for a portfolio context. In a production setting, exit code would be `1` to gate deployments on clean scans.

### Stage 4: Deploy to ECS

The deploy stage downloads the current ECS task definition for each service, injects the new image URI (using the commit SHA tag from Stage 2), registers the updated task definition, and triggers a rolling service update. The pipeline waits for service stability before completing. If the deployment fails health checks, ECS automatically rolls back to the previous task definition revision.

### Screenshot: Successful Pipeline Run

<img width="1860" height="882" alt="h23 cicd" src="https://github.com/user-attachments/assets/8dc66504-8ed3-4223-97ea-9aea718290d1" />

---

## Zero Downtime Deployments

The ECS services are configured to guarantee no user-facing downtime during any deployment.

### How It Works

The two key configuration values on each ECS service are `deployment_minimum_healthy_percent = 100` and `deployment_maximum_percent = 200`. These tell ECS that it must never drop below 100% of the desired task count, and may temporarily run up to 200% during a deployment.

In practice this means: when a new deployment is triggered, ECS starts 2 new tasks running the new image while the 2 old tasks continue serving production traffic. The ALB runs health checks against the new tasks. Once the new tasks pass health checks and are registered as healthy in the target group, the ALB begins draining traffic from the old tasks and eventually deregisters them. The old tasks are then stopped. Users experience no interruption.

The `deployment_circuit_breaker` is enabled with `rollback = true`. If the new tasks fail to start or fail health checks within the deployment window, ECS automatically registers a rollback and redeploys the last stable task definition revision. No manual intervention is required.

The `lifecycle { ignore_changes = [task_definition] }` setting on the ECS service prevents Terraform from interfering with the task definition after initial provisioning. Task definition updates are handled exclusively by the GitHub Actions pipeline, which is the correct separation of concerns.

### Screenshot: ECS Deployment in Progress
<img width="1702" height="907" alt="h18 web edit" src="https://github.com/user-attachments/assets/107c1a2f-e986-4d74-abf3-092b3daa987b" />

<img width="1690" height="891" alt="h20 web edit n git push" src="https://github.com/user-attachments/assets/7e769b11-af5d-4e08-a64d-d197b8cad892" />

<img width="1693" height="789" alt="h21 cicd loading edit" src="https://github.com/user-attachments/assets/d31b032a-5e34-43f7-9eda-171e2262797d" />

<img width="1689" height="880" alt="h22 edit showed" src="https://github.com/user-attachments/assets/8cc49ad3-26b8-489e-abd8-13fe4e0157a6" />

---

## Infrastructure

All infrastructure is defined in Terraform using a modular pattern. There are seven modules, each responsible for a specific layer of the stack.

<img width="1686" height="790" alt="h11 ecs" src="https://github.com/user-attachments/assets/dca55da5-2a91-42df-825a-7e979755e188" />


### Terraform Module Structure

Each module follows the standard three-file pattern: `main.tf` defines resources, `variables.tf` declares inputs, and `outputs.tf` exposes values to other modules. The root `main.tf` wires the modules together by passing outputs from one as inputs to another.

For example, the RDS module needs to know which security group the ECS tasks use so it can allow only that group through its firewall on port 3306. It receives this as `allowed_sg_id = module.ecs.ecs_tasks_sg_id`. The ECS module needs the RDS endpoint and the Secrets Manager ARN. The ALB module needs the VPC and public subnet IDs from the VPC module. This chain of dependencies means Terraform understands the correct provisioning order automatically.

### VPC Design

The VPC spans two availability zones in us-east-1 with a CIDR of 10.0.0.0/16. Public subnets (10.0.0.0/24 and 10.0.1.0/24) host the ALB and NAT Gateway. Private subnets (10.0.10.0/24 and 10.0.11.0/24) host ECS tasks, RDS, and ElastiCache. The route tables are configured such that the public subnets route outbound traffic to the Internet Gateway, and the private subnets route outbound traffic to the NAT Gateway.

### RDS Configuration

The MySQL instance runs on `db.t3.micro` with Multi-AZ enabled. Multi-AZ means AWS maintains a synchronous standby replica in the second availability zone. If the primary instance fails, RDS promotes the standby automatically with no data loss and typically under two minutes of downtime. Automated backups are retained for 7 days. Storage is encrypted at rest. Deletion protection is enabled so the database cannot be accidentally destroyed through the AWS console or CLI.

### Auto Scaling

The backend ECS service is configured with Application Auto Scaling. The minimum task count is 2 (for high availability across AZs) and the maximum is 6. A target tracking policy scales out when average CPU utilisation across the service exceeds 70% and scales in when it drops below the threshold with a 5-minute cooldown to prevent flapping.

<img width="1683" height="793" alt="h5 db" src="https://github.com/user-attachments/assets/534a1e57-302e-4682-a957-e536f302be42" />

<img width="1687" height="793" alt="h7 lb 2" src="https://github.com/user-attachments/assets/d83da7b0-a1f9-4d94-b295-03f8ee009ee1" />

---

## Security Design

### Network Security

The ALB is the only resource with a public IP address. Its security group allows inbound TCP on ports 80 and 443 from 0.0.0.0/0. The ECS tasks security group allows inbound traffic only from the ALB security group, with no port restriction (since the ALB knows which ports to target). RDS and ElastiCache security groups allow inbound traffic only from the ECS tasks security group on their respective ports.

No resource in a private subnet has a public IP address. Even if an attacker obtained the internal IP of an ECS task, RDS instance, or Redis node, they could not reach it from outside the VPC.

### Secrets Management

The database password and JWT secret are never stored in source code, environment files, or CI/CD configuration. Terraform generates both using the `random_password` resource and stores them in a single AWS Secrets Manager secret at `/feedbackhq/prod/db-password`. The ECS task definition references the secret by ARN using the `secrets` field, which instructs ECS to fetch the values at container startup and inject them as environment variables. The values never appear in CloudWatch logs, Terraform state output, or the GitHub Actions run summary.

The ECS execution role has a least-privilege IAM policy granting `secretsmanager:GetSecretValue` access to the specific secret ARN only, plus `kms:Decrypt` for encrypted secrets.

The GitHub Actions IAM user (`feedbackhq-github-actions`) has a scoped inline policy granting only the permissions needed to push images to ECR, register ECS task definitions, and update ECS services. It has no access to RDS, Secrets Manager, VPC, or any other resource.

### CORS

The backend Express server restricts CORS to `https://app.heros.com.ng` in production. The `CORS_ORIGIN` environment variable is set in the ECS task definition. Wildcard CORS is disabled in production.

### SSL

Cloudflare sits in front of the ALB with Full SSL mode enabled. Traffic from users to Cloudflare is encrypted. Traffic from Cloudflare to the ALB is also encrypted using the ACM certificate. The HTTP listener on the ALB returns a 301 redirect to HTTPS so plain HTTP traffic is never served.

---

## Observability

### CloudWatch Container Insights

Container Insights is enabled on the ECS cluster, providing CPU utilisation, memory utilisation, network I/O, and storage metrics at the cluster, service, task, and container levels. The metrics are visible in the CloudWatch console under the Container Insights performance dashboard.

### Application Logs

Both services write structured logs to CloudWatch Log Groups using the `awslogs` log driver. The backend uses Winston for structured JSON logging, capturing HTTP requests via Morgan, database events, authentication events, and errors. Log groups retain entries for 30 days.

<img width="1696" height="795" alt="h10a best cloudwatch" src="https://github.com/user-attachments/assets/2287d4f1-c024-41e0-afdf-192768b133a9" />


### Auto Scaling Alarm

Terraform provisions a scale-in alarm through the Application Auto Scaling target tracking policy. The alarm fires when CPU drops below the scale-in threshold. In a low-traffic environment running at minimum task count, this alarm will be in ALARM state because the service is already at minimum capacity and cannot scale in further. This is expected behaviour and does not indicate a problem.

<img width="1686" height="790" alt="h11 ecs" src="https://github.com/user-attachments/assets/f546a67a-1959-4df5-af21-63c3a95f1c41" />

---

## Repository Structure

```
feedbackhq/
  .github/
    workflows/
      deploy.yml          4-stage CI/CD pipeline
  backend/
    src/
      __tests__/
        health.test.js    Jest test for health endpoint
      config/
        database.js       Sequelize MySQL connection
        redis.js          ioredis connection
        logger.js         Winston structured logging
        seed.js           Database seed data
      controllers/        Route handler logic
      middleware/
        auth.js           JWT verification middleware
      models/             Sequelize models (User, Product, Review)
      routes/             Express route definitions
      index.js            Express app entry point
    Dockerfile            Multi-stage build (development, build, production)
    package.json
    package-lock.json
  frontend/
    src/
      api/                Axios HTTP client configuration
      components/         Reusable React components
      context/
        AuthContext.jsx   JWT auth state management
      pages/              Route-level page components
      App.jsx
      main.jsx
    nginx.conf            Production Nginx config with health endpoint
    Dockerfile            Multi-stage build (development, build, production)
    vite.config.js
  terraform/
    main.tf               Root module wiring all child modules together
    variables.tf          Input variable declarations
    outputs.tf            Stack outputs (ALB DNS, ECR URLs, RDS endpoint)
    terraform.tfvars.example
    modules/
      vpc/                VPC, subnets, IGW, NAT Gateway, route tables
      alb/                ALB, security group, target groups, listeners
      ecs/                ECS cluster, task definitions, services, autoscaling
      rds/                RDS MySQL, subnet group, security group, Secrets Manager
      elasticache/        ElastiCache Redis, subnet group, security group
      iam/                ECS execution role, task role, IAM policies
      ecr/                ECR repositories and lifecycle policies
  docker-compose.yml      Local development environment
  README.md
```

---

## Local Development

The full stack runs locally using Docker Compose. MySQL and Redis are included as service containers with health checks, so the backend waits for the database to be ready before starting.

### Prerequisites

Docker Desktop must be running.

### Start the Stack

```bash
git clone https://github.com/kristarking/feedbackhq.git
cd feedbackhq
docker compose up --build
```

### Access the Application

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/health |

### Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@feedbackhq.com | Admin@123 |
| User | john@example.com | User@123 |

### Run Backend Tests

```bash
cd backend
npm test
```

The test suite requires MySQL and Redis to be running (either via Docker Compose or as local services). Tests use the `--forceExit` flag to prevent Jest hanging on open database connections.

---

### Tear Down

Before running destroy, deletion protection on RDS must be disabled:

```bash
cd terraform
# Edit modules/rds/main.tf and set deletion_protection = false
terraform apply -var-file="terraform.tfvars" -auto-approve
terraform destroy -var-file="terraform.tfvars" -auto-approve
```
<img width="1705" height="909" alt="h17 might not use" src="https://github.com/user-attachments/assets/dc070c9e-d997-41ff-b120-eaad859c227c" />

After apply completes, update the `VITE_API_URL` and `ALB_DNS` GitHub Actions secrets with the new ALB DNS name from the Terraform output. Then push any commit to `main` to trigger the pipeline and deploy the application containers.

### What Persists After Tear Down

The S3 state bucket, ACM certificate, ECR images, GitHub repository, and Cloudflare DNS configuration all survive a `terraform destroy` and do not need to be recreated.

---

## Key Engineering Decisions

### Why ECS Fargate Instead of EKS

ECS Fargate is serverless at the container level. There are no EC2 nodes to patch, resize, or manage. The workload is predictable and stateless, which is exactly the profile Fargate is optimised for. EKS adds significant operational overhead (control plane, node groups, cluster autoscaler, CNI plugins) that is not justified unless the workload requires advanced scheduling, custom operators, or the team already has deep Kubernetes expertise. Fargate delivers the same container isolation, auto-scaling, and IAM integration at lower cost and complexity for this use case.

### Why Modular Terraform Instead of a Flat Configuration

A flat Terraform configuration mixes all resources into a single file, making it difficult to understand boundaries, test changes in isolation, or reuse patterns across environments. Modules enforce separation of concerns. Each module has a defined interface (inputs via variables, outputs via outputs.tf) and owns a specific layer of the stack. The root module only orchestrates: it calls modules and wires their outputs together. This is the same pattern used in enterprise Terraform codebases and maps directly to the Bicep module pattern in Azure.

### Why Secrets Manager Instead of ECS Environment Variables

Environment variables set directly in an ECS task definition are stored in plaintext in the task definition JSON, which is readable by anyone with `ecs:DescribeTaskDefinition` permission. Secrets Manager stores values encrypted at rest using AWS KMS. The ECS agent fetches the values at container startup over an authenticated API call and injects them into the container environment. The values never appear in the task definition, CloudWatch logs, or Terraform state outputs. This is the correct production pattern regardless of the sensitivity of the data.

### Why Cloudflare in Front of the ALB

The previous project (heros.com.ng, deployed on AKS) encountered ISP-level blocking of Azure IP ranges by Nigerian ISPs. Cloudflare solved this by acting as an intermediary: users connect to Cloudflare's global edge network, which is not blocked, and Cloudflare proxies the request to the origin. The same pattern is applied here as a deliberate architectural choice, not a workaround. Cloudflare also provides DDoS protection, global CDN caching for static assets, and free SSL termination at the edge.<img width="1702" height="903" alt="h1" src="https://github.com/user-attachments/assets/06afe0a5-c26a-4363-aed8-68914eff4071" />
