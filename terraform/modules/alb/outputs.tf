output "dns_name"                  { value = aws_lb.main.dns_name }
output "alb_sg_id"                 { value = aws_security_group.alb.id }
output "frontend_target_group_arn" { value = aws_lb_target_group.frontend.arn }
output "backend_target_group_arn"  { value = aws_lb_target_group.backend.arn }
