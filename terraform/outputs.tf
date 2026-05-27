output "alb_dns"            { value = module.alb.dns_name }
output "frontend_ecr_url"   { value = module.ecr.frontend_url }
output "backend_ecr_url"    { value = module.ecr.backend_url }
output "rds_endpoint"       { value = module.rds.endpoint }
output "redis_endpoint"     { value = module.elasticache.endpoint }
