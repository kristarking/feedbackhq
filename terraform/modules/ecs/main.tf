resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.environment}"
  setting { name = "containerInsights"; value = "enabled" }
}

resource "aws_security_group" "ecs_tasks" {
  name   = "${var.project}-ecs-tasks-sg"
  vpc_id = var.vpc_id
  ingress { from_port = 0; to_port = 0; protocol = "-1"; security_groups = [var.alb_sg_id] }
  egress  { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.project}/frontend"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project}/backend"
  retention_in_days = 30
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.project}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([{
    name      = "frontend"
    image     = var.frontend_image
    essential = true
    portMappings = [{ containerPort = 80, protocol = "tcp" }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = var.backend_image
    essential = true
    portMappings = [{ containerPort = 5000, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV",    value = "production" },
      { name = "PORT",        value = "5000" },
      { name = "DB_HOST",     value = var.db_host },
      { name = "DB_NAME",     value = "feedbackhq" },
      { name = "REDIS_HOST",  value = var.redis_host },
      { name = "REDIS_PORT",  value = "6379" }
    ]
    secrets = [
  { name = "DB_USER",     valueFrom = "${var.secrets_arn}:username::" },
  { name = "DB_PASSWORD", valueFrom = "${var.secrets_arn}:password::" },
  { name = "JWT_SECRET",  valueFrom = "${var.secrets_arn}:jwt_secret::" }
]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend.name
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "frontend" {
  name            = "${var.project}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  # Rolling deployment keeps 100% capacity running during updates (zero downtime)
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  load_balancer {
    target_group_arn = var.frontend_target_arn
    container_name   = "frontend"
    container_port   = 80
  }

  deployment_circuit_breaker { enable = true; rollback = true }
  lifecycle { ignore_changes = [task_definition] }
}

resource "aws_ecs_service" "backend" {
  name            = "${var.project}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  # Rolling deployment keeps 100% capacity running during updates (zero downtime)
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  load_balancer {
    target_group_arn = var.backend_target_arn
    container_name   = "backend"
    container_port   = 5000
  }

  deployment_circuit_breaker { enable = true; rollback = true }
  lifecycle { ignore_changes = [task_definition] }
}

# Auto-scaling
resource "aws_appautoscaling_target" "backend" {
  max_capacity       = 6
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${var.project}-backend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification { predefined_metric_type = "ECSServiceAverageCPUUtilization" }
    target_value = 70.0
  }
}
