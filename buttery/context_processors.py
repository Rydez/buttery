from django.http import HttpResponse

from appointments.models import Visit

from ipware import get_client_ip

def visit(request):
  client_ip, _ = get_client_ip(request)
  if client_ip is not None:
    path = request.get_full_path()
    if 'admin' not in path:
      visit = Visit(ip_address=client_ip, path_name=path)
      visit.save()
  return {}