import multiprocessing

bind = "unix:/home/ubuntu/sky-sense/skysense.sock"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 5
user = "ubuntu"
group = "ubuntu"
tmp_upload_dir = None
errorlog = "/home/ubuntu/sky-sense/logs/gunicorn_error.log"
accesslog = "/home/ubuntu/sky-sense/logs/gunicorn_access.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
preload_app = True
daemon = False