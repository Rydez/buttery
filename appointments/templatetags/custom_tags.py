from django import template

register = template.Library()

@register.filter
def field_name(value):
  return value.replace('_', ' ').title()


@register.filter
def twenty_off(value):
  return int(value * 0.80)