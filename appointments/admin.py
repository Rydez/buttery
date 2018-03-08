from django.contrib import admin

from .models import Appointment, Availability, AvailabilityCheck, Package, Visit

admin.site.register(Appointment)
admin.site.register(Availability)
admin.site.register(AvailabilityCheck)
admin.site.register(Package)
admin.site.register(Visit)