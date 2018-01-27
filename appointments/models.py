from datetime import datetime

from django.db import models
from django.core.validators import RegexValidator

class Appointment(models.Model):
  first_name = models.CharField(max_length=100)
  last_name = models.CharField(max_length=100)
  email = models.EmailField(max_length=100)
  phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Enter a valid phone number")
  phone_number = models.CharField(validators=[phone_regex], max_length=17)
  city = models.CharField(max_length=100)
  address = models.CharField(max_length=100)
  zip_code = models.PositiveIntegerField()
  validated = models.BooleanField(default=False, blank=True)
  package_number = models.PositiveSmallIntegerField()
  creation_date = models.DateTimeField(default=datetime.now, blank=True)
  appointment_date = models.DateTimeField()

