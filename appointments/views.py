import os
import datetime
import json
from email.mime.image import MIMEImage

from django.views import generic
from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from django.core import serializers
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.template import Context

from ipware import get_client_ip

from appointments.models import Appointment, Package, Availability, AvailabilityCheck

from .forms import AppointmentForm

class HomeView(generic.TemplateView):
  template_name = 'appointments/index.html'

class PackageView(generic.ListView):
	template_name = 'appointments/packages.html'
	context_object_name = 'packages'

	def get_queryset(self):
		return Package.objects.all()

  # def get_context_data(self, **kwargs):
  #   context = super().get_context_data(**kwargs)
  #   context['package_list'] = Package.objects.all()
  #   return context

class AppointmentView(generic.CreateView):
  form_class = AppointmentForm
  template_name = 'appointments/appointments.html'

  def get_context_data(self, **kwargs):
    context = super(AppointmentView, self).get_context_data(**kwargs)

    filtered_availabilities = {}
    packages = Package.objects.all()
    context['packages'] = Package.objects.all()

    for package in packages:
      # Dict for package -> month -> day
      filtered_availabilities[package.id] = {}

      # Complete list of availabilities that work for this package
      all_filtered_avails = []

      # Date of one week from now
      one_week_away = datetime.datetime.now() + datetime.timedelta(days=7)

      # Check if this is a two day job
      if (package.minutes > 480):
        first_day = None
        available_ids = []
        all_availabilities = Availability.objects.all().order_by('date')
        for avail in all_availabilities:

          # Get a full first day
          if not first_day and avail.minutes_remaining == 480:
            first_day = avail

          # Get a second full day
          elif first_day:
            date_format = '%Y-%m-%d'
            first_day_date = datetime.datetime.strptime(str(first_day.date.date()), date_format)
            availability_date = datetime.datetime.strptime(str(avail.date.date()), date_format)
            date_detla = availability_date - first_day_date
            if date_detla.days == 1 and avail.minutes_remaining == 480:
              available_ids.append(first_day.id)
            elif avail.minutes_remaining == 480:
              first_day = avail
            else:
              # Start over
              first_day = None

        all_filtered_avails = Availability.objects.filter(id__in=available_ids, date__gt=one_week_away).order_by('date')
      else:
        all_filtered_avails = Availability.objects.filter(minutes_remaining__gte=package.minutes, date__gt=one_week_away).order_by('date')

      for avail in all_filtered_avails:
        if avail.date.month in filtered_availabilities[package.id]:
          filtered_availabilities[package.id][avail.date.month].append(avail)
        else:
          filtered_availabilities[package.id][avail.date.month] = [avail]
    print(filtered_availabilities)
    context['filtered_availabilities'] = filtered_availabilities
    return context


  # def package_availabilities(request):
  #   package_id = request.GET.get('package_id')
  #   package = None
  #   try:
  #     package = Package.objects.get(id=package_id)
  #     availabilities = None

  #     one_week_away = datetime.datetime.now() + datetime.timedelta(days=7)

  #     # Check if this is a two day job
  #     if (package.minutes > 480):
  #       first_day = None
  #       available_ids = []
  #       availabilities = Availability.objects.all().order_by('date')
  #       for availability in availabilities:

  #         # Get a full first day
  #         if not first_day and availability.minutes_remaining == 480:
  #           first_day = availability
  #         # Get a second full day
  #         elif first_day:
  #           date_format = '%Y-%m-%d'
  #           first_day_date = datetime.datetime.strptime(str(first_day.date.date()), date_format)
  #           availability_date = datetime.datetime.strptime(str(availability.date.date()), date_format)
  #           date_detla = availability_date - first_day_date
  #           if date_detla.days == 1 and availability.minutes_remaining == 480:
  #             available_ids.append(first_day.id)
  #           elif availability.minutes_remaining == 480:
  #             first_day = availability
  #           else:
  #             # Start over
  #             first_day = None

  #       availabilities = Availability.objects.filter(id__in=available_ids, date__gt=one_week_away).order_by('date')
  #     else:
  #       availabilities = Availability.objects.filter(minutes_remaining__gte=package.minutes, date__gt=one_week_away).order_by('date')

  #     serialized_data = serializers.serialize('json', availabilities)
  #     return HttpResponse(serialized_data, status=200)
  #   except ObjectDoesNotExist:
  #     return HttpResponse(status=404)

  def availability_check(request):
    client_ip, _ = get_client_ip(request)
    if client_ip is not None:
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

      # Get selected availability
      availability_id = request.POST.get('availability')
      availability = Availability.objects.get(id=availability_id)

      # Get selected package
      package_id = request.POST.get('package')
      package = Package.objects.get(id=package_id)

      template_context = {
        'post_data': request.POST.dict(),
        'availability_date': availability.date.strftime('%A, %B %d, %Y'),
        'package_name': package.name
      }

      text_content = ''
      html_content = render_to_string('appointments/email.html', template_context)

      subject = 'Appointment Details'
      from_email = 'support@butteryaf.com'
      to_us = 'support@butteryaf.com'
      to_them = request.POST.get('email')

      for field in request.POST:
        if field == 'availability':
          text = 'date: ' + str(availability.date) + ', '
          text_content += text
        elif field == 'package':
          text = 'package: ' + str(package.name) + ', '
          text_content += text
        elif field != 'csrfmiddlewaretoken' and field != 'months' and field != 'email':
          text = field + ': ' + str(request.POST.get(field)) + ', '
          text_content += text

      msg = EmailMultiAlternatives(subject, text_content, from_email, [to_us, to_them])
      msg.attach_alternative(html_content, "text/html")
      msg.send()

      # For two day package, remove both days
      if package.minutes > 480:
        availability = Availability.objects.get(id=availability_id)

        # To make our range, start with the beginning of the availability day
        first = str(availability.date.date())

        # End on the beginning of two days later. So, begin, say, at the 2nd,
        # and end on the 4th. Availabilities on the 4th wont be included because
        # it's the beginning.
        second = str(availability.date.date() + datetime.timedelta(days=2))

        # Exclude the first availability
        second_availability = Availability.objects.exclude(id=availability_id).get(date__range=[first, second])

        if (availability.minutes_remaining == 0 or second_availability.minutes_remaining == 0):
          errors = {'availability': ['Sorry, that availability was just taken.']}
          return HttpResponse(json.dumps(errors), status=400)

        availability.minutes_remaining = 0
        second_availability.minutes_remaining = 0
        availability.save()
        second_availability.save()
      else:
        if (availability.minutes_remaining < package.minutes):
          errors = {'availability': ['Sorry, that availability was just taken.']}
          return HttpResponse(json.dumps(errors), status=400)

        # Reduce miutes remaining on availability
        availability.minutes_remaining -= package.minutes
        availability.save()

      return HttpResponse(status=201)

    return HttpResponse(form.errors.as_json(), status=400)