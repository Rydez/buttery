from re import sub

from django.forms import ModelForm
from appointments.models import Appointment

class AppointmentForm(ModelForm):
  def __init__(self, *args, **kwargs):
    super(AppointmentForm, self).__init__(*args, **kwargs)
    self.fields['special_notes'].widget.attrs['placeholder'] = 'Please enter any special notes you have for us.'

  class Meta:
    model = Appointment
    fields = [
      'first_name',
      'last_name',
      'email',
      'phone_number',
      'address',
      'city',
      'zip_code',
      'special_notes',
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