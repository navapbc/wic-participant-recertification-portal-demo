############################################################################################
## A module for setting up SES
## - Creates a verified domain and 0+ verified email accounts
## - Configures DKIM and SPF
## Note: This module assumes that the Route53 hosted zone has been created in the AWS Console
############################################################################################

data "aws_route53_zone" "domain" {
  name         = var.hosted_zone_domain
  private_zone = false
}

resource "aws_ses_domain_identity" "verified_domain" {
  domain = var.domain
}

resource "aws_ses_email_identity" "verified_emails" {
  for_each = toset(var.verified_emails)
  email    = each.value
}

resource "aws_ses_domain_mail_from" "mail_from" {
  domain           = aws_ses_domain_identity.verified_domain.domain
  mail_from_domain = "mail.${var.domain}"
}

resource "aws_ses_domain_dkim" "ses_domain_dkim" {
  domain = join("", aws_ses_domain_identity.verified_domain.*.domain)
}

resource "aws_route53_record" "amazonses_dkim_record" {
  count   = 3
  zone_id = data.aws_route53_zone.domain.zone_id
  name    = "${element(aws_ses_domain_dkim.ses_domain_dkim.dkim_tokens, count.index)}._domainkey.${var.domain}"
  type    = "CNAME"
  ttl     = "1800"
  records = ["${element(aws_ses_domain_dkim.ses_domain_dkim.dkim_tokens, count.index)}.dkim.amazonses.com"]
}

resource "aws_route53_record" "spf_mail_from" {
  zone_id = data.aws_route53_zone.domain.zone_id
  name    = aws_ses_domain_mail_from.mail_from.mail_from_domain
  type    = "TXT"
  ttl     = "300"
  records = ["v=spf1 include:amazonses.com ~all"]
}
