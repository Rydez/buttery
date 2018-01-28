from django.conf.urls import url

from . import views

app_name = 'appointments'
urlpatterns = [
  url(r'^$', views.AppointmentView.as_view(), name='index'),
  url(r'^package_availabilities/$', views.AppointmentView.package_availabilities, name='package_availabilities'),
]