resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-${var.environment}-db-subnet"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "rds" {
  name   = "${var.project}-rds-sg"
  vpc_id = var.vpc_id
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [var.allowed_sg_id]
  }
  egress { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

resource "random_password" "db" { length = 24; special = false }

resource "aws_secretsmanager_secret" "db" {
  name = "/${var.project}/${var.environment}/db-password"
}

resource "random_password" "jwt" { length = 64; special = false }

resource "aws_secretsmanager_secret_version" "db" {
  secret_id     = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username   = var.db_username
    password   = random_password.db.result
    jwt_secret = random_password.jwt.result
  })
}

resource "aws_db_instance" "main" {
  identifier             = "${var.project}-${var.environment}"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = var.db_name
  username               = var.db_username
  password               = random_password.db.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.project}-final-snapshot"
  backup_retention_period = 7
  deletion_protection    = true
  storage_encrypted      = true
  tags = { Name = "${var.project}-rds" }
}
