function initialize() {

  // Cookie handling stuff
  function get_cookie(name) {
    let cookie_value = null;
    if (document.cookie && document.cookie != '') {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        cookie = jQuery.trim(cookie);

        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
          cookie_value = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookie_value;
  }

  const csrftoken = get_cookie('csrftoken');

  function csrfSafeMethod(method) {

    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  }

  $.ajaxSetup({
    beforeSend: function(xhr, settings) {
      if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
        xhr.setRequestHeader("X-CSRFToken", csrftoken);
      }
    }
  });

  // Navigation click handlers
  $('.navigation-button').click(function() {
    $('.navigation-button').removeClass('selected');
    const clickedButton = $(this);
    clickedButton.addClass('selected');

    $('.section').hide();
    const [clickedEl] = clickedButton;
    if (clickedEl.id === 'home-button') {
      $('#home-section').show();
    }
    else if (clickedEl.id === 'packages-button') {
      $('#packages-section').show();
    }
    else if (clickedEl.id === 'appointments-button') {
      $('#appointment-section').show();
    }

    return false;
  });

  const reviewButton = document.getElementById('review-appointment');
  reviewButton.onclick = reviewAppointment;

  const editButton = document.getElementById('edit-appointment');
  editButton.onclick = editAppointment;

  const homeButton = document.getElementById('back-to-home');
  homeButton.onclick = backToHome;

  // Form submit handler
  $('#appointment-form').submit(function() {

    // Remove disabled attribute in order to collect data, then re-disable them
    const disabled = $(this).find(':input:disabled').removeAttr('disabled');
    const formData = $(this).serialize();
    disabled.attr('disabled','true');

    $.ajax({
      type: 'POST',
      url: '/',
      data: formData,
      success: function() {
        $('#appointment-section').hide();
        $('#appointment-receipt').show();
      },
      error: function(response) {

        // Display errors
        const fieldErrors = JSON.parse(response.responseText);
        const ul = document.getElementById('form-errors');
        ul.innerHTML = '';
        for (const field in fieldErrors) {
          const [text] = fieldErrors[field];
          const li = document.createElement('li');
          li.appendChild(document.createTextNode(text.message));
          ul.appendChild(li);
        }

        // Go back to editing appointment
        editAppointment();
      }
    });

    return false;
  });

  // Initialize availabilities as hidden
  $('#availability').hide();

  // Show availabilities handler
  $('#show-availabilities').click(function() {
    $(this).hide();
    $('#availability').show();

    // Create an availability check
    const package_id = $('input[name=package]:checked').val();
    $.ajax({
      type: 'POST',
      url: '/availability_check/',
      data: {package_id},
      error: function(response) {
        console.log(response);
      }
    });

    // Scroll to bottom
    $("html, body").scrollTop($(document).height());
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let firstSelection = true;

  // Package selection handler
  $('input[name=package]').change(function() {

    const package_id = $('input[name=package]:checked').val();
    $.ajax({
      type: 'GET',
      url: '/package_availabilities/',
      data: {package_id},
      success: function(availabilities) {
        $('#availability').empty();

        // Get availability contianer
        const [container] = $('#availability');
        const [months] = $('<div/>', {id: 'months'});

        container.append(months);

        // Keep track of month
        let currentMonth = '';
        let dates = null;
        for (const availability of JSON.parse(availabilities)) {
          const dateString = availability.fields.date;
          const date = new Date(dateString);
          const nextMonth = date.toLocaleString('en-us', {month: 'long'}).toLowerCase();

          // When there's a new month, make an input for it
          if (nextMonth !== currentMonth) {
            currentMonth = nextMonth;

            // Create container for dates of each month
            [dates] = $('<div/>', {
              id: `${nextMonth}-dates`,
              class: 'dates'
            });

            container.append(dates);
            $(`#${nextMonth}-dates`).hide();

            // Create label for input
            const [monthLabel] = $(`<label>${nextMonth}</label>`)

            // Create month input and put it in months div
            const [monthInput] = $('<input/>', {
              type: 'radio',
              value: nextMonth,
              id: `${nextMonth}-input`,
              name: 'months'
            });

            monthLabel.append(monthInput)
            months.append(monthLabel);
          }

          // Create label for input
          const [dateLabel] = $(`<label>${days[date.getDay()]}, ${date.getDate()}</label>`)

          // Always append the date
          const [dateInput] = $('<input/>', {
            type: 'radio',
            value: availability.pk,
            name: 'availability'
          });

          dateLabel.append(dateInput)
          dates.append(dateLabel);
        }

        // Scroll to bottom on all but the initial selection
        if (!firstSelection) {
          $("html, body").scrollTop($(document).height());
        }

        firstSelection = false;

        // Put the check availabilities button back
        $('#show-availabilities').show();
        $('#availability').hide();

        // Create event listener for inputs
        $('input[name=months]').change(function() {

          // First, hide all showing dates
          $('.dates').hide();
          const month = this.value;
          if (this.checked) {

            // Show the one which was just checked
            $(`#${month}-dates`).show();

            // Scroll to bottom
            $("html, body").scrollTop($(document).height());
          }
        });
      },
      // error: function(response) {
      //   console.log(response)
      // }
    });
  });

  // Select the first package
  $('input[name=package]:first').attr('checked', true);

  // Trigger a change on the selected package
  $('input[name=package]:first').change();
}

function reviewAppointment(event) {

  // Remove packages
  const packages = document.getElementById('packages');
  packages.classList.add('hidden');

  // Change header
  const creationHeader = document.getElementById('creation-header');
  const reviewHeader = document.getElementById('review-header');
  const editHeader = document.getElementById('edit-header');
  creationHeader.classList.add('hidden');
  reviewHeader.classList.remove('hidden');
  editHeader.classList.add('hidden');

  // Change buttons
  const reviewButton = document.getElementById('review-appointment');
  const editButton = document.getElementById('edit-appointment');
  const submitButton = document.getElementById('submit-appointment');
  reviewButton.classList.add('hidden');
  editButton.classList.remove('hidden');
  submitButton.classList.remove('hidden');

  // Disable fields
  const fields = document.getElementById('appointment-form').elements;
  for (const field of fields) {
    if (field.id !== 'edit-appointment' &&
        field.id !== 'submit-appointment' &&
        field.type !== 'hidden')
    {
      field.disabled = true;
    }
  }
}

function editAppointment() {

  // Change header
  const reviewHeader = document.getElementById('review-header');
  const editHeader = document.getElementById('edit-header');
  reviewHeader.classList.add('hidden');
  editHeader.classList.remove('hidden');

  // Change buttons
  const reviewButton = document.getElementById('review-appointment');
  const editButton = document.getElementById('edit-appointment');
  const submitButton = document.getElementById('submit-appointment');
  reviewButton.classList.remove('hidden');
  editButton.classList.add('hidden');
  submitButton.classList.add('hidden');

  // Disable fields
  const fields = document.getElementById('appointment-form').elements;
  for (const field of fields) {
    field.disabled = false;
  }
}

function backToHome(event) {
  window.location = '';
}