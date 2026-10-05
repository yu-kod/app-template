# このアプリの設定（秘密情報は書かない）。
#
# カスタムドメインで公開するときは両方を指定する。yu-kod のアプリは
# yu-web.site のホストゾーン（Route 53）にサブドメインをぶら下げている。
#   domain_name      = "<app>.yu-web.site"
#   hosted_zone_name = "yu-web.site"
# 空のままなら CloudFront の既定ドメイン（xxxx.cloudfront.net）で公開する。
domain_name      = ""
hosted_zone_name = ""
