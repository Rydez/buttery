from django import template

register = template.Library()

# Replace underscore with white space and capitalize words
@register.filter
def field_name(value):
  return value.replace('_', ' ').title()

# Return 20% off of input number
@register.filter
def twenty_off(value):
  return int(value * 0.80)

# Return the dict value for key
@register.filter
def get_item(dictionary, key):
  return dictionary.get(key)

# Return formatted month
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

@register.filter
def month(value):
  return months[value - 1]

# Return formatted day
days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

@register.filter
def day(value):
  day_of_week = value.weekday()
  return days[day_of_week]

@register.filter
def sorted_keys_list(dictionary):
  keys = list(dictionary.keys())
  keys.sort()
  return keys