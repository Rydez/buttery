from re import sub

from django.forms import ModelForm
from appointments.models import Appointment

class AppointmentForm(ModelForm):
  class Meta:
    model = Appointment
    fields = [
      'first_name',
      'last_name',
      'email',
      'phone_number',
      'city',
      'address',
      'zip_code',
      'package',
      'availability',
    ]
    error_messages = {
      'phone_number': {
        'blank': ("Enter a valid phone number"),
      },
    }

  def clean_phone_number(self):
    data = self.cleaned_data['phone_number']
    data = sub(r'\D', '', data)
    return data