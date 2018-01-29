from django.views import generic
from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from django.core import serializers
# from django.core.mail import EmailMultiAlternatives

from ipware import get_client_ip

from appointments.models import Appointment, Package, Availability, AvailabilityCheck

from .forms import AppointmentForm

class AppointmentView(generic.CreateView):
  form_class = AppointmentForm
  template_name = 'appointments/index.html'

  def get_context_data(self, **kwargs):
    context = super().get_context_data(**kwargs)
    context['package_list'] = Package.objects.all()
    return context

  def package_availabilities(request):
    package_id = request.GET.get('package_id')
    package = None
    try:
      package = Package.objects.get(id=package_id)
      availabilities = Availability.objects.filter(minutes_remaining__gte=package.minutes).order_by('date')
      serialized_data = serializers.serialize('json', availabilities)
      return HttpResponse(serialized_data, status=200)
    except ObjectDoesNotExist:
      return HttpResponse(status=404)

  def availability_check(request):
    client_ip, _ = get_client_ip(request)
    if client_ip is not None:
      print(client_ip)
      package_id = request.POST.get('package_id')
      package = Package.objects.get(id=package_id)
      availability_check = AvailabilityCheck(ip_address=client_ip, package=package)
      availability_check.save()
      return HttpResponse(status=201)
    return HttpResponse(status=400)

  def post(self, request, *args, **kwargs):
    form = AppointmentForm(request.POST)
    if form.is_valid():
      form.save()

      # subject, from_email, to = 'hello', 'appointments@buttery.com', 'rmelend1@kent.edu'
      # text_content = 'This is an important message.'
      # html_content = '<p>This is an <strong>important</strong> message.</p>'
      # msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
      # msg.attach_alternative(html_content, "text/html")
      # msg.send()

      # Get selected availability
      availability_id = request.POST.get('availability')
      availability_selected = Availability.objects.get(id=availability_id)

      # Get selected package
      package_id = request.POST.get('package')
      package_selected = Package.objects.get(id=package_id)

      # Reduce miutes remaining on availability
      availability_selected.minutes_remaining -= package_selected.minutes
      availability_selected.save()
      return HttpResponse(status=201)

    return HttpResponse(form.errors.as_json(), status=400)