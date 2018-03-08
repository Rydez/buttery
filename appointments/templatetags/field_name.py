from django import template

register = template.Library()

@register.filter
def field_name(value):
  return value.replace('_', ' ').title()