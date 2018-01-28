from django.views import generic
from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from django.core import serializers

from appointments.models import Appointment, Package, Availability

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


  def post(self, request, *args, **kwargs):
    form = AppointmentForm(request.POST)
    if form.is_valid():
      form.save()
      return HttpResponse(status=201)
    return HttpResponse(form.errors.as_json(), status=400)