from django.views import generic
from django.http import HttpResponse

from appointments.models import Appointment

from .forms import AppointmentForm

class AppointmentView(generic.CreateView):
  form_class = AppointmentForm
  template_name = 'appointments/index.html'

  def post(self, request, *args, **kwargs):
    form = AppointmentForm(request.POST)
    if form.is_valid():
      form.save()
      return HttpResponse(status=201)
    return HttpResponse(form.errors.as_json(), status=400)

