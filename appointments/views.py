import datetime

from django.views import generic
from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from django.core import serializers
# from django.core.mail import EmailMultiAlternatives

from ipware import get_client_ip

from appointments.models import Appointment, Package, Availability, AvailabilityCheck, Visit

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
      availabilities = None

      # Check if this is a two day job
      if (package.minutes > 480):
        first_day = None
        available_ids = []
        availabilities = Availability.objects.all().order_by('date')
        for availability in availabilities:

          # Get a full first day
          if not first_day and availability.minutes_remaining == 480:
            first_day = availability
          # Get a second full day
          elif first_day:
            date_format = '%Y-%m-%d'
            first_day_date = datetime.datetime.strptime(str(first_day.date.date()), date_format)
            availability_date = datetime.datetime.strptime(str(availability.date.date()), date_format)
            date_detla = availability_date - first_day_date
            if date_detla.days == 1 and availability.minutes_remaining == 480:
              available_ids.append(first_day.id)
            elif availability.minutes_remaining == 480:
              first_day = availability
            else:
              # Start over
              first_day = None

        availabilities = Availability.objects.filter(id__in=available_ids).order_by('date')
      else:
        availabilities = Availability.objects.filter(minutes_remaining__gte=package.minutes).order_by('date')

      serialized_data = serializers.serialize('json', availabilities)
      return HttpResponse(serialized_data, status=200)
    except ObjectDoesNotExist:
      return HttpResponse(status=404)

  def availability_check(request):
    client_ip, _ = get_client_ip(request)
    if client_ip is not None:
      package_id = request.POST.get('package_id')
      package = Package.objects.get(id=package_id)
      availability_check = AvailabilityCheck(ip_address=client_ip, package=package)
      availability_check.save()
      return HttpResponse(status=201)
    return HttpResponse(status=400)

  def visit(request):
    client_ip, _ = get_client_ip(request)
    if client_ip is not None:
      visit = Visit(ip_address=client_ip)
      visit.save()
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
      availability = Availability.objects.get(id=availability_id)

      # Get selected package
      package_id = request.POST.get('package')
      package = Package.objects.get(id=package_id)

      # For two day package, remove both days
      if package.minutes > 480:
        availability = Availability.objects.get(id=availability_id)
        first = str(availability.date.date())
        second = str(availability.date.date() + datetime.timedelta(days=1))
        second_availability = Availability.objects.filter(date__range=[first, second])
        availability.minutes_remaining = 0
        second_availability.minutes_remaining = 0
        availability.save()
        second_availability.save()
      else:
        # Reduce miutes remaining on availability
        availability.minutes_remaining -= package.minutes
        availability.save()

      return HttpResponse(status=201)

    return HttpResponse(form.errors.as_json(), status=400)