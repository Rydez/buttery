from datetime import datetime

from django.db import models
from django.core.validators import RegexValidator

class Package(models.Model):
  name = models.CharField(max_length=200)
  service_type = models.CharField(default='', max_length=200)
  description = models.TextField()
  short_description = models.TextField(null=True)
  price = models.PositiveIntegerField()
  minutes = models.PositiveIntegerField()
  creation_date = models.DateTimeField(default=datetime.now, blank=True)

  def __str__(self):
    return '%s' % (self.name)

class Availability(models.Model):
  class Meta:
    verbose_name_plural = "Availabilities"

  date = models.DateTimeField()
  minutes_available = models.PositiveIntegerField()
  minutes_remaining = models.PositiveIntegerField()
  creation_date = models.DateTimeField(default=datetime.now, blank=True)

  def __str__(self):
    return str(self.date)

class AvailabilityCheck(models.Model):
  ip_address = models.GenericIPAddressField()
  package = models.ForeignKey(Package)
  creation_date = models.DateTimeField(default=datetime.now, blank=True)

  def __str__(self):
    return str(self.ip_address)

class Visit(models.Model):
  ip_address = models.GenericIPAddressField()
  creation_date = models.DateTimeField(default=datetime.now, blank=True)

  def __str__(self):
    return str(self.ip_address)

class Appointment(models.Model):
  first_name = models.CharField(max_length=100)
  last_name = models.CharField(max_length=100)
  email = models.EmailField(max_length=100)
  phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Enter a valid phone number")
  phone_number = models.CharField(validators=[phone_regex], max_length=17)
  city = models.CharField(max_length=100)
  address = models.CharField(max_length=100)
  zip_code = models.PositiveIntegerField()
  package = models.ForeignKey(Package, on_delete=models.PROTECT, null=True) # This should not be nullable
  availability = models.ForeignKey(Availability, on_delete=models.PROTECT, null=True) # This should not be nullable
  validated = models.BooleanField(default=False, blank=True)
  creation_date = models.DateTimeField(default=datetime.now, blank=True)

  def __str__(self):
    return '%s %s' % (self.first_name, self.last_name)
