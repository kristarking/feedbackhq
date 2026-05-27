output "endpoint"    { value = aws_db_instance.main.address }
output "secrets_arn" { value = aws_secretsmanager_secret.db.arn }
