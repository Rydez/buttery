from django.conf.urls import url

from . import views

app_name = 'appointments'
urlpatterns = [
  url(r'^$', views.HomeView.as_view(), name='home'),
  url(r'^packages/$', views.PackageView.as_view(), name='packages'),
  url(r'^appointments/$', views.AppointmentView.as_view(), name='appointments'),
  url(r'^availability_check/$', views.AppointmentView.availability_check, name='availability_check'),
]