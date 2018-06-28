from django.conf.urls import url

from . import views

app_name = 'appointments'
urlpatterns = [
  url(r'^$', views.HomeView.as_view(), name='home'),
  url(r'^packages/$', views.PackageView.as_view(), name='packages'),
  url(r'^dealerships/$', views.DealershipView.as_view(), name='dealerships'),
  # url(r'^appointments/$', views.AppointmentView.as_view(), name='appointments'),
  # url(r'^availability_check/$', views.AppointmentView.availability_check, name='availability_check'),
  # url(r'^create_appointment/$', views.AppointmentView.create_appointment, name='create_appointment'),
]